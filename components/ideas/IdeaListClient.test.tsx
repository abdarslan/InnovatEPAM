import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import IdeaListClient from './IdeaListClient'
import type { IdeaListItem } from '@/actions/ideas'

const baseIdea: IdeaListItem = {
  id: 1,
  title: 'Completed Idea',
  category: 'technology_innovation',
  status: 'accepted',
  currentStage: 'stage_4_final_executive_decision',
  currentOutcome: 'final_approved',
  isTerminal: true,
  submitterName: 'User One',
  submitterId: 9,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  hasAttachment: false,
  attachmentCount: 0,
  alignmentRating: 4,
  feasibilityRating: 3,
  impactRating: 5,
}

describe('IdeaListClient score formatting', () => {
  it('renders completed idea score summary section', () => {
    render(
      <IdeaListClient
        initialIdeas={[baseIdea]}
        currentUserId={9}
        currentUserRole="submitter"
      />,
    )

    expect(screen.getByText(/completed idea scores/i)).toBeInTheDocument()
    expect(screen.getByText(/alignment 4\/5 \| feasibility 3\/5 \| impact 5\/5/i)).toBeInTheDocument()
  })
})
