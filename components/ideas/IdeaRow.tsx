'use client'

import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { getIdeaDetailAction } from '@/actions/ideas'
import type { IdeaListItem, IdeaDetail } from '@/actions/ideas'
import type { IdeaCategory } from '@/lib/db/schema'
import Link from 'next/link'

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  process_improvement: 'Process Improvement',
  technology_innovation: 'Technology Innovation',
  customer_experience: 'Customer Experience',
  workplace_culture: 'Workplace Culture',
  cost_reduction: 'Cost Reduction',
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
              <span>·</span>
              <span>{formatDate(idea.createdAt)}</span>
              {idea.hasAttachment && (
                <>
                  <span>·</span>
                  <span className="text-[--color-info]">📎 attachment</span>
                </>
              )}
            </div>
          </div>
          <span className="ml-3 shrink-0 text-[--color-text-muted]" aria-hidden="true">
            {isOpen ? '▲' : '▼'}
          </span>
        </CollapsibleTrigger>

        {/* Expanded content */}
        <CollapsibleContent>
          <div className="border-t border-[--color-border] px-4 py-4 space-y-4">
            {isLoading && (
              <p className="text-sm text-[--color-text-muted]" aria-live="polite">
                Loading…
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

                {detail.attachmentName && (
                  <div>
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
