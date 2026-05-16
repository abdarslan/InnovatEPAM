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
      <div className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-6 text-sm text-[var(--color-shell-text-muted)] shadow-sm">
        No drafts yet. Start a new idea and click <strong>Save Draft</strong> to save your progress.
      </div>
    )
  }

  return (
    <ul
      aria-label="Your drafts"
      className="overflow-hidden rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] shadow-sm"
    >
      {drafts.map((draft) => (
        <li
          key={draft.id}
          className="flex items-center justify-between gap-4 border-t border-[var(--color-shell-border)] px-5 py-4 first:border-t-0"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-semibold text-[var(--color-shell-text)]">
              {draft.title ?? <span className="italic text-[var(--color-shell-text-muted)]">Untitled draft</span>}
            </p>
            <p className="text-xs text-[var(--color-shell-text-muted)]">
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
            className="shrink-0 rounded-full border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--color-shell-text)] transition-colors hover:bg-[var(--color-shell-surface-muted)]/80"
            aria-label={`Continue draft: ${draft.title ?? 'Untitled draft'}`}
          >
            Continue
          </Link>
        </li>
      ))}
    </ul>
  )
}
