import { formatCurrency, getAssetLabel } from '@/lib/trading'
import { ASSETS, AssetType, Vault } from '@/types/trading'

interface ClientVaultCardProps {
  vault: Vault
  onBuy: (vaultId: string) => void
  onSell: (vaultId: string) => void
  onIncoming: (vaultId: string) => void
  onOutgoing: (vaultId: string) => void
}

export function ClientVaultCard({ vault, onBuy, onSell, onIncoming, onOutgoing }: ClientVaultCardProps) {
  const total = Object.values(vault.balances).reduce((sum, value) => sum + value, 0)

  return (
    <article className="glass rounded-3xl p-4 transition duration-300 hover:translate-y-[-2px]" aria-label={`خزنة العميل ${vault.name}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-white">{vault.name}</h3>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-fintech-muted">عميل</span>
      </div>

      <div className="mt-4 space-y-2">
        {ASSETS.map((asset: AssetType) => {
          const value = vault.balances[asset]
          const pct = total > 0 ? (value / total) * 100 : 0
          return (
            <div key={asset} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-fintech-muted">
                <span>{getAssetLabel(asset)}</span>
                <span className="numeric">{formatCurrency(value)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={`نسبة ${getAssetLabel(asset)} في المحفظة`}>
                <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onBuy(vault.id)}
          className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 active:scale-[0.98]"
        >
          شراء
        </button>
        <button
          type="button"
          onClick={() => onSell(vault.id)}
          className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 active:scale-[0.98]"
        >
          بيع
        </button>
        <button
          type="button"
          onClick={() => onIncoming(vault.id)}
          className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 active:scale-[0.98]"
        >
          وارد
        </button>
        <button
          type="button"
          onClick={() => onOutgoing(vault.id)}
          className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-400 active:scale-[0.98]"
        >
          صادر
        </button>
      </div>
    </article>
  )
}
