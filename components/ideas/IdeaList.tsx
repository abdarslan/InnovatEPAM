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
      <p className="text-sm text-[--color-text-muted]">No ideas have been submitted yet.</p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-[--color-text-muted]">
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
