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
vi.mock('@/actions/ideas', async () => {
  const actual = await vi.importActual<typeof import('@/actions/ideas')>('@/actions/ideas')
  return {
    ...actual,
    getIdeaDetailAction: (...args: unknown[]) => mockGetIdeaDetailAction(...args),
  }
})

const baseIdea: IdeaListItem = {
  id: 1,
  title: 'Test Idea Title',
  category: 'technology_innovation',
  status: 'submitted',
  submitterName: 'Alice',
  submitterId: 42,
  createdAt: new Date('2026-05-01').getTime(),
  updatedAt: new Date('2026-05-01').getTime(),
  hasAttachment: false,
}

const baseDetail: IdeaDetail = {
  ...baseIdea,
  description: 'This is the full description of the test idea.',
  attachmentName: null,
  attachmentSize: null,
  attachmentMimeType: null,
  evaluation: null,
}

describe('IdeaRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdeaDetailAction.mockResolvedValue({ ok: true, data: baseDetail } satisfies ActionResult<IdeaDetail>)
  })

  it('renders the idea header fields', () => {
    render(<IdeaRow idea={baseIdea} currentUserId={42} currentUserRole="submitter" />)
    expect(screen.getByText('Test Idea Title')).toBeInTheDocument()
    expect(screen.getByText('Technology Innovation')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('reveals description after expanding', async () => {
    const user = userEvent.setup()
    render(<IdeaRow idea={baseIdea} currentUserId={42} currentUserRole="submitter" />)
    await user.click(screen.getByRole('button', { name: /test idea title/i }))
    await waitFor(() => {
      expect(screen.getByText('This is the full description of the test idea.')).toBeInTheDocument()
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
    const ideaWithFile: IdeaListItem = { ...baseIdea, hasAttachment: true }
    const detailWithFile: IdeaDetail = {
      ...baseDetail,
      hasAttachment: true,
      attachmentName: 'report.pdf',
      attachmentSize: 102400,
      attachmentMimeType: 'application/pdf',
    }
    mockGetIdeaDetailAction.mockResolvedValue({ ok: true, data: detailWithFile })
    render(<IdeaRow idea={ideaWithFile} currentUserId={42} currentUserRole="submitter" />)
    await user.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /report\.pdf/i })).toBeInTheDocument()
    })
  })
})
