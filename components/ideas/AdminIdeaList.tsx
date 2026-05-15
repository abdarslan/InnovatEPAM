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
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm font-medium">
          Filter by status:
        </label>
        <AdminIdeaListFilter currentStatus={currentStatus} />
      </div>

      {ideas.length === 0 ? (
        <p className="text-muted-foreground text-sm">No ideas found.</p>
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
