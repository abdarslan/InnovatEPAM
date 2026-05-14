import { Badge } from '@/components/ui/badge'
import type { IdeaStatus } from '@/lib/db/schema'

const STATUS_LABELS: Record<IdeaStatus, string> = {
  submitted:    'Submitted',
  under_review: 'Under Review',
  accepted:     'Accepted',
  rejected:     'Rejected',
}

const STATUS_CLASSES: Record<IdeaStatus, string> = {
  submitted:    'bg-gray-100 text-gray-800 border-gray-300',
  under_review: 'bg-amber-100 text-amber-800 border-amber-300',
  accepted:     'bg-green-100 text-green-800 border-green-300',
  rejected:     'bg-red-100 text-red-800 border-red-300',
}

type Props = {
  status: IdeaStatus
}

export function StatusBadge({ status }: Props) {
  return (
    <Badge
      variant="outline"
      className={STATUS_CLASSES[status]}
      aria-label={status}
    >
      {STATUS_LABELS[status]}
    </Badge>
  )
}
