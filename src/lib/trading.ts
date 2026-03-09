import { ASSETS, EodSummaryRow, Transaction, Vault } from '@/types/trading'

export const assetLabels: Record<(typeof ASSETS)[number], string> = {
  Dollars: 'دولار',
  LYD: 'دينار ليبي',
  Gold: 'ذهب',
  Silver: 'فضة',
}

export const tradeLabels: Record<Transaction['type'], string> = {
  Buy: 'شراء',
  Sell: 'بيع',
  Incoming: 'وارد',
  Outgoing: 'صادر',
}

export const getAssetLabel = (asset: (typeof ASSETS)[number]) => assetLabels[asset]
export const getTradeLabel = (type: Transaction['type']) => tradeLabels[type]

export const seedVaults: Vault[] = [
  {
    id: 'main-vault',
    name: 'الخزنة الرئيسية',
    kind: 'Main',
    balances: { Dollars: 50000, LYD: 150000, Gold: 80, Silver: 450 },
  },
  {
    id: 'client-01',
    name: 'العميل: أحمد علي',
    kind: 'Client',
    balances: { Dollars: 8000, LYD: 21000, Gold: 8, Silver: 35 },
  },
  {
    id: 'client-02',
    name: 'العميلة: سارة محمد',
    kind: 'Client',
    balances: { Dollars: 6500, LYD: 18000, Gold: 5, Silver: 22 },
  },
]

export const buildEodSummary = (ledger: Transaction[]): EodSummaryRow[] => {
  const map = Object.fromEntries(
    ASSETS.map((asset) => [asset, { buyAmount: 0, sellAmount: 0, buySum: 0, sellSum: 0 }]),
  ) as Record<(typeof ASSETS)[number], { buyAmount: number; sellAmount: number; buySum: number; sellSum: number }>

  for (const trade of ledger) {
    const row = map[trade.asset]
    if (trade.type === 'Buy') {
      row.buyAmount += trade.amount
      row.buySum += trade.amount * trade.rate
    } else if (trade.type === 'Sell') {
      row.sellAmount += trade.amount
      row.sellSum += trade.amount * trade.rate
    }
  }

  return ASSETS.map((asset) => {
    const row = map[asset]
    return {
      asset,
      totalBought: row.buyAmount,
      totalSold: row.sellAmount,
      averageBuyRate: row.buyAmount > 0 ? row.buySum / row.buyAmount : 0,
      averageSellRate: row.sellAmount > 0 ? row.sellSum / row.sellAmount : 0,
    }
  })
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ar-LY', { maximumFractionDigits: 4 }).format(value)

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('ar-LY', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
