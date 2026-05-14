import Link from 'next/link'
import type { IdeaDraftSummary } from '@/actions/idea-drafts'
import type { IdeaCategory } from '@/lib/db/schema'

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  process_improvement: 'Process Improvement',
  technology_innovation: 'Technology Innovation',
  customer_experience: 'Customer Experience',
  workplace_culture: 'Workplace Culture',
  cost_reduction: 'Cost Reduction',
  event_plan: 'Event Plan',
}

function formatUpdatedAt(ts: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(ts))
}

type DraftListProps = {
  drafts: IdeaDraftSummary[]
}

export default function DraftList({ drafts }: DraftListProps) {
  if (drafts.length === 0) {
    return (
      <p className="text-sm text-[--color-text-muted]">
        No drafts yet. Start a new idea and click <strong>Save Draft</strong> to save your progress.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-[--color-border] rounded-md border border-[--color-border]" aria-label="Your drafts">
      {drafts.map((draft) => (
        <li key={draft.id} className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="truncate text-sm font-medium text-[--color-text]">
              {draft.title ?? <span className="italic text-[--color-text-muted]">Untitled draft</span>}
            </p>
            <p className="text-xs text-[--color-text-muted]">
              {draft.category ? CATEGORY_LABELS[draft.category as IdeaCategory] : 'No category'}
              {' · '}
              Last saved{' '}
              <time dateTime={new Date(draft.updatedAt).toISOString()}>
                {formatUpdatedAt(draft.updatedAt)}
              </time>
            </p>
          </div>
          <Link
            href={`/ideas/new?draftId=${draft.id}`}
            className="shrink-0 rounded-md border border-[--color-border] px-3 py-1.5 text-xs font-medium text-[--color-text] hover:bg-[--color-surface]"
            aria-label={`Continue draft: ${draft.title ?? 'Untitled draft'}`}
          >
            Continue
          </Link>
        </li>
      ))}
    </ul>
  )
}
