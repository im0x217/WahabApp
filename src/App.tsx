import { FormEvent, useMemo, useState } from 'react'
import './App.css'

type AssetType = 'Dollars' | 'LYD' | 'Gold' | 'Silver'
type TradeType = 'Buy' | 'Sell'
type VaultKind = 'Main' | 'Client'

interface Vault {
  id: string
  name: string
  kind: VaultKind
  balances: Record<AssetType, number>
}

interface Transaction {
  vaultId: string
  type: TradeType
  asset: AssetType
  amount: number
  rate: number
  timestamp: string
}

interface SummaryRow {
  asset: AssetType
  totalBought: number
  totalSold: number
  averageBuyRate: number
  averageSellRate: number
}

interface TradeDraft {
  vaultId: string
  type: TradeType
  asset: AssetType
  amount: string
  rate: string
}

const ASSETS: AssetType[] = ['Dollars', 'LYD', 'Gold', 'Silver']

const ASSET_LABELS: Record<AssetType, string> = {
  Dollars: 'دولار',
  LYD: 'دينار ليبي',
  Gold: 'ذهب',
  Silver: 'فضة',
}

const TRADE_LABELS: Record<TradeType, string> = {
  Buy: 'شراء',
  Sell: 'بيع',
}

const formatNumber = (value: number, maxFractionDigits?: number): string => {
  try {
    return value.toLocaleString('ar-LY',
      typeof maxFractionDigits === 'number' ? { maximumFractionDigits: maxFractionDigits } : undefined,
    )
  } catch {
    return value.toLocaleString(undefined,
      typeof maxFractionDigits === 'number' ? { maximumFractionDigits: maxFractionDigits } : undefined,
    )
  }
}

const formatDateTime = (value: string): string => {
  try {
    return new Date(value).toLocaleString('ar-LY')
  } catch {
    return new Date(value).toLocaleString()
  }
}

const createStartingBalances = (): Record<AssetType, number> => ({
  Dollars: 50000,
  LYD: 150000,
  Gold: 80,
  Silver: 450,
})

const startingVaults: Vault[] = [
  { id: 'main-vault', name: 'الخزنة الرئيسية', kind: 'Main', balances: createStartingBalances() },
  {
    id: 'client-001',
    name: 'عميل: أحمد علي',
    kind: 'Client',
    balances: { Dollars: 8000, LYD: 21000, Gold: 8, Silver: 35 },
  },
  {
    id: 'client-002',
    name: 'عميل: سارة محمد',
    kind: 'Client',
    balances: { Dollars: 6500, LYD: 18000, Gold: 5, Silver: 22 },
  },
]

