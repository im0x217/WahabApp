import { ASSET_COLORS, ASSETS, AssetType, Vault } from '@/types/trading'
import { formatCurrency, getAssetLabel } from '@/lib/trading'

interface AssetStripProps {
  vault: Vault
}

export function AssetStrip({ vault }: AssetStripProps) {
  return (
    <section aria-label="أصول الخزنة الرئيسية" className="mt-4">
      <div className="grid grid-flow-col auto-cols-[88%] gap-3 overflow-x-auto pb-1 sm:grid-flow-row sm:auto-cols-fr sm:grid-cols-2 lg:grid-cols-4">
        {ASSETS.map((asset: AssetType) => (
          <article
            key={asset}
            className={`rounded-2xl bg-gradient-to-br ${ASSET_COLORS[asset]} glass p-4 transition duration-300 hover:scale-[1.01]`}
          >
            <p className="text-sm text-fintech-muted">{getAssetLabel(asset)}</p>
            <p className="numeric mt-2 text-xl font-semibold text-white">{formatCurrency(vault.balances[asset])}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
