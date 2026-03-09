import { BarChart3, LayoutGrid, UsersRound } from 'lucide-react'

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-fintech-border bg-fintech-panel/95 px-4 py-2 backdrop-blur sm:hidden" aria-label="تنقل الجوال">
      <ul className="grid grid-cols-3 gap-2 text-xs text-fintech-muted">
        <li className="flex items-center justify-center gap-1 rounded-xl bg-white/5 px-3 py-2 text-center text-fintech-text"><LayoutGrid size={14} />الرئيسية</li>
        <li className="flex items-center justify-center gap-1 rounded-xl bg-transparent px-3 py-2 text-center"><UsersRound size={14} />العملاء</li>
        <li className="flex items-center justify-center gap-1 rounded-xl bg-transparent px-3 py-2 text-center"><BarChart3 size={14} />التقرير</li>
      </ul>
    </nav>
  )
}
