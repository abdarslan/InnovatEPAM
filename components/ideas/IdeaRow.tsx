'use client'

import { useState, useEffect } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { getIdeaDetailAction, getIdeaTimelineAction } from '@/actions/ideas'
import type { IdeaAttachmentMeta, IdeaListItem, IdeaDetail, IdeaTimelineEntry } from '@/actions/ideas'
import type { IdeaCategory } from '@/lib/db/schema'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ideas/StatusBadge'
import { IdeaTimeline } from '@/components/ideas/IdeaTimeline'

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  process_improvement: 'Process Improvement',
  technology_innovation: 'Technology Innovation',
  customer_experience: 'Customer Experience',
  workplace_culture: 'Workplace Culture',
  cost_reduction: 'Cost Reduction',
  event_plan: 'Event Plan',
}

type IdeaRowProps = {
  idea: IdeaListItem
  currentUserId: number
  currentUserRole: 'submitter' | 'admin'
  onDeleted?: (id: number) => void
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDynamicFieldLabel(fieldKey: string) {
  return fieldKey
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function renderAttachmentPreview(ideaId: number, attachment: IdeaAttachmentMeta) {
  const previewUrl = `/api/ideas/${ideaId}/attachments/${attachment.id}`
  if (!attachment.previewEligible) {
    return <p className="text-xs text-[--color-text-muted]">Preview not available for this file type.</p>
  }
  if (attachment.mimeType.startsWith('image/')) {
    return <img src={previewUrl} alt={attachment.originalName} className="max-h-40 rounded-md border border-[--color-border] object-cover" />
  }
  if (attachment.mimeType.startsWith('audio/')) {
    return <audio controls src={previewUrl} className="w-full" />
  }
  if (attachment.mimeType.startsWith('video/')) {
    return <video controls src={previewUrl} className="max-h-48 w-full rounded-md border border-[--color-border]" />
  }
  if (attachment.mimeType === 'application/pdf') {
    return <iframe src={previewUrl} title={attachment.originalName} className="h-48 w-full rounded-md border border-[--color-border]" />
  }
  return <p className="text-xs text-[--color-text-muted]">Preview not available for this file type.</p>
}

function attachmentLabel(count: number) {
  return count === 1 ? '1 attachment' : `${count} attachments`
}

function hasCompletedScores(idea: IdeaListItem) {
  return idea.alignmentRating !== null
    && idea.alignmentRating !== undefined
    && idea.feasibilityRating !== null
    && idea.feasibilityRating !== undefined
    && idea.impactRating !== null
    && idea.impactRating !== undefined
}

function buildScoreSummary(idea: IdeaListItem) {
  if (!hasCompletedScores(idea)) return null
  return `Alignment ${idea.alignmentRating}/5 | Feasibility ${idea.feasibilityRating}/5 | Impact ${idea.impactRating}/5`
}

export default function IdeaRow({ idea, currentUserId, currentUserRole, onDeleted }: IdeaRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [detail, setDetail] = useState<IdeaDetail | null>(null)
  const [timeline, setTimeline] = useState<IdeaTimelineEntry[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isOwner = currentUserId === idea.submitterId
  const canDelete = isOwner || currentUserRole === 'admin'
  const submitterDisplayName =
    currentUserRole === 'admin' && idea.isSubmitterAnonymous ? 'Anonymous' : idea.submitterName
  const completedScoreSummary = buildScoreSummary(idea)
  // Fetch detail/timeline when the collapsible is opened.
  // Let Radix's CollapsibleTrigger handle toggling so we don't mix handlers.
  useEffect(() => {
    if (!isOpen || detail || timeline) return

    setIsLoading(true)
    setLoadError(null)

    void Promise.all([
      getIdeaDetailAction(idea.id),
      getIdeaTimelineAction({ ideaId: idea.id }),
    ]).then(([detailResult, timelineResult]) => {
      setIsLoading(false)

      if (detailResult.ok) {
        setDetail(detailResult.data)
      } else {
        setLoadError(detailResult.error)
        return
      }

      if (timelineResult.ok) {
        setTimeline(timelineResult.data)
      } else {
        setLoadError(timelineResult.error)
      }
    })
  }, [isOpen, detail, timeline, idea.id])

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="overflow-hidden rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] shadow-sm transition-[box-shadow,border-color] duration-200 hover:shadow-md hover:border-[var(--color-shell-primary)]/30">
        {/* Row header */}
        <CollapsibleTrigger className="flex w-full cursor-pointer items-start justify-between gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-shell-focus)]">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start gap-2">
              <span className="truncate text-base font-semibold tracking-tight text-[var(--color-shell-text)] sm:text-lg">
                {idea.title}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-shell-text-muted)]">
              <Badge variant="outline" className="px-2.5 py-1 text-[var(--color-shell-text)]">
                {CATEGORY_LABELS[idea.category]}
              </Badge>
              <span>{submitterDisplayName} on {formatDate(idea.createdAt)}</span>
              {idea.hasAttachment && (
                <span className="font-medium text-[var(--color-shell-primary)]">{attachmentLabel(idea.attachmentCount)}</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            <StatusBadge status={idea.status} scoreReady={completedScoreSummary !== null} />
            <span className="text-[var(--color-shell-text-muted)]" aria-hidden="true">
              {isOpen ? '\u25BE' : '\u25B8'}
            </span>
          </div>
        </CollapsibleTrigger>

        {/* Expanded content */}
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-[fadeIn_150ms_ease-out] data-[state=closed]:animate-[fadeOut_120ms_ease-in] data-[state=closed]:hidden">
          <div className="border-t border-[var(--color-shell-border)] px-5 pb-5 pt-4 space-y-4">
            {isLoading && (
              <p className="text-sm text-[var(--color-shell-text-muted)]" aria-live="polite">
                Loading...
              </p>
            )}
            {loadError && (
              <p className="text-sm text-[var(--color-danger)]" role="alert">
                {loadError}
              </p>
            )}
            {detail && (
              <>
                {completedScoreSummary && (
                  <p className="rounded-xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-3 py-2 text-xs text-[var(--color-shell-text)]">
                    Scores: {completedScoreSummary}
                  </p>
                )}

                <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-shell-text)]">{detail.description}</p>

                {detail.dynamicFields.length > 0 && (
                  <div className="space-y-2 rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] p-4 text-sm">
                    <p className="font-semibold text-[var(--color-shell-text)]">Category details</p>
                    <dl className="space-y-2">
                      {detail.dynamicFields.map((field) => (
                        <div key={field.fieldKey} className="flex flex-wrap gap-2 rounded-lg bg-[var(--color-shell-surface)] px-3 py-2">
                          <dt className="font-medium text-[var(--color-shell-text)]">{formatDynamicFieldLabel(field.fieldKey)}:</dt>
                          <dd className="text-[var(--color-shell-text-muted)]">{field.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {detail.evaluation !== null && currentUserId === idea.submitterId && (
                  <div className="space-y-1 rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] p-4 text-sm">
                    <p className="font-semibold text-[var(--color-shell-text)]">
                      Evaluation:{' '}
                      <span className={detail.evaluation.status === 'accepted' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                        {detail.evaluation.status === 'accepted' ? 'Accepted' : 'Rejected'}
                      </span>
                    </p>
                    {detail.evaluation.comment && (
                      <p className="text-[var(--color-shell-text-muted)]">{detail.evaluation.comment}</p>
                    )}
                  </div>
                )}

                {detail.attachmentName && (
                  <div>
                    {detail.attachments && detail.attachments.length > 0 ? (
                      <div className="space-y-3">
                        {detail.attachments.map((attachment) => (
                          <div key={attachment.id} className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-3 shadow-sm">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-[var(--color-shell-text)]">{attachment.originalName}</p>
                                <p className="text-xs text-[var(--color-shell-text-muted)]">
                                  {attachment.mimeType} · {formatBytes(attachment.sizeBytes)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <a
                                  href={`/api/ideas/${idea.id}/attachments/${attachment.id}`}
                                  className="text-[var(--color-shell-primary)] hover:underline"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open
                                </a>
                                <a
                                  href={`/api/ideas/${idea.id}/attachments/${attachment.id}?download=1`}
                                  className="text-[var(--color-shell-text)] hover:underline"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                            {renderAttachmentPreview(idea.id, attachment)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <a
                        href={`/api/ideas/${idea.id}/attachment`}
                        download={detail.attachmentName}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-shell-border)] px-3 py-1.5 text-xs text-[var(--color-shell-text)] transition-colors hover:bg-[var(--color-shell-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-shell-focus)]"
                      >
                        ⬇ {detail.attachmentName}
                        {detail.attachmentSize !== null && (
                          <span className="text-[var(--color-shell-text-muted)]">({formatBytes(detail.attachmentSize)})</span>
                        )}
                      </a>
                    )}
                  </div>
                )}

                {timeline && <IdeaTimeline entries={timeline} />}

                <div className="flex items-center gap-3 pt-1">
                  {isOwner && (
                    <Link
                      href={`/ideas/${idea.id}/edit`}
                      className="text-xs text-[var(--color-shell-primary)] hover:underline"
                    >
                      Edit
                    </Link>
                  )}
                  {canDelete && (
                    <DeleteIdeaButtonLazy
                      id={idea.id}
                      onDeleted={() => onDeleted?.(idea.id)}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// Lazy-import DeleteIdeaButton to avoid circular deps at module load time
import dynamic from 'next/dynamic'

const DeleteIdeaButtonLazy = dynamic(
  () => import('@/components/ideas/DeleteIdeaButton'),
  { ssr: false },
)
