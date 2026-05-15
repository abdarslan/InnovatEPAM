'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getIdeaDetailAction, type AdminIdeaListItem, type IdeaDetail } from '@/actions/ideas'
import { StatusBadge } from '@/components/ideas/StatusBadge'
import { EvaluationPanel } from '@/components/ideas/EvaluationPanel'

type Props = {
  idea: AdminIdeaListItem
}

export function AdminIdeaRow({ idea }: Props) {
  const router = useRouter()
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detail, setDetail] = useState<IdeaDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  function handleSuccess() {
    setDetail(null)
    router.refresh()
  }

  function formatDynamicFieldLabel(fieldKey: string) {
    return fieldKey
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  async function toggleDetails() {
    const nextOpen = !isDetailOpen
    setIsDetailOpen(nextOpen)
    if (!nextOpen || detail || isLoadingDetail) return

    setIsLoadingDetail(true)
    setDetailError(null)
    const result = await getIdeaDetailAction(idea.id)
    setIsLoadingDetail(false)
    if (result.ok) {
      setDetail(result.data)
    } else {
      setDetailError(result.error)
    }
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
          <p className="text-xs text-muted-foreground">
            Stage: {idea.currentStage.replaceAll('_', ' ')} · Outcome: {idea.currentOutcome.replaceAll('_', ' ')}
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

      {(idea.latestDecisionAt || idea.latestDecidedByUserName) && (
        <p className="text-xs text-muted-foreground">
          Latest decision by {idea.latestDecidedByUserName ?? 'Unknown'}
          {idea.latestDecisionAt ? ` on ${new Date(idea.latestDecisionAt).toLocaleString()}` : ''}
        </p>
      )}

      <div className="pt-1">
        <button
          type="button"
          onClick={() => void toggleDetails()}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          {isDetailOpen ? 'Hide details' : 'View details'}
        </button>
      </div>

      {isDetailOpen && (
        <div className="rounded border border-border bg-muted/40 p-3 text-sm space-y-2">
          {isLoadingDetail && (
            <p className="text-muted-foreground" aria-live="polite">
              Loading details...
            </p>
          )}
          {detailError && (
            <p role="alert" className="text-destructive">
              {detailError}
            </p>
          )}
          {detail && (
            <>
              <p className="whitespace-pre-wrap">{detail.description}</p>
              {detail.dynamicFields.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium">Category details</p>
                  <dl className="space-y-1">
                    {detail.dynamicFields.map((field) => (
                      <div key={field.fieldKey} className="flex flex-wrap gap-1">
                        <dt className="font-medium">{formatDynamicFieldLabel(field.fieldKey)}:</dt>
                        <dd className="text-muted-foreground">{field.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <EvaluationPanel
        ideaId={idea.id}
        currentStage={idea.currentStage}
        currentOutcome={idea.currentOutcome}
        isTerminal={idea.isTerminal}
        onSuccess={handleSuccess}
      />
    </li>
  )
}
