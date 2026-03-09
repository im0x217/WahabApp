export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-fintech-border bg-fintech-panel/95 px-4 py-2 backdrop-blur sm:hidden" aria-label="تنقل الجوال">
      <ul className="grid grid-cols-3 gap-2 text-xs text-fintech-muted">
        <li className="rounded-xl bg-white/5 px-3 py-2 text-center text-fintech-text">الرئيسية</li>
        <li className="rounded-xl bg-transparent px-3 py-2 text-center">العملاء</li>
        <li className="rounded-xl bg-transparent px-3 py-2 text-center">التقرير</li>
      </ul>
    </nav>
  )
}
