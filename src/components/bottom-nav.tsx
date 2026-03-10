'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, LayoutGrid, UsersRound } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-fintech-border bg-fintech-panel/95 px-4 py-2 backdrop-blur sm:hidden" aria-label="تنقل الجوال">
      <ul className="grid grid-cols-3 gap-2 text-xs text-fintech-muted">
        <li>
          <Link href="/" className={`flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-center ${pathname === '/' ? 'bg-white/5 text-fintech-text' : 'bg-transparent'}`}>
            <LayoutGrid size={14} />الرئيسية
          </Link>
        </li>
        <li>
          <Link href="/clients" className={`flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-center ${pathname === '/clients' ? 'bg-white/5 text-fintech-text' : 'bg-transparent'}`}>
            <UsersRound size={14} />العملاء
          </Link>
        </li>
        <li className="flex items-center justify-center gap-1 rounded-xl bg-transparent px-3 py-2 text-center opacity-70">
          <BarChart3 size={14} />التقرير
        </li>
      </ul>
    </nav>
  )
}
