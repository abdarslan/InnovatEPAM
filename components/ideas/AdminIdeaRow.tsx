'use client'

import { useRouter } from 'next/navigation'
import type { AdminIdeaListItem } from '@/actions/ideas'
import { StatusBadge } from '@/components/ideas/StatusBadge'
import { EvaluationPanel } from '@/components/ideas/EvaluationPanel'

type Props = {
  idea: AdminIdeaListItem
}

export function AdminIdeaRow({ idea }: Props) {
  const router = useRouter()

  function handleSuccess() {
    router.refresh()
  }

  return (
    <li className="rounded border border-border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate" title={idea.title}>
            {idea.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {idea.category.replace('_', ' ')} · by {idea.submitterName} ·{' '}
            {new Date(idea.createdAt).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={idea.status} />
      </div>

      {idea.reviewerName && (
        <p className="text-sm text-muted-foreground">
          Reviewer: <span className="font-medium">{idea.reviewerName}</span>
          {idea.reviewStartedAt && (
            <> · started {new Date(idea.reviewStartedAt).toLocaleDateString()}</>
          )}
        </p>
      )}

      {idea.evaluation && (
        <div className="rounded bg-muted/50 p-3 text-sm space-y-1">
          <p>
            <span className="font-medium">Evaluated by:</span> {idea.evaluation.adminName}
          </p>
          {idea.evaluation.comment && (
            <p>
              <span className="font-medium">Comment:</span> {idea.evaluation.comment}
            </p>
          )}
        </div>
      )}

      <EvaluationPanel
        ideaId={idea.id}
        currentStatus={idea.status}
        onSuccess={handleSuccess}
      />
    </li>
  )
}
