import { AssetDefinition, Vault } from '@/types/trading'
import { formatCurrency, getAssetLabel, getAssetIcon } from '@/lib/trading'
import { Landmark, Wallet } from 'lucide-react'

interface VaultHeroProps {
  vault: Vault
  assets: AssetDefinition[]
}

export function VaultHero({ vault, assets }: VaultHeroProps) {
  const totalHoldings = Object.values(vault.balances).reduce((sum, value) => sum + value, 0)

  return (
    <section
      aria-labelledby="main-vault-title"
      className="rounded-3xl bg-hero p-5 shadow-soft ring-1 ring-white/10 transition duration-300 hover:translate-y-[-2px]"
    >
      <p className="flex items-center gap-2 text-sm text-fintech-muted"><Landmark size={16} />ملخص الخزنة الرئيسية</p>
      <h1 id="main-vault-title" className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {vault.name}
      </h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(vault.balances).map(([asset, value]) => (
          <div key={asset} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-xs text-fintech-muted">{getAssetIcon(asset, assets)} {getAssetLabel(asset, assets)}</p>
            <p className="numeric mt-1 text-lg font-semibold text-white">{formatCurrency(value)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
        <p className="flex items-center gap-2 text-xs tracking-wide text-fintech-muted"><Wallet size={14} />إجمالي الأرصدة</p>
        <p className="numeric mt-1 text-2xl font-bold text-white">{formatCurrency(totalHoldings)}</p>
      </div>
    </section>
  )
}
