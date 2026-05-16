'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { GlobalNavigationItem } from '@/lib/navigation/types'

type NavigationItemsProps = {
  items: GlobalNavigationItem[]
}

export default function NavigationItems({ items }: NavigationItemsProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Primary">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-shell-focus)]',
              isActive
                ? 'border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] font-medium text-[var(--color-shell-text)]'
                : 'border-transparent text-[var(--color-shell-text)] hover:border-[var(--color-shell-border)] hover:bg-[var(--color-shell-surface-muted)]',
            ].join(' ')}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
