import { AssetDefinition, DEFAULT_ASSET_DEFINITIONS, EodSummaryRow, RateUnit, Transaction, Vault } from '@/types/trading'

export const rateUnitLabels: Record<RateUnit, string> = {
  unit: 'للوحدة',
  gram: 'للجرام',
  ounce: 'للأونصة',
  kilo: 'للكيلو',
}

export const tradeLabels: Record<Transaction['type'], string> = {
  Buy: 'شراء',
  Sell: 'بيع',
  Incoming: 'وارد',
  Outgoing: 'صادر',
}

const defaultAssetLabelMap = Object.fromEntries(DEFAULT_ASSET_DEFINITIONS.map((asset) => [asset.id, asset.label]))
const defaultAssetIconMap = Object.fromEntries(DEFAULT_ASSET_DEFINITIONS.map((asset) => [asset.id, asset.icon]))

export const getAssetLabel = (asset: string, assets?: AssetDefinition[]) =>
  assets?.find((entry) => entry.id === asset)?.label ?? defaultAssetLabelMap[asset] ?? asset

export const getAssetIcon = (asset: string, assets?: AssetDefinition[]) =>
  assets?.find((entry) => entry.id === asset)?.icon ?? defaultAssetIconMap[asset] ?? '💱'

export const getTradeLabel = (type: Transaction['type']) => tradeLabels[type]
export const getRateUnitLabel = (unit: RateUnit) => rateUnitLabels[unit]

const unitWeightFactor: Record<RateUnit, number> = {
  unit: 1,
  gram: 1,
  ounce: 31.1034768,
  kilo: 1000,
}

export const convertAmountBetweenUnits = (amount: number, from: RateUnit, to: RateUnit) => {
  if (!Number.isFinite(amount)) return 0
  if (from === to) return amount

  const fromFactor = unitWeightFactor[from]
  const toFactor = unitWeightFactor[to]
  return (amount * fromFactor) / toFactor
}

export const getAssetGeneralValue = (amount: number, asset?: AssetDefinition) => {
  if (!asset || !Number.isFinite(amount)) return 0

  const normalizedAmount = convertAmountBetweenUnits(amount, asset.quantityUnit, asset.generalPriceUnit)
  return normalizedAmount * asset.generalPrice
}

export const getVaultGeneralTotal = (vault: Vault, assets: AssetDefinition[]) => {
  return Object.entries(vault.balances).reduce((sum, [assetId, amount]) => {
    const asset = assets.find((entry) => entry.id === assetId)
    return sum + getAssetGeneralValue(amount, asset)
  }, 0)
}

export const seedVaults: Vault[] = [
  {
    id: 'main-vault',
    name: 'الخزنة الرئيسية',
    kind: 'Main',
    balances: { Dollars: 50000, Euro: 18000, LYD: 150000, Gold: 80, Silver: 450 },
  },
  {
    id: 'client-01',
    name: 'العميل: أحمد علي',
    kind: 'Client',
    balances: { Dollars: 8000, Euro: 2600, LYD: 21000, Gold: 8, Silver: 35 },
  },
  {
    id: 'client-02',
    name: 'العميلة: سارة محمد',
    kind: 'Client',
    balances: { Dollars: 6500, Euro: 2200, LYD: 18000, Gold: 5, Silver: 22 },
  },
]

export const buildEodSummary = (ledger: Transaction[], assets: AssetDefinition[]): EodSummaryRow[] => {
  const assetIds = assets.map((asset) => asset.id)
  const map = Object.fromEntries(
    assetIds.map((asset) => [asset, { buyAmount: 0, sellAmount: 0, buySum: 0, sellSum: 0 }]),
  ) as Record<string, { buyAmount: number; sellAmount: number; buySum: number; sellSum: number }>

  for (const trade of ledger) {
    if (!map[trade.asset]) {
      map[trade.asset] = { buyAmount: 0, sellAmount: 0, buySum: 0, sellSum: 0 }
    }
    const row = map[trade.asset]
    if (trade.type === 'Buy') {
      row.buyAmount += trade.amount
      row.buySum += trade.amount * trade.rate
    } else if (trade.type === 'Sell') {
      row.sellAmount += trade.amount
      row.sellSum += trade.amount * trade.rate
    }
  }

  return Object.keys(map).map((asset) => {
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
