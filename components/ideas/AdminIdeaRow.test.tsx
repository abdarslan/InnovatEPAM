import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminIdeaRow } from './AdminIdeaRow'
import type { AdminIdeaListItem } from '@/actions/ideas'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
const mockGetIdeaDetailAction = vi.fn()
vi.mock('@/actions/ideas', () => ({
  decideIdeaStageAction: vi.fn(),
  getIdeaDetailAction: (...args: unknown[]) => mockGetIdeaDetailAction(...args),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const baseIdea: AdminIdeaListItem = {
  id:              1,
  title:           'Great Idea',
  category:        'technology_innovation',
  status:          'submitted',
  currentStage:    'stage_1_triage',
  currentOutcome:  'in_progress',
  isTerminal:      false,
  submitterName:   'Alice',
  submitterId:     10,
  createdAt:       Date.now(),
  updatedAt:       Date.now(),
  hasAttachment:   false,
  attachmentCount: 0,
  reviewerName:    null,
  reviewStartedAt: null,
  latestDecisionAt: null,
  latestDecidedByUserName: null,
  evaluation:      null,
}

describe('AdminIdeaRow', () => {
  mockGetIdeaDetailAction.mockResolvedValue({
    ok: true,
    data: {
      ...baseIdea,
      description: 'Dynamic admin detail',
      attachmentName: null,
      attachmentSize: null,
      attachmentMimeType: null,
      evaluation: null,
      dynamicFields: [
        { fieldKey: 'planned_date', value: '2026-11-20' },
      ],
    },
  })

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
          currentOutcome: 'rejected',
          isTerminal: true,
          evaluation: { adminName: 'Admin', status: 'rejected', comment: 'Not viable', createdAt: Date.now() },
        }}
      />
    )
    expect(screen.getByText('Not viable')).toBeInTheDocument()
  })

  it('shows stage decision controls for active ideas', () => {
    render(<AdminIdeaRow idea={baseIdea} />)
    expect(screen.getByRole('button', { name: /approve to next stage/i })).toBeInTheDocument()
  })

  it('shows dynamic fields when admin opens details', async () => {
    const user = userEvent.setup()
    render(<AdminIdeaRow idea={baseIdea} />)

    await user.click(screen.getByRole('button', { name: /view details/i }))

    expect(await screen.findByText(/category details/i)).toBeInTheDocument()
    expect(await screen.findByText(/planned date:/i)).toBeInTheDocument()
    expect(await screen.findByText('2026-11-20')).toBeInTheDocument()
  })

  it('shows latest accountability metadata when available', () => {
    render(
      <AdminIdeaRow
        idea={{
          ...baseIdea,
          latestDecisionAt: 1710000000000,
          latestDecidedByUserName: 'Senior Admin',
        }}
      />,
    )

    expect(screen.getByText(/latest decision by senior admin/i)).toBeInTheDocument()
  })
})
