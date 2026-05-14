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

  function handleDeleted(id: number) {
    setIdeas((prev) => prev.filter((idea) => idea.id !== id))
  }

  return (
    <IdeaList
      ideas={ideas}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
      onDeleted={handleDeleted}
    />
  )
}
