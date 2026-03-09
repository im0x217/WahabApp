export type AssetType = 'Dollars' | 'LYD' | 'Gold' | 'Silver'

export type TradeType = 'Buy' | 'Sell'

export interface Vault {
  id: string
  name: string
  kind: 'Main' | 'Client'
  balances: Record<AssetType, number>
}

export interface Transaction {
  id: string
  vaultId: string
  type: TradeType
  asset: AssetType
  amount: number
  rate: number
  timestamp: string
}

export interface EodSummaryRow {
  asset: AssetType
  totalBought: number
  totalSold: number
  averageBuyRate: number
  averageSellRate: number
}

export const ASSETS: AssetType[] = ['Dollars', 'LYD', 'Gold', 'Silver']

export const ASSET_COLORS: Record<AssetType, string> = {
  Dollars: 'from-sky-500/20 to-sky-300/5',
  LYD: 'from-violet-500/20 to-violet-300/5',
  Gold: 'from-amber-500/20 to-amber-300/5',
  Silver: 'from-slate-400/20 to-slate-200/5',
}
