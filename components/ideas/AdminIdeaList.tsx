import type { AdminIdeaListItem, IdeaStatus } from '@/actions/ideas'
import { AdminIdeaRow } from '@/components/ideas/AdminIdeaRow'
import { AdminIdeaListFilter } from './AdminIdeaListFilter'

type Props = {
  ideas: AdminIdeaListItem[]
  currentStatus?: IdeaStatus
}

export function AdminIdeaList({ ideas, currentStatus }: Props) {
  const projectedIdeas = ideas.map((idea) => {
    const shouldAnonymize = true

    if (!shouldAnonymize) {
      return idea
    }

    return {
      ...idea,
      submitterName: 'Anonymous',
      isSubmitterAnonymous: true,
    }
  })

  return (
    <section aria-label="Idea management list">
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] px-4 py-3 shadow-sm">
        <label htmlFor="status-filter" className="text-sm font-medium text-[var(--color-shell-text)]">
          Filter by status:
        </label>
        <AdminIdeaListFilter currentStatus={currentStatus} />
      </div>

      {ideas.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-6 text-sm text-[var(--color-shell-text-muted)] shadow-sm">
          No ideas found.
        </div>
      ) : (
        <ul className="space-y-4">
          {projectedIdeas.map((idea) => (
            <AdminIdeaRow key={idea.id} idea={idea} />
          ))}
        </ul>
      )}
    </section>
  )
}
