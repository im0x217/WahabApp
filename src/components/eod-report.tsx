import { EodSummaryRow } from '@/types/trading'
import { formatCurrency, getAssetLabel } from '@/lib/trading'
import { ChartColumnBig } from 'lucide-react'

interface EodReportProps {
  rows: EodSummaryRow[]
  open: boolean
}

export function EodReport({ rows, open }: EodReportProps) {
  if (!open) return null

  return (
    <section className="glass mt-5 rounded-3xl p-4" aria-live="polite" aria-label="تقرير نهاية اليوم">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><ChartColumnBig size={18} />ملخص نهاية اليوم</h2>
        <span className="rounded-full bg-primary/20 px-3 py-1 text-xs text-sky-300">محسوب تلقائيًا</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <article key={row.asset} className="rounded-2xl bg-fintech-panelSoft p-3 ring-1 ring-fintech-border">
            <h3 className="text-sm font-medium text-white">{getAssetLabel(row.asset)}</h3>
            <dl className="mt-2 space-y-1 text-xs text-fintech-muted">
              <div className="flex justify-between">
                <dt>إجمالي الشراء</dt>
                <dd className="numeric text-emerald-300">{formatCurrency(row.totalBought)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>إجمالي البيع</dt>
                <dd className="numeric text-rose-300">{formatCurrency(row.totalSold)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>متوسط سعر الشراء</dt>
                <dd className="numeric text-sky-300">{formatCurrency(row.averageBuyRate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>متوسط سعر البيع</dt>
                <dd className="numeric text-violet-300">{formatCurrency(row.averageSellRate)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}
