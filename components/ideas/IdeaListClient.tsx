'use client'

import { useState } from 'react'
import IdeaList from '@/components/ideas/IdeaList'
import type { IdeaListItem } from '@/actions/ideas'

type IdeaListClientProps = {
  initialIdeas: IdeaListItem[]
  currentUserId: number
  currentUserRole: 'submitter' | 'admin'
}

export default function IdeaListClient({
  initialIdeas,
  currentUserId,
  currentUserRole,
}: IdeaListClientProps) {
  const [ideas, setIdeas] = useState<IdeaListItem[]>(initialIdeas)

  const completedWithScores = ideas.filter((idea) =>
    idea.alignmentRating !== null
    && idea.alignmentRating !== undefined
    && idea.feasibilityRating !== null
    && idea.feasibilityRating !== undefined
    && idea.impactRating !== null
    && idea.impactRating !== undefined,
  )

  function handleDeleted(id: number) {
    setIdeas((prev) => prev.filter((idea) => idea.id !== id))
  }

  return (
    <div className="space-y-3">
      {completedWithScores.length > 0 && (
        <section aria-label="Completed idea scores" className="rounded border border-border bg-muted/30 p-3 text-sm">
          <p className="font-medium">Completed Idea Scores</p>
          <ul className="mt-1 space-y-1 text-muted-foreground">
            {completedWithScores.map((idea) => (
              <li key={idea.id}>
                {idea.title}: Alignment {idea.alignmentRating}/5 | Feasibility {idea.feasibilityRating}/5 | Impact {idea.impactRating}/5
              </li>
            ))}
          </ul>
        </section>
      )}

      <IdeaList
        ideas={ideas}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
