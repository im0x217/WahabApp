'use client'

import { FormEvent, useMemo, useState } from 'react'
import { AssetStrip } from '@/components/asset-strip'
import { BottomNav } from '@/components/bottom-nav'
import { ClientVaultCard } from '@/components/client-vault-card'
import { EodReport } from '@/components/eod-report'
import { TradeSheet } from '@/components/trade-sheet'
import { VaultHero } from '@/components/vault-hero'
import { buildEodSummary, formatDateTime, formatCurrency, getAssetLabel, getTradeLabel, seedVaults } from '@/lib/trading'
import { AssetType, TradeType, Transaction, Vault } from '@/types/trading'

export default function HomePage() {
  const [vaults, setVaults] = useState<Vault[]>(seedVaults)
  const [ledger, setLedger] = useState<Transaction[]>([])
  const [showReport, setShowReport] = useState(false)
  const [tradeMode, setTradeMode] = useState<TradeType>('Buy')
  const [activeVaultId, setActiveVaultId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState('')
  const [asset, setAsset] = useState<AssetType>('Dollars')
  const [formError, setFormError] = useState('')

  const mainVault = vaults.find((vault) => vault.kind === 'Main') ?? vaults[0]
  const clientVaults = vaults.filter((vault) => vault.kind === 'Client')
  const activeVault = vaults.find((vault) => vault.id === activeVaultId) ?? null

  const reportRows = useMemo(() => buildEodSummary(ledger), [ledger])

  const openTrade = (vaultId: string, mode: TradeType) => {
    setTradeMode(mode)
    setActiveVaultId(vaultId)
    setAmount('')
    setRate('')
    setAsset('Dollars')
    setFormError('')
  }

  const closeTrade = () => {
    setActiveVaultId(null)
    setFormError('')
  }

  const modeBadgeColor = (mode: TradeType) => {
    if (mode === 'Buy') return 'bg-emerald-400'
    if (mode === 'Sell') return 'bg-rose-400'
    if (mode === 'Incoming') return 'bg-sky-400'
    return 'bg-amber-400'
  }

  const parseDecimal = (value: string) => {
    const normalized = value
      .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
      .replace(/,/g, '.')
    return Number(normalized)
  }

  const submitTrade = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeVaultId) return

    const parsedAmount = parseDecimal(amount)
    const parsedRate = tradeMode === 'Buy' || tradeMode === 'Sell' ? parseDecimal(rate) : 0

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('يجب أن تكون الكمية أكبر من صفر.')
      return
    }

    if ((tradeMode === 'Buy' || tradeMode === 'Sell') && (!Number.isFinite(parsedRate) || parsedRate <= 0)) {
      setFormError('يجب أن يكون السعر أكبر من صفر.')
      return
    }

    const costInLyd = parsedAmount * parsedRate
    const targetVault = vaults.find((vault) => vault.id === activeVaultId)

    if (!targetVault) {
      setFormError('الخزنة غير موجودة.')
      return
    }

    if ((tradeMode === 'Buy' || tradeMode === 'Sell') && asset === 'LYD') {
      setFormError('شراء أو بيع الدينار الليبي مباشرة غير مدعوم في هذا التدفق.')
      return
    }

    if (tradeMode === 'Buy' && targetVault.balances.LYD < costInLyd) {
      setFormError('رصيد الدينار الليبي غير كافٍ لعملية الشراء.')
      return
    }

    if (tradeMode === 'Sell' && targetVault.balances[asset] < parsedAmount) {
      setFormError(`الرصيد غير كافٍ من ${getAssetLabel(asset)} لعملية البيع.`)
      return
    }

    if (tradeMode === 'Outgoing' && targetVault.balances[asset] < parsedAmount) {
      setFormError(`الرصيد غير كافٍ من ${getAssetLabel(asset)} لعملية الصادر.`)
      return
    }

    const isClientTransaction = targetVault.kind === 'Client'
    const mainVaultInState = vaults.find((vault) => vault.kind === 'Main')
    const mainVaultId = mainVaultInState?.id

    const computeNextBalances = (vault: Vault) => {
      const next = { ...vault.balances }
      if (tradeMode === 'Buy') {
        next[asset] = Number((next[asset] + parsedAmount).toFixed(4))
        next.LYD = Number((next.LYD - costInLyd).toFixed(4))
      } else if (tradeMode === 'Sell') {
        next[asset] = Number((next[asset] - parsedAmount).toFixed(4))
        next.LYD = Number((next.LYD + costInLyd).toFixed(4))
      } else if (tradeMode === 'Incoming') {
        next[asset] = Number((next[asset] + parsedAmount).toFixed(4))
      } else {
        next[asset] = Number((next[asset] - parsedAmount).toFixed(4))
      }
      return next
    }

    if (isClientTransaction && mainVaultInState) {
      const mainNext = computeNextBalances(mainVaultInState)
      if (mainNext[asset] < 0 || mainNext.LYD < 0) {
        setFormError('رصيد الخزنة الرئيسية لا يسمح بتنفيذ هذه العملية من خزنة فرعية.')
        return
      }
    }

    setFormError('')

    setVaults((previous) =>
      previous.map((vault) => {
        const shouldApplyToTarget = vault.id === activeVaultId
        const shouldApplyToMain = Boolean(isClientTransaction && mainVaultId && vault.id === mainVaultId)

        if (!shouldApplyToTarget && !shouldApplyToMain) return vault

        return {
          ...vault,
          balances: computeNextBalances(vault),
        }
      }),
    )

    const entry: Transaction = {
      id: crypto.randomUUID(),
      vaultId: activeVaultId,
      type: tradeMode,
      asset,
      amount: parsedAmount,
      rate: parsedRate,
      timestamp: new Date().toISOString(),
    }

    setLedger((previous) => [entry, ...previous])

    fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vaultId: entry.vaultId,
        type: entry.type,
        asset: entry.asset,
        amount: entry.amount,
        rate: entry.rate,
        timestamp: entry.timestamp,
      }),
    }).catch(() => undefined)

    closeTrade()
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-3 pb-24 pt-4 sm:px-5 sm:pb-8">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:gap-6">
        <section>
          <VaultHero vault={mainVault} />
          <AssetStrip vault={mainVault} />

          <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-sm">
            <button
              onClick={() => openTrade(mainVault.id, 'Buy')}
              className="rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-400 active:scale-[0.98]"
            >
              شراء في الخزنة الرئيسية
            </button>
            <button
              onClick={() => openTrade(mainVault.id, 'Sell')}
              className="rounded-2xl bg-rose-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-400 active:scale-[0.98]"
            >
              بيع من الخزنة الرئيسية
            </button>
            <button
              onClick={() => openTrade(mainVault.id, 'Incoming')}
              className="rounded-2xl bg-sky-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-400 active:scale-[0.98]"
            >
              وارد للخزنة الرئيسية
            </button>
            <button
              onClick={() => openTrade(mainVault.id, 'Outgoing')}
              className="rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-amber-400 active:scale-[0.98]"
            >
              صادر من الخزنة الرئيسية
            </button>
          </div>
        </section>

        <section className="glass rounded-3xl p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">آخر العمليات</h2>
            <span className="text-xs text-fintech-muted">{formatCurrency(ledger.length)} سجل</span>
          </div>

          <ul className="space-y-2" role="list" aria-label="سجل العمليات">
            {ledger.length === 0 ? (
              <li className="rounded-2xl bg-fintech-panelSoft p-3 text-sm text-fintech-muted">لا توجد عمليات حتى الآن.</li>
            ) : (
              ledger.slice(0, 8).map((item) => (
                <li key={item.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-fintech-panelSoft p-3">
                  <span className={`h-2 w-2 rounded-full ${modeBadgeColor(item.type)}`} aria-hidden="true" />
                  <div>
                    <p className="text-sm text-white">{getTradeLabel(item.type)} {getAssetLabel(item.asset)} • {item.vaultId}</p>
                    <p className="text-xs text-fintech-muted">{formatDateTime(item.timestamp)}</p>
                  </div>
                  <p className="numeric text-sm text-fintech-text">
                    {item.type === 'Incoming' || item.type === 'Outgoing'
                      ? formatCurrency(item.amount)
                      : `${formatCurrency(item.amount)} × ${formatCurrency(item.rate)}`}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">خزائن العملاء الفرعية</h2>
          <p className="text-xs text-fintech-muted">توزيع المحفظة حسب الأصل</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {clientVaults.map((client) => (
            <ClientVaultCard
              key={client.id}
              vault={client}
              onBuy={(id) => openTrade(id, 'Buy')}
              onSell={(id) => openTrade(id, 'Sell')}
              onIncoming={(id) => openTrade(id, 'Incoming')}
              onOutgoing={(id) => openTrade(id, 'Outgoing')}
            />
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => setShowReport((prev) => !prev)}
        className="fixed bottom-20 left-4 z-40 rounded-full bg-sky-500 px-5 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-sky-400 active:scale-[0.98] sm:bottom-6"
        aria-label="إنشاء تقرير نهاية اليوم"
      >
        إنشاء تقرير نهاية اليوم
      </button>

      <EodReport rows={reportRows} open={showReport} />

      <TradeSheet
        isOpen={Boolean(activeVault)}
        mode={tradeMode}
        selectedVault={activeVault}
        amount={amount}
        rate={rate}
        asset={asset}
        formError={formError}
        onClose={closeTrade}
        onChangeAmount={setAmount}
        onChangeRate={setRate}
        onChangeAsset={setAsset}
        onSubmit={submitTrade}
      />

      <BottomNav />
    </main>
  )
}
