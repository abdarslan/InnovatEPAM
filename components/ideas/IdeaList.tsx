import type { IdeaListItem } from '@/actions/ideas'
import IdeaRow from './IdeaRow'

type IdeaListProps = {
  ideas: IdeaListItem[]
  currentUserId: number
  currentUserRole: 'submitter' | 'admin'
  onDeleted?: (id: number) => void
}

export default function IdeaList({ ideas, currentUserId, currentUserRole, onDeleted }: IdeaListProps) {
  if (ideas.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-6 text-sm text-[var(--color-shell-text-muted)] shadow-sm">
        No ideas have been submitted yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-shell-text-muted)]">
        {ideas.length} ideas · {ideas.reduce((sum, idea) => sum + idea.attachmentCount, 0)} attachments
      </p>
      {ideas.map((idea) => (
        <IdeaRow
          key={idea.id}
          idea={idea}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  )
}
