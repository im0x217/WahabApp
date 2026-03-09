import { AssetDefinition, Vault } from '@/types/trading'
import { formatCurrency, getAssetLabel } from '@/lib/trading'

interface AssetStripProps {
  vault: Vault
  assets: AssetDefinition[]
  onOpenAssetManager: () => void
}

export function AssetStrip({ vault, assets, onOpenAssetManager }: AssetStripProps) {
  return (
    <section aria-label="أصول الخزنة الرئيسية" className="mt-4">
      <div className="grid grid-flow-col auto-cols-[88%] gap-3 overflow-x-auto pb-0 sm:grid-flow-row sm:auto-cols-fr sm:grid-cols-2 lg:grid-cols-4">
        {assets.map((asset) => (
          <article
            key={asset.id}
            className={`rounded-2xl bg-gradient-to-br ${asset.color} glass flex min-h-[124px] flex-col justify-between p-4 transition duration-300 hover:scale-[1.01]`}
          >
            <p className="text-[0.825rem] text-fintech-muted">{asset.icon} {getAssetLabel(asset.id, assets)}</p>
            <p className="numeric mt-2 text-[1.24rem] font-semibold text-white">{formatCurrency(vault.balances[asset.id] ?? 0)}</p>
          </article>
        ))}

        <article className="rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-300/5 glass flex min-h-[124px] flex-col justify-between p-4 transition duration-300 hover:scale-[1.01]">
          <div>
            <p className="text-sm text-fintech-muted">Asset Type Manager</p>
            <p className="mt-1 text-xs text-fintech-muted">إضافة • تعديل • حذف</p>
          </div>
          <p className="numeric mt-3 text-xl font-semibold text-white">+ إدارة العملات</p>
          <button
            type="button"
            onClick={onOpenAssetManager}
            className="mt-3 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-fintech-text"
          >
            فتح نافذة الإدارة
          </button>
        </article>
      </div>
    </section>
  )
}
