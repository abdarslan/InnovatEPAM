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

  const submitterDisplayName = idea.isSubmitterAnonymous ? 'Anonymous' : idea.submitterName
  const createdAtLabel = new Date(idea.createdAt).toLocaleDateString()
  return (
    <li className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-5 space-y-4 shadow-sm transition-[box-shadow,border-color] hover:shadow-md hover:border-[var(--color-shell-primary)]/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <h3 className="truncate text-base font-semibold text-[var(--color-shell-text)]" title={idea.title}>
            {idea.title}
          </h3>
          <p className="text-sm text-[var(--color-shell-text-muted)]">
            {idea.category.replace('_', ' ')} by {submitterDisplayName} on {createdAtLabel}
          </p>
        </div>
        <StatusBadge status={idea.status} />
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-[var(--color-shell-text-muted)]">
        <span className="rounded-full border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-2.5 py-1">
          Stage: {idea.currentStage.replaceAll('_', ' ')}
        </span>
        <span className="rounded-full border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-2.5 py-1">
          Outcome: {idea.currentOutcome.replaceAll('_', ' ')}
        </span>
        {idea.reviewerName && (
          <span className="py-1">Reviewer: {idea.reviewerName}</span>
        )}
      </div>

      {idea.evaluation && (
        <div className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)]/80 p-4 text-sm space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-shell-text-muted)]">
            Latest evaluation
          </p>
          <p className="text-[var(--color-shell-text)]">
            <span className="font-medium">By:</span> {idea.evaluation.adminName}
          </p>
          {idea.evaluation.comment && (
            <p className="line-clamp-2 text-[var(--color-shell-text-muted)]">
              {idea.evaluation.comment}
            </p>
          )}
        </div>
      )}

      {(idea.latestDecisionAt || idea.latestDecidedByUserName) && (
        <p className="text-xs text-[var(--color-shell-text-muted)]">
          Latest decision by {idea.latestDecidedByUserName ?? 'Unknown'}
          {idea.latestDecisionAt ? ` on ${new Date(idea.latestDecisionAt).toLocaleString()}` : ''}
        </p>
      )}

      <div className="pt-1">
        <button
          type="button"
          onClick={() => void toggleDetails()}
          className="inline-flex items-center rounded-full border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-3 py-1.5 text-sm font-medium text-[var(--color-shell-text)] underline-offset-4 transition-colors hover:bg-[var(--color-shell-surface-muted)]/80 hover:underline"
        >
          {isDetailOpen ? 'Hide details' : 'View details'}
        </button>
      </div>

      {isDetailOpen && (
        <div className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)]/70 p-4 text-sm space-y-3">
          {isLoadingDetail && (
            <p className="text-[var(--color-shell-text-muted)]" aria-live="polite">
              Loading details...
            </p>
          )}
          {detailError && (
            <p role="alert" className="text-[var(--color-danger)]">
              {detailError}
            </p>
          )}
          {detail && (
            <>
              <p className="whitespace-pre-wrap text-[var(--color-shell-text)]">{detail.description}</p>
              {detail.dynamicFields.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-shell-text-muted)]">
                    Category details
                  </p>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    {detail.dynamicFields.map((field) => (
                      <div
                        key={field.fieldKey}
                        className="rounded-xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] px-3 py-2"
                      >
                        <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-shell-text-muted)]">
                          {formatDynamicFieldLabel(field.fieldKey)}
                        </dt>
                        <dd className="mt-1 text-sm text-[var(--color-shell-text)]">{field.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)]/70 p-4">
        <EvaluationPanel
          ideaId={idea.id}
          currentStage={idea.currentStage}
          currentOutcome={idea.currentOutcome}
          isTerminal={idea.isTerminal}
          onSuccess={handleSuccess}
        />
      </div>
    </li>
  )
}
