import { AssetDefinition, Vault } from '@/types/trading'
import { formatCurrency, getAssetLabel } from '@/lib/trading'

interface AssetStripProps {
  vault: Vault
  assets: AssetDefinition[]
}

export function AssetStrip({ vault, assets }: AssetStripProps) {
  return (
    <section aria-label="أصول الخزنة الرئيسية" className="mt-4">
      <div className="grid grid-flow-col auto-cols-[88%] gap-3 overflow-x-auto pb-1 sm:grid-flow-row sm:auto-cols-fr sm:grid-cols-2 lg:grid-cols-4">
        {assets.map((asset) => (
          <article
            key={asset.id}
            className={`rounded-2xl bg-gradient-to-br ${asset.color} glass p-4 transition duration-300 hover:scale-[1.01]`}
          >
            <p className="text-sm text-fintech-muted">{asset.icon} {getAssetLabel(asset.id, assets)}</p>
            <p className="numeric mt-2 text-xl font-semibold text-white">{formatCurrency(vault.balances[asset.id] ?? 0)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
