export type AssetType = string

export type RateUnit = 'unit' | 'gram' | 'ounce' | 'kilo'

export interface AssetDefinition {
  id: string
  label: string
  icon: string
  color: string
  supportsWeightRate: boolean
  quantityUnit: RateUnit
  generalPrice: number
  generalPriceUnit: RateUnit
}

export type TradeType = 'Buy' | 'Sell' | 'Incoming' | 'Outgoing'

export interface Vault {
  id: string
  name: string
  kind: 'Main' | 'Client'
  balances: Record<string, number>
}

export interface Transaction {
  id: string
  vaultId: string
  type: TradeType
  asset: AssetType
  amount: number
  rate: number
  rateUnit: RateUnit
  description?: string
  timestamp: string
}

export interface ClientProfile {
  id: string
  name: string
  phone: string
}

export interface EodSummaryRow {
  asset: string
  totalBought: number
  totalSold: number
  averageBuyRate: number
  averageSellRate: number
}

export const DEFAULT_ASSET_DEFINITIONS: AssetDefinition[] = [
  { id: 'Dollars', label: 'دولار', icon: '$', color: 'from-sky-500/20 to-sky-300/5', supportsWeightRate: false, quantityUnit: 'unit', generalPrice: 4.9, generalPriceUnit: 'unit' },
  { id: 'Euro', label: 'يورو', icon: '€', color: 'from-blue-500/20 to-blue-300/5', supportsWeightRate: false, quantityUnit: 'unit', generalPrice: 5.3, generalPriceUnit: 'unit' },
  { id: 'LYD', label: 'دينار ليبي', icon: 'ل.د', color: 'from-violet-500/20 to-violet-300/5', supportsWeightRate: false, quantityUnit: 'unit', generalPrice: 1, generalPriceUnit: 'unit' },
  { id: 'Gold', label: 'ذهب', icon: '🥇', color: 'from-amber-500/20 to-amber-300/5', supportsWeightRate: true, quantityUnit: 'gram', generalPrice: 350, generalPriceUnit: 'gram' },
  { id: 'Silver', label: 'فضة', icon: '🥈', color: 'from-slate-400/20 to-slate-200/5', supportsWeightRate: true, quantityUnit: 'gram', generalPrice: 4.2, generalPriceUnit: 'gram' },
]
