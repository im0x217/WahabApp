'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { AssetStrip } from '@/components/asset-strip'
import { BottomNav } from '@/components/bottom-nav'
import { ClientVaultCard } from '@/components/client-vault-card'
import { EodReport } from '@/components/eod-report'
import { TradeSheet } from '@/components/trade-sheet'
import { VaultHero } from '@/components/vault-hero'
import { buildEodSummary, formatDateTime, formatCurrency, getAssetIcon, getAssetLabel, getRateUnitLabel, getTradeLabel, seedVaults } from '@/lib/trading'
import { AssetDefinition, AssetType, DEFAULT_ASSET_DEFINITIONS, RateUnit, TradeType, Transaction, Vault } from '@/types/trading'
import { ArrowDownToLine, ArrowUpFromLine, FileBarChart, TrendingDown, TrendingUp } from 'lucide-react'

export default function HomePage() {
  const [assets, setAssets] = useState<AssetDefinition[]>(DEFAULT_ASSET_DEFINITIONS)
  const [vaults, setVaults] = useState<Vault[]>(seedVaults)
  const [ledger, setLedger] = useState<Transaction[]>([])
  const [showReport, setShowReport] = useState(false)
  const [tradeMode, setTradeMode] = useState<TradeType>('Buy')
  const [activeVaultId, setActiveVaultId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState('')
  const [rateUnit, setRateUnit] = useState<RateUnit>('unit')
  const [description, setDescription] = useState('')
  const [asset, setAsset] = useState<AssetType>(DEFAULT_ASSET_DEFINITIONS[0]?.id ?? 'Dollars')
  const [formError, setFormError] = useState('')
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [showAssetCrud, setShowAssetCrud] = useState(false)
  const [assetTypeError, setAssetTypeError] = useState('')
  const [assetDraft, setAssetDraft] = useState<AssetDefinition>({
    id: '',
    label: '',
    icon: '💱',
    color: 'from-sky-500/20 to-sky-300/5',
    supportsWeightRate: false,
  })

  const syncVaultBalances = (items: Vault[], assetTypes: AssetDefinition[]) => {
    const ids = assetTypes.map((entry) => entry.id)
    return items.map((vault) => ({
      ...vault,
      balances: Object.fromEntries(ids.map((id) => [id, Number(vault.balances[id] ?? 0)])),
    }))
  }

  useEffect(() => {
    let mounted = true

    const loadInitialData = async () => {
      try {
        const [assetsResponse, vaultsResponse, tradesResponse] = await Promise.all([
          fetch('/api/assets', { cache: 'no-store' }),
          fetch('/api/vaults', { cache: 'no-store' }),
          fetch('/api/trades', { cache: 'no-store' }),
        ])

        if (!assetsResponse.ok || !vaultsResponse.ok || !tradesResponse.ok) {
          return
        }

        const assetsPayload = (await assetsResponse.json()) as { items?: AssetDefinition[] }
        const vaultsPayload = (await vaultsResponse.json()) as { items?: Vault[] }
        const tradesPayload = (await tradesResponse.json()) as { items?: Transaction[] }

        if (!mounted) return

        const assetItems = Array.isArray(assetsPayload.items) && assetsPayload.items.length > 0
          ? assetsPayload.items
          : DEFAULT_ASSET_DEFINITIONS

        setAssets(assetItems)

        if (Array.isArray(vaultsPayload.items) && vaultsPayload.items.length > 0) {
          setVaults(syncVaultBalances(vaultsPayload.items, assetItems))
        }

        if (Array.isArray(tradesPayload.items)) {
          setLedger(tradesPayload.items)
        }
      } catch {}
    }

    loadInitialData()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!assets.find((entry) => entry.id === asset)) {
      setAsset(assets[0]?.id ?? 'Dollars')
    }
  }, [assets, asset])

  useEffect(() => {
    if (!showAssetCrud) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showAssetCrud])

  const mainVault = vaults.find((vault) => vault.kind === 'Main') ?? vaults[0]
  const clientVaults = vaults.filter((vault) => vault.kind === 'Client')
  const activeVault = vaults.find((vault) => vault.id === activeVaultId) ?? null

  const reportRows = useMemo(() => buildEodSummary(ledger, assets), [ledger, assets])

  const openTrade = (vaultId: string, mode: TradeType) => {
    setTradeMode(mode)
    setActiveVaultId(vaultId)
    setAmount('')
    setRate('')
    setRateUnit('unit')
    setDescription('')
    setAsset((current) => current || assets[0]?.id || 'Dollars')
    setFormError('')
  }

  const closeTrade = () => {
    setActiveVaultId(null)
    setDescription('')
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

  const resetAssetDraft = () => {
    setEditingAssetId(null)
    setShowAssetCrud(false)
    setAssetTypeError('')
    setAssetDraft({
      id: '',
      label: '',
      icon: '💱',
      color: 'from-sky-500/20 to-sky-300/5',
      supportsWeightRate: false,
    })
  }

  const submitTrade = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeVaultId) return

    const parsedAmount = parseDecimal(amount)
    const parsedRate = tradeMode === 'Buy' || tradeMode === 'Sell' ? parseDecimal(rate) : 0
    const selectedAssetDefinition = assets.find((entry) => entry.id === asset)
    const resolvedRateUnit: RateUnit = selectedAssetDefinition?.supportsWeightRate ? rateUnit : 'unit'

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('يجب أن تكون الكمية أكبر من صفر.')
      return
    }

    if ((tradeMode === 'Buy' || tradeMode === 'Sell') && (!Number.isFinite(parsedRate) || parsedRate <= 0)) {
      setFormError('يجب أن يكون السعر أكبر من صفر.')
      return
    }

    if ((tradeMode === 'Incoming' || tradeMode === 'Outgoing') && !description.trim()) {
      setFormError('يرجى إدخال وصف لعملية الوارد/الصادر.')
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
      setFormError(`الرصيد غير كافٍ من ${getAssetLabel(asset, assets)} لعملية البيع.`)
      return
    }

    if (tradeMode === 'Outgoing' && targetVault.balances[asset] < parsedAmount) {
      setFormError(`الرصيد غير كافٍ من ${getAssetLabel(asset, assets)} لعملية الصادر.`)
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

    const previousVaults = vaults
    const previousLedger = ledger

    const nextVaults = vaults.map((vault) => {
      const shouldApplyToTarget = vault.id === activeVaultId
      const shouldApplyToMain = Boolean(isClientTransaction && mainVaultId && vault.id === mainVaultId)

      if (!shouldApplyToTarget && !shouldApplyToMain) return vault

      return {
        ...vault,
        balances: computeNextBalances(vault),
      }
    })

    setVaults(nextVaults)

    const entry: Transaction = {
      id: crypto.randomUUID(),
      vaultId: activeVaultId,
      type: tradeMode,
      asset,
      amount: parsedAmount,
      rate: parsedRate,
      rateUnit: resolvedRateUnit,
      description: description.trim() || undefined,
      timestamp: new Date().toISOString(),
    }

    setLedger((previous) => [entry, ...previous])

    const [tradeResponse, vaultsResponse] = await Promise.all([
      fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entry.id,
          vaultId: entry.vaultId,
          type: entry.type,
          asset: entry.asset,
          amount: entry.amount,
          rate: entry.rate,
          rateUnit: entry.rateUnit,
          description: entry.description,
          timestamp: entry.timestamp,
        }),
      }),
      fetch('/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: nextVaults }),
      }),
    ])

    if (!tradeResponse.ok || !vaultsResponse.ok) {
      setVaults(previousVaults)
      setLedger(previousLedger)
      setFormError('تعذر حفظ العملية في قاعدة البيانات. تحقق من إعداد DATABASE_URL وأعد المحاولة.')
      return
    }

    closeTrade()
  }

  const removeAssetType = async (id: string) => {
    const response = await fetch('/api/assets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string }
      setAssetTypeError(payload.error ?? 'تعذر حذف نوع العملة الآن.')
      return
    }

    const refreshed = await fetch('/api/assets', { cache: 'no-store' })
    if (!refreshed.ok) return
    const payload = (await refreshed.json()) as { items?: AssetDefinition[] }
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      setAssets(payload.items)
      setVaults((previous) => syncVaultBalances(previous, payload.items ?? []))
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-3 pb-24 pt-4 sm:px-5 sm:pb-8">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:gap-6">
        <section>
          <VaultHero vault={mainVault} assets={assets} />
          <AssetStrip
            vault={mainVault}
            assets={assets}
            onOpenAssetManager={() => {
              setEditingAssetId(null)
              setShowAssetCrud(true)
              setAssetTypeError('')
            }}
          />

          <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-sm">
            <button
              onClick={() => openTrade(mainVault.id, 'Buy')}
              className="inline-flex items-center justify-center gap-1 rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-400 active:scale-[0.98]"
            >
              <TrendingUp size={16} />شراء في الخزنة الرئيسية
            </button>
            <button
              onClick={() => openTrade(mainVault.id, 'Sell')}
              className="inline-flex items-center justify-center gap-1 rounded-2xl bg-rose-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-400 active:scale-[0.98]"
            >
              <TrendingDown size={16} />بيع من الخزنة الرئيسية
            </button>
            <button
              onClick={() => openTrade(mainVault.id, 'Incoming')}
              className="inline-flex items-center justify-center gap-1 rounded-2xl bg-sky-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-400 active:scale-[0.98]"
            >
              <ArrowDownToLine size={16} />وارد للخزنة الرئيسية
            </button>
            <button
              onClick={() => openTrade(mainVault.id, 'Outgoing')}
              className="inline-flex items-center justify-center gap-1 rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-amber-400 active:scale-[0.98]"
            >
              <ArrowUpFromLine size={16} />صادر من الخزنة الرئيسية
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
                    <p className="text-sm text-white">{getTradeLabel(item.type)} {getAssetIcon(item.asset, assets)} {getAssetLabel(item.asset, assets)} • {item.vaultId}</p>
                    <p className="text-xs text-fintech-muted">{formatDateTime(item.timestamp)}</p>
                    {item.description ? <p className="text-xs text-fintech-muted">{item.description}</p> : null}
                  </div>
                  <p className="numeric text-sm text-fintech-text">
                    {item.type === 'Incoming' || item.type === 'Outgoing'
                      ? formatCurrency(item.amount)
                      : `${formatCurrency(item.amount)} × ${formatCurrency(item.rate)} ${getRateUnitLabel(item.rateUnit)}`}
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
              assets={assets}
              onBuy={(id) => openTrade(id, 'Buy')}
              onSell={(id) => openTrade(id, 'Sell')}
              onIncoming={(id) => openTrade(id, 'Incoming')}
              onOutgoing={(id) => openTrade(id, 'Outgoing')}
            />
          ))}
        </div>
      </section>

      {showAssetCrud ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={resetAssetDraft}>
          <div
            className="glass flex h-[100dvh] w-full flex-col overflow-hidden rounded-none sm:h-auto sm:max-h-[92dvh] sm:max-w-3xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-fintech-border px-3 py-3 sm:px-4">
              <h3 className="text-lg font-semibold text-white">{editingAssetId ? 'تعديل نوع العملة' : 'إضافة نوع عملة جديد'}</h3>
              <button
                type="button"
                onClick={resetAssetDraft}
                className="rounded-xl bg-white/10 px-3 py-1.5 text-xs text-fintech-text"
              >
                إغلاق
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4">
              <div className="mb-3 grid gap-2">
                {assets.map((entry) => (
                  <article
                    key={entry.id}
                    className={`rounded-2xl bg-gradient-to-br ${entry.color} glass p-3 transition duration-300`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-fintech-muted">
                        {entry.icon} {entry.label} ({entry.id})
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAssetId(entry.id)
                            setAssetDraft(entry)
                            setAssetTypeError('')
                          }}
                          className="rounded-xl bg-white/10 px-3 py-1.5 text-xs text-fintech-text"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAssetType(entry.id)}
                          className="rounded-xl bg-rose-500/20 px-3 py-1.5 text-xs text-rose-300"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <form
                className="grid gap-2 sm:grid-cols-2"
                onSubmit={async (event) => {
                  event.preventDefault()
                  setAssetTypeError('')

                  const method = editingAssetId ? 'PUT' : 'POST'
                  const response = await fetch('/api/assets', {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(assetDraft),
                  })

                  if (!response.ok) {
                    const payload = (await response.json().catch(() => ({}))) as { error?: string }
                    setAssetTypeError(payload.error ?? 'تعذر حفظ نوع العملة الآن.')
                    return
                  }

                  const refreshed = await fetch('/api/assets', { cache: 'no-store' })
                  if (!refreshed.ok) return
                  const payload = (await refreshed.json()) as { items?: AssetDefinition[] }
                  if (Array.isArray(payload.items) && payload.items.length > 0) {
                    setAssets(payload.items)
                    setVaults((previous) => syncVaultBalances(previous, payload.items ?? []))
                  }

                  resetAssetDraft()
                }}
              >
                <input
                  value={assetDraft.id}
                  onChange={(event) => setAssetDraft((previous) => ({ ...previous, id: event.target.value }))}
                  placeholder="رمز ثابت (USD, GBP...)"
                  className="rounded-2xl border border-fintech-border bg-fintech-panelSoft px-3 py-2 text-sm text-white"
                  disabled={Boolean(editingAssetId)}
                  required
                />
                <input
                  value={assetDraft.label}
                  onChange={(event) => setAssetDraft((previous) => ({ ...previous, label: event.target.value }))}
                  placeholder="الاسم"
                  className="rounded-2xl border border-fintech-border bg-fintech-panelSoft px-3 py-2 text-sm text-white"
                  required
                />
                <input
                  value={assetDraft.icon}
                  onChange={(event) => setAssetDraft((previous) => ({ ...previous, icon: event.target.value }))}
                  placeholder="الأيقونة (€, $, 🥇 ...)"
                  className="rounded-2xl border border-fintech-border bg-fintech-panelSoft px-3 py-2 text-sm text-white"
                  required
                />
                <select
                  value={assetDraft.color}
                  onChange={(event) => setAssetDraft((previous) => ({ ...previous, color: event.target.value }))}
                  className="rounded-2xl border border-fintech-border bg-fintech-panelSoft px-3 py-2 text-sm text-white"
                >
                  <option value="from-sky-500/20 to-sky-300/5">Blue</option>
                  <option value="from-violet-500/20 to-violet-300/5">Violet</option>
                  <option value="from-emerald-500/20 to-emerald-300/5">Emerald</option>
                  <option value="from-amber-500/20 to-amber-300/5">Amber</option>
                  <option value="from-rose-500/20 to-rose-300/5">Rose</option>
                  <option value="from-slate-400/20 to-slate-200/5">Slate</option>
                </select>
                <label className="col-span-full flex items-center gap-2 text-sm text-fintech-muted">
                  <input
                    type="checkbox"
                    checked={assetDraft.supportsWeightRate}
                    onChange={(event) => setAssetDraft((previous) => ({ ...previous, supportsWeightRate: event.target.checked }))}
                  />
                  استخدام تسعير بالجرام/الأونصة/الكيلو
                </label>

                {assetTypeError ? <p className="col-span-full rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-300">{assetTypeError}</p> : null}

                <div className="col-span-full flex gap-2 pb-1">
                  <button type="submit" className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white">
                    {editingAssetId ? 'حفظ التعديل' : 'إضافة نوع جديد'}
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-fintech-text"
                    onClick={resetAssetDraft}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowReport((prev) => !prev)}
        className="fixed bottom-20 left-4 z-40 inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-sky-400 active:scale-[0.98] sm:bottom-6"
        aria-label="إنشاء تقرير نهاية اليوم"
      >
        <FileBarChart size={16} />إنشاء تقرير نهاية اليوم
      </button>

      <EodReport rows={reportRows} assets={assets} open={showReport} />

      <TradeSheet
        isOpen={Boolean(activeVault)}
        mode={tradeMode}
        selectedVault={activeVault}
        assets={assets}
        amount={amount}
        rate={rate}
        rateUnit={rateUnit}
        description={description}
        asset={asset}
        formError={formError}
        onClose={closeTrade}
        onChangeAmount={setAmount}
        onChangeRate={setRate}
        onChangeDescription={setDescription}
        onChangeAsset={setAsset}
        onChangeRateUnit={setRateUnit}
        onSubmit={submitTrade}
      />

      <BottomNav />
    </main>
  )
}
