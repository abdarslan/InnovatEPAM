'use client'

import { useRouter, usePathname } from 'next/navigation'
import type { IdeaStatus } from '@/actions/ideas'
import { IDEA_STATUSES } from '@/lib/db/schema'

type Props = {
  currentStatus?: IdeaStatus
}

const STATUS_LABELS: Record<IdeaStatus, string> = {
  submitted:    'Submitted',
  under_review: 'Under Review',
  accepted:     'Accepted',
  rejected:     'Rejected',
}

export function AdminIdeaListFilter({ currentStatus }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    if (value === '') {
      router.push(pathname)
    } else {
      router.push(`${pathname}?status=${value}`)
    }
  }

  return (
    <select
      id="status-filter"
      value={currentStatus ?? ''}
      onChange={handleChange}
      className="rounded-full border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] px-3 py-1.5 text-sm text-[var(--color-shell-text)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-shell-focus)]"
      aria-label="Filter ideas by status"
    >
      <option value="">All statuses</option>
      {IDEA_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}
