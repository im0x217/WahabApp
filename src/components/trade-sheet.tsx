import { ASSETS, AssetType, TradeType, Vault } from '@/types/trading'
import { getAssetLabel, getTradeLabel } from '@/lib/trading'

interface TradeSheetProps {
  isOpen: boolean
  mode: TradeType
  selectedVault: Vault | null
  amount: string
  rate: string
  asset: AssetType
  formError: string
  onClose: () => void
  onChangeAmount: (value: string) => void
  onChangeRate: (value: string) => void
  onChangeAsset: (value: AssetType) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function TradeSheet({
  isOpen,
  mode,
  selectedVault,
  amount,
  rate,
  asset,
  formError,
  onClose,
  onChangeAmount,
  onChangeRate,
  onChangeAsset,
  onSubmit,
}: TradeSheetProps) {
  if (!isOpen || !selectedVault) return null
  const needsRate = mode === 'Buy' || mode === 'Sell'

  const normalizeDecimalInput = (value: string) =>
    value
      .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
      .replace(/,/g, '.')
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./g, '$1')

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="trade-title">
      <div className="glass w-full max-h-[92dvh] overflow-y-auto rounded-t-3xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5 sm:mx-auto sm:max-h-none sm:max-w-lg sm:rounded-3xl sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="trade-title" className="text-lg font-semibold text-white">
            {getTradeLabel(mode)} • {selectedVault.name}
          </h2>
          <button onClick={onClose} className="rounded-xl bg-white/10 px-3 py-2 text-xs text-fintech-muted transition hover:bg-white/15" aria-label="إغلاق نموذج العملية">
            إغلاق
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm text-fintech-muted">
            الكمية
            <input
              type="text"
              inputMode="decimal"
              dir="ltr"
              lang="en"
              pattern="[0-9]*[.]?[0-9]*"
              value={amount}
              onChange={(event) => onChangeAmount(normalizeDecimalInput(event.target.value))}
              className="mt-1 w-full rounded-2xl border border-fintech-border bg-fintech-panelSoft px-4 py-3 text-white outline-none ring-sky-400 transition focus:ring"
              placeholder="0.00"
              required
            />
          </label>

          <label className="block text-sm text-fintech-muted">
            نوع الأصل
            <select
              value={asset}
              onChange={(event) => onChangeAsset(event.target.value as AssetType)}
              className="mt-1 w-full rounded-2xl border border-fintech-border bg-fintech-panelSoft px-4 py-3 text-white outline-none ring-sky-400 transition focus:ring"
            >
              {ASSETS.map((entry) => (
                <option key={entry} value={entry}>
                  {getAssetLabel(entry)}
                </option>
              ))}
            </select>
          </label>

          {needsRate ? (
            <label className="block text-sm text-fintech-muted">
              السعر
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                lang="en"
                pattern="[0-9]*[.]?[0-9]*"
                value={rate}
                onChange={(event) => onChangeRate(normalizeDecimalInput(event.target.value))}
                className="mt-1 w-full rounded-2xl border border-fintech-border bg-fintech-panelSoft px-4 py-3 text-white outline-none ring-sky-400 transition focus:ring"
                placeholder="0.00"
                required
              />
            </label>
          ) : null}

          {formError ? <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-300">{formError}</p> : null}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-fintech-text transition hover:bg-white/15 active:scale-[0.98]">
              إلغاء
            </button>
            <button
              type="submit"
              className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98] ${
                mode === 'Buy'
                  ? 'bg-emerald-500 hover:bg-emerald-400'
                  : mode === 'Sell'
                    ? 'bg-rose-500 hover:bg-rose-400'
                    : mode === 'Incoming'
                      ? 'bg-sky-500 hover:bg-sky-400'
                      : 'bg-amber-500 hover:bg-amber-400'
              }`}
            >
              تأكيد {getTradeLabel(mode)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
