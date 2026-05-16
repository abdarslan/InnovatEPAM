import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import IdeaRow from './IdeaRow'
import type { IdeaListItem, ActionResult, IdeaDetail } from '@/actions/ideas'

// Mock next/dynamic (used for DeleteIdeaButtonLazy)
vi.mock('next/dynamic', () => ({
  default: () => () => <button>Delete</button>,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const mockGetIdeaDetailAction = vi.fn()
const mockGetIdeaTimelineAction = vi.fn()
vi.mock('@/actions/ideas', async () => {
  const actual = await vi.importActual<typeof import('@/actions/ideas')>('@/actions/ideas')
  return {
    ...actual,
    getIdeaDetailAction: (...args: unknown[]) => mockGetIdeaDetailAction(...args),
    getIdeaTimelineAction: (...args: unknown[]) => mockGetIdeaTimelineAction(...args),
  }
})

const baseIdea: IdeaListItem = {
  id: 1,
  title: 'Test Idea Title',
  category: 'technology_innovation',
  status: 'submitted',
  currentStage: 'stage_1_triage',
  currentOutcome: 'in_progress',
  isTerminal: false,
  submitterName: 'Alice',
  submitterId: 42,
  createdAt: new Date('2026-05-01').getTime(),
  updatedAt: new Date('2026-05-01').getTime(),
  attachmentCount: 0,
  hasAttachment: false,
}

const baseDetail: IdeaDetail = {
  ...baseIdea,
  description: 'This is the full description of the test idea.',
  attachments: [],
  attachmentName: null,
  attachmentSize: null,
  attachmentMimeType: null,
  evaluation: null,
  dynamicFields: [],
}

describe('IdeaRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdeaDetailAction.mockResolvedValue({ ok: true, data: baseDetail } satisfies ActionResult<IdeaDetail>)
    mockGetIdeaTimelineAction.mockResolvedValue({
      ok: true,
      data: [
        {
          sequence: 1,
          stage: 'stage_1_triage',
          outcome: 'in_progress',
          decidedAt: new Date('2026-05-01').getTime(),
        },
      ],
    })
  })

  it('renders the idea header fields', () => {
    render(<IdeaRow idea={baseIdea} currentUserId={42} currentUserRole="submitter" />)
    expect(screen.getByText('Test Idea Title')).toBeInTheDocument()
    expect(screen.getByText('Technology Innovation')).toBeInTheDocument()
    expect(screen.getByText(/Alice\s+on\s+1 May 2026/i)).toBeInTheDocument()
  })

  it('reveals description after expanding and closes again on second click', async () => {
    const user = userEvent.setup()
    render(<IdeaRow idea={baseIdea} currentUserId={42} currentUserRole="submitter" />)
    const toggleButton = screen.getByRole('button', { name: /test idea title/i })

    await user.click(toggleButton)
    await waitFor(() => {
      expect(screen.getByText('This is the full description of the test idea.')).toBeInTheDocument()
      expect(screen.getByText(/timeline/i)).toBeInTheDocument()
    })

    await user.click(toggleButton)
    await waitFor(() => {
      expect(screen.queryByText('This is the full description of the test idea.')).not.toBeInTheDocument()
      expect(screen.queryByText(/timeline/i)).not.toBeInTheDocument()
    })
  })

  it('does not show download link when hasAttachment is false', async () => {
    const user = userEvent.setup()
    render(<IdeaRow idea={baseIdea} currentUserId={42} currentUserRole="submitter" />)
    await user.click(screen.getByRole('button'))
    await waitFor(() => screen.getByText('This is the full description of the test idea.'))
    expect(screen.queryByRole('link', { name: /⬇/i })).not.toBeInTheDocument()
  })

  it('shows download link when hasAttachment is true', async () => {
    const user = userEvent.setup()
    const ideaWithFile: IdeaListItem = { ...baseIdea, hasAttachment: true, attachmentCount: 1 }
    const detailWithFile: IdeaDetail = {
      ...baseDetail,
      hasAttachment: true,
      attachmentCount: 1,
      attachments: [{
        id: 9,
        originalName: 'report.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 102400,
        previewEligible: true,
      }],
      attachmentName: 'report.pdf',
      attachmentSize: 102400,
      attachmentMimeType: 'application/pdf',
    }
    mockGetIdeaDetailAction.mockResolvedValue({ ok: true, data: detailWithFile })
    render(<IdeaRow idea={ideaWithFile} currentUserId={42} currentUserRole="submitter" />)
    await user.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('report.pdf')).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /download/i })).toHaveAttribute('href', '/api/ideas/1/attachments/9?download=1')
  })

  it('shows dynamic category fields in expanded detail', async () => {
    const user = userEvent.setup()
    const detailWithDynamic: IdeaDetail = {
      ...baseDetail,
      dynamicFields: [
        { fieldKey: 'planned_date', value: '2026-11-20' },
        { fieldKey: 'planned_attendees', value: '80' },
      ],
    }

    mockGetIdeaDetailAction.mockResolvedValue({ ok: true, data: detailWithDynamic })

    render(<IdeaRow idea={{ ...baseIdea, category: 'event_plan' }} currentUserId={42} currentUserRole="submitter" />)
    await user.click(screen.getByRole('button', { name: /test idea title/i }))

    await waitFor(() => {
      expect(screen.getByText(/category details/i)).toBeInTheDocument()
      expect(screen.getByText(/planned date:/i)).toBeInTheDocument()
      expect(screen.getByText('2026-11-20')).toBeInTheDocument()
      expect(screen.getByText(/planned attendees:/i)).toBeInTheDocument()
      expect(screen.getByText('80')).toBeInTheDocument()
    })
  })

  it('renders completed idea score summary for scored ideas', async () => {
    const user = userEvent.setup()
    const completedIdea: IdeaListItem = {
      ...baseIdea,
      status: 'accepted',
      currentStage: 'stage_4_final_executive_decision',
      currentOutcome: 'final_approved',
      isTerminal: true,
      alignmentRating: 4,
      feasibilityRating: 3,
      impactRating: 5,
    }

    render(<IdeaRow idea={completedIdea} currentUserId={42} currentUserRole="submitter" />)
    await user.click(screen.getByRole('button', { name: /test idea title/i }))

    await waitFor(() => {
      expect(screen.getByText(/scores: alignment 4\/5 \| feasibility 3\/5 \| impact 5\/5/i)).toBeInTheDocument()
    })
  })
})
