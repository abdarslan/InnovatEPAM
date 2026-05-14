'use client'

import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { getIdeaDetailAction } from '@/actions/ideas'
import type { IdeaAttachmentMeta, IdeaListItem, IdeaDetail } from '@/actions/ideas'
import type { IdeaCategory } from '@/lib/db/schema'
import Link from 'next/link'
import { StatusBadge } from '@/components/ideas/StatusBadge'

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

export default function IdeaRow({ idea, currentUserId, currentUserRole, onDeleted }: IdeaRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [detail, setDetail] = useState<IdeaDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isOwner = currentUserId === idea.submitterId
  const canDelete = isOwner || currentUserRole === 'admin'

  async function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (open && !detail) {
      setIsLoading(true)
      setLoadError(null)
      const result = await getIdeaDetailAction(idea.id)
      setIsLoading(false)
      if (result.ok) {
        setDetail(result.data)
      } else {
        setLoadError(result.error)
      }
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <div className="rounded-lg border border-[--color-border] bg-white">
        {/* Row header */}
        <CollapsibleTrigger
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          aria-expanded={isOpen}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="truncate font-medium text-[--color-text]">{idea.title}</span>
            <div className="flex items-center gap-2 text-xs text-[--color-text-muted]">
              <span className="rounded bg-surface px-1.5 py-0.5 border border-[--color-border]">
                {CATEGORY_LABELS[idea.category]}
              </span>
              <span>{idea.submitterName}</span>
              <span>{'\u00B7'}</span>
              <span>{formatDate(idea.createdAt)}</span>
              {idea.hasAttachment && (
                <>
                  <span>{'\u00B7'}</span>
                  <span className="text-[--color-info]">{attachmentLabel(idea.attachmentCount)}</span>
                </>
              )}
            </div>
          </div>
          <div className="ml-3 flex items-center gap-2 shrink-0">
            <StatusBadge status={idea.status} />
            <span className="text-[--color-text-muted]" aria-hidden="true">
              {isOpen ? '\u25BE' : '\u25B8'}
            </span>
          </div>
        </CollapsibleTrigger>

        {/* Expanded content */}
        <CollapsibleContent>
          <div className="border-t border-[--color-border] px-4 py-4 space-y-4">
            {isLoading && (
              <p className="text-sm text-[--color-text-muted]" aria-live="polite">
                Loading...
              </p>
            )}
            {loadError && (
              <p className="text-sm text-red-600" role="alert">
                {loadError}
              </p>
            )}
            {detail && (
              <>
                <p className="text-sm text-[--color-text] whitespace-pre-wrap">{detail.description}</p>

                {detail.dynamicFields.length > 0 && (
                  <div className="rounded border border-border bg-muted/50 p-3 text-sm space-y-1">
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

                {detail.evaluation !== null && currentUserId === idea.submitterId && (
                  <div className="rounded border border-border bg-muted/50 p-3 text-sm space-y-1">
                    <p className="font-medium">
                      Evaluation:{' '}
                      <span className={detail.evaluation.status === 'accepted' ? 'text-green-700' : 'text-red-700'}>
                        {detail.evaluation.status === 'accepted' ? 'Accepted' : 'Rejected'}
                      </span>
                    </p>
                    {detail.evaluation.comment && (
                      <p className="text-muted-foreground">{detail.evaluation.comment}</p>
                    )}
                  </div>
                )}

                {detail.attachmentName && (
                  <div>
                    {detail.attachments && detail.attachments.length > 0 ? (
                      <div className="space-y-3">
                        {detail.attachments.map((attachment) => (
                          <div key={attachment.id} className="rounded-md border border-[--color-border] p-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-[--color-text]">{attachment.originalName}</p>
                                <p className="text-xs text-[--color-text-muted]">
                                  {attachment.mimeType} · {formatBytes(attachment.sizeBytes)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <a
                                  href={`/api/ideas/${idea.id}/attachments/${attachment.id}`}
                                  className="text-[--color-primary] hover:underline"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open
                                </a>
                                <a
                                  href={`/api/ideas/${idea.id}/attachments/${attachment.id}?download=1`}
                                  className="text-[--color-text] hover:underline"
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
                        className="inline-flex items-center gap-1.5 rounded-md border border-[--color-border] px-3 py-1.5 text-xs text-[--color-text] hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        ⬇ {detail.attachmentName}
                        {detail.attachmentSize !== null && (
                          <span className="text-[--color-text-muted]">({formatBytes(detail.attachmentSize)})</span>
                        )}
                      </a>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  {isOwner && (
                    <Link
                      href={`/ideas/${idea.id}/edit`}
                      className="text-xs text-[--color-primary] hover:underline"
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
