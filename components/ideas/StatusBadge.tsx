import { Badge } from '@/components/ui/badge'
import type { IdeaStatus } from '@/lib/db/schema'

const STATUS_LABELS: Record<IdeaStatus, string> = {
  submitted:    'Submitted',
  under_review: 'Under Review',
  accepted:     'Accepted',
  rejected:     'Rejected',
}

const STATUS_CLASSES: Record<IdeaStatus, string> = {
  submitted:    'border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] text-[var(--color-shell-text)]',
  under_review: 'border-[var(--color-shell-border)] bg-[var(--color-surface-muted)] text-[var(--color-shell-primary)]',
  accepted:     'border-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_12%,white)] text-[var(--color-success)]',
  rejected:     'border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_12%,white)] text-[var(--color-danger)]',
}

type Props = {
  status: IdeaStatus
  scoreReady?: boolean
}

export function StatusBadge({ status, scoreReady = false }: Props) {
  const text = scoreReady ? `${STATUS_LABELS[status]} · Scored` : STATUS_LABELS[status]
  return (
    <Badge
      variant="outline"
      className={STATUS_CLASSES[status]}
      role="status"
      aria-label={status}
    >
      {text}
    </Badge>
  )
}
