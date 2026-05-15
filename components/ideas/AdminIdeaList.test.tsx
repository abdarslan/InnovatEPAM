import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminIdeaList } from './AdminIdeaList'
import type { AdminIdeaListItem } from '@/actions/ideas'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/admin',
}))

const baseIdea: AdminIdeaListItem = {
  id: 1,
  title: 'Anonymous evaluation idea',
  category: 'technology_innovation',
  status: 'under_review',
  currentStage: 'stage_2_department_review',
  currentOutcome: 'in_progress',
  isTerminal: false,
  submitterName: 'Hidden User',
  isSubmitterAnonymous: false,
  submitterId: 11,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  hasAttachment: false,
  attachmentCount: 0,
  alignmentRating: null,
  feasibilityRating: null,
  impactRating: null,
  reviewerName: null,
  reviewStartedAt: null,
  latestDecisionAt: null,
  latestDecidedByUserName: null,
  evaluation: null,
}

describe('AdminIdeaList anonymization', () => {
  it('masks submitter identity for stage 2+ entries', () => {
    render(<AdminIdeaList ideas={[baseIdea]} />)

    expect(screen.queryByText(/hidden user/i)).not.toBeInTheDocument()
    expect(screen.getByText(/by anonymous/i)).toBeInTheDocument()
  })

  it('keeps submitter identity visible for stage 1 entries', () => {
    render(
      <AdminIdeaList
        ideas={[
          {
            ...baseIdea,
            currentStage: 'stage_1_triage',
            currentOutcome: 'in_progress',
            submitterName: 'Visible User',
          },
        ]}
      />,
    )

    expect(screen.getByText(/by visible user/i)).toBeInTheDocument()
  })
})