function App() {
  const [vaults, setVaults] = useState<Vault[]>(startingVaults)
  const [ledger, setLedger] = useState<Transaction[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [tradeDraft, setTradeDraft] = useState<TradeDraft | null>(null)
  const [formError, setFormError] = useState('')

  const openTradeForm = (vaultId: string, type: TradeType) => {
    setTradeDraft({
      vaultId,
      type,
      asset: 'Dollars',
      amount: '',
      rate: '',
    })
    setFormError('')
  }

  const closeTradeForm = () => {
    setTradeDraft(null)
    setFormError('')
  }

  const submitTrade = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!tradeDraft) return

    const amount = Number(tradeDraft.amount)
    const rate = Number(tradeDraft.rate)

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('يجب أن تكون الكمية أكبر من صفر.')
      return
    }

    if (!Number.isFinite(rate) || rate <= 0) {
      setFormError('يجب أن يكون السعر أكبر من صفر.')
      return
    }

    const targetVault = vaults.find((vault) => vault.id === tradeDraft.vaultId)
    if (!targetVault) {
      setFormError('تعذر العثور على الخزنة المحددة.')
      return
    }

    const tradeValueInLyd = amount * rate

    if (tradeDraft.type === 'Buy' && tradeDraft.asset === 'LYD') {
      setFormError('لا يمكن تنفيذ شراء على الدينار الليبي مباشرة. اختر أصلًا آخر.')
      return
    }

    if (tradeDraft.type === 'Sell' && tradeDraft.asset === 'LYD') {
      setFormError('لا يمكن تنفيذ بيع على الدينار الليبي مباشرة. اختر أصلًا آخر.')
      return
    }

    if (tradeDraft.type === 'Buy' && targetVault.balances.LYD < tradeValueInLyd) {
      setFormError('رصيد الدينار الليبي غير كافٍ لتنفيذ عملية الشراء.')
      return
    }

    const existingBalance = targetVault.balances[tradeDraft.asset]
    if (tradeDraft.type === 'Sell' && existingBalance < amount) {
      setFormError(`الرصيد غير كافٍ من ${ASSET_LABELS[tradeDraft.asset]} لإتمام عملية البيع.`)
      return
    }

    setVaults((previous) =>
      previous.map((vault) => {
        if (vault.id !== tradeDraft.vaultId) return vault

        const currentBalance = vault.balances[tradeDraft.asset]

        if (tradeDraft.type === 'Buy') {
          const nextAssetBalance = currentBalance + amount
          const nextLydBalance = vault.balances.LYD - tradeValueInLyd

          return {
            ...vault,
            balances: {
              ...vault.balances,
              [tradeDraft.asset]: Number(nextAssetBalance.toFixed(4)),
              LYD: Number(nextLydBalance.toFixed(4)),
            },
          }
        }

        const nextBalance = currentBalance - amount
        const nextLydBalance = vault.balances.LYD + tradeValueInLyd

        return {
          ...vault,
          balances: {
            ...vault.balances,
            [tradeDraft.asset]: Number(nextBalance.toFixed(4)),
            LYD: Number(nextLydBalance.toFixed(4)),
          },
        }
      }),
    )

    setLedger((previous) => [
      ...previous,
      {
        vaultId: tradeDraft.vaultId,
        type: tradeDraft.type,
        asset: tradeDraft.asset,
        amount,
        rate,
        timestamp: new Date().toISOString(),
      },
    ])

    closeTradeForm()
  }

  const summaryRows = useMemo<SummaryRow[]>(() => {
    const base = ASSETS.map((asset) => ({
      asset,
      totalBought: 0,
      totalSold: 0,
      buyWeightedSum: 0,
      sellWeightedSum: 0,
    }))

    const summaryMap = Object.fromEntries(base.map((row) => [row.asset, row])) as Record<
      AssetType,
      (typeof base)[number]
    >

    for (const trade of ledger) {
      const row = summaryMap[trade.asset]
      if (trade.type === 'Buy') {
        row.totalBought += trade.amount
        row.buyWeightedSum += trade.amount * trade.rate
      } else {
        row.totalSold += trade.amount
        row.sellWeightedSum += trade.amount * trade.rate
      }
    }

    return ASSETS.map((asset) => {
      const row = summaryMap[asset]
      return {
        asset,
        totalBought: row.totalBought,
        totalSold: row.totalSold,
        averageBuyRate:
          row.totalBought > 0 ? row.buyWeightedSum / row.totalBought : 0,
        averageSellRate:
          row.totalSold > 0 ? row.sellWeightedSum / row.totalSold : 0,
      }
    })
  }, [ledger])

  return (
    <main className="app-shell" dir="rtl">
      <header className="top-bar">
        <h1>متابعة مخزون وتداولات المحل</h1>
        <button className="summary-btn" onClick={() => setShowSummary((value) => !value)}>
          ملخص نهاية اليوم
        </button>
      </header>

      <section className="vault-grid">
        {vaults.map((vault) => (
          <article key={vault.id} className="vault-card">
            <div className="vault-header">
              <h2>{vault.name}</h2>
              <span className={`vault-kind ${vault.kind.toLowerCase()}`}>
                {vault.kind === 'Main' ? 'الرئيسي' : 'عميل'}
              </span>
            </div>

            <div className="balance-list">
              {ASSETS.map((asset) => (
                <div key={`${vault.id}-${asset}`} className="balance-item">
                  <span>{ASSET_LABELS[asset]}</span>
                  <strong>{formatNumber(vault.balances[asset])}</strong>
                </div>
              ))}
            </div>

            <div className="action-row">
              <button onClick={() => openTradeForm(vault.id, 'Buy')}>شراء</button>
              <button className="sell-btn" onClick={() => openTradeForm(vault.id, 'Sell')}>
                بيع
              </button>
            </div>
          </article>
        ))}
      </section>

      {showSummary && (
        <section className="summary-card">
          <h2>تقرير نهاية اليوم</h2>
          <table>
            <thead>
              <tr>
                <th>الأصل</th>
                <th>إجمالي المشتريات</th>
                <th>إجمالي المبيعات</th>
                <th>متوسط سعر الشراء</th>
                <th>متوسط سعر البيع</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row) => (
                <tr key={row.asset}>
                  <td>{ASSET_LABELS[row.asset]}</td>
                  <td>{formatNumber(row.totalBought, 4)}</td>
                  <td>{formatNumber(row.totalSold, 4)}</td>
                  <td>{formatNumber(row.averageBuyRate, 4)}</td>
                  <td>{formatNumber(row.averageSellRate, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="summary-card">
        <h2>سجل العمليات</h2>
        <table>
          <thead>
            <tr>
              <th>الوقت</th>
              <th>معرف الخزنة</th>
              <th>النوع</th>
              <th>الأصل</th>
              <th>الكمية</th>
              <th>السعر</th>
            </tr>
          </thead>
          <tbody>
            {ledger.length === 0 ? (
              <tr>
                <td colSpan={6}>لا توجد عمليات حتى الآن.</td>
              </tr>
            ) : (
              ledger
                .slice()
                .reverse()
                .map((entry, index) => (
                  <tr key={`${entry.timestamp}-${index}`}>
                    <td>{formatDateTime(entry.timestamp)}</td>
                    <td>{entry.vaultId}</td>
                    <td>{TRADE_LABELS[entry.type]}</td>
                    <td>{ASSET_LABELS[entry.asset]}</td>
                    <td>{formatNumber(entry.amount, 4)}</td>
                    <td>{formatNumber(entry.rate, 4)}</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </section>

      {tradeDraft && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal">
            <h2>
              {TRADE_LABELS[tradeDraft.type]} - {vaults.find((vault) => vault.id === tradeDraft.vaultId)?.name}
            </h2>

            <form onSubmit={submitTrade} className="trade-form">
              <label>
                الكمية
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={tradeDraft.amount}
                  onChange={(event) =>
                    setTradeDraft((value) =>
                      value ? { ...value, amount: event.target.value } : value,
                    )
                  }
                  required
                />
              </label>

              <label>
                نوع الأصل
                <select
                  value={tradeDraft.asset}
                  onChange={(event) =>
                    setTradeDraft((value) =>
                      value ? { ...value, asset: event.target.value as AssetType } : value,
                    )
                  }
                >
                  {ASSETS.map((asset) => (
                    <option key={asset} value={asset}>
                      {ASSET_LABELS[asset]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                السعر
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={tradeDraft.rate}
                  onChange={(event) =>
                    setTradeDraft((value) =>
                      value ? { ...value, rate: event.target.value } : value,
                    )
                  }
                  required
                />
              </label>

              {formError && <p className="error">{formError}</p>}

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={closeTradeForm}>
                  إلغاء
                </button>
                <button type="submit">تأكيد العملية</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
