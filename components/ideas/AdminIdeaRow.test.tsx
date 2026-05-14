import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminIdeaRow } from './AdminIdeaRow'
import type { AdminIdeaListItem } from '@/actions/ideas'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock('@/actions/ideas', () => ({
  startReviewAction:  vi.fn(),
  evaluateIdeaAction: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const baseIdea: AdminIdeaListItem = {
  id:              1,
  title:           'Great Idea',
  category:        'technology_innovation',
  status:          'submitted',
  submitterName:   'Alice',
  submitterId:     10,
  createdAt:       Date.now(),
  updatedAt:       Date.now(),
  hasAttachment:   false,
  reviewerName:    null,
  reviewStartedAt: null,
  evaluation:      null,
}

describe('AdminIdeaRow', () => {
  it('renders idea title and submitter', () => {
    render(<AdminIdeaRow idea={baseIdea} />)
    expect(screen.getByText('Great Idea')).toBeInTheDocument()
    expect(screen.getByText(/alice/i)).toBeInTheDocument()
  })

  it('shows StatusBadge with correct status', () => {
    render(<AdminIdeaRow idea={baseIdea} />)
    expect(screen.getByLabelText('submitted')).toBeInTheDocument()
  })

  it('shows reviewer name when present', () => {
    render(<AdminIdeaRow idea={{ ...baseIdea, status: 'under_review', reviewerName: 'Bob', reviewStartedAt: Date.now() }} />)
    expect(screen.getByText(/Bob/)).toBeInTheDocument()
  })

  it('shows evaluation comment when idea is evaluated', () => {
    render(
      <AdminIdeaRow
        idea={{
          ...baseIdea,
          status:     'rejected',
          evaluation: { adminName: 'Admin', status: 'rejected', comment: 'Not viable', createdAt: Date.now() },
        }}
      />
    )
    expect(screen.getByText('Not viable')).toBeInTheDocument()
  })

  it('shows EvaluationPanel Start Review button for submitted status', () => {
    render(<AdminIdeaRow idea={baseIdea} />)
    expect(screen.getByRole('button', { name: /start review/i })).toBeInTheDocument()
  })
})
