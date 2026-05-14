import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EvaluationPanel } from './EvaluationPanel'

vi.mock('@/actions/ideas', () => ({
  startReviewAction:  vi.fn(),
  evaluateIdeaAction: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { startReviewAction, evaluateIdeaAction } from '@/actions/ideas'
import { toast } from 'sonner'

const mockStart    = startReviewAction as ReturnType<typeof vi.fn>
const mockEvaluate = evaluateIdeaAction as ReturnType<typeof vi.fn>
const toastSuccess = (toast as unknown as { success: ReturnType<typeof vi.fn> }).success
const toastError   = (toast as unknown as { error: ReturnType<typeof vi.fn> }).error

describe('EvaluationPanel', () => {
  const onSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Start Review button for submitted status', () => {
    render(<EvaluationPanel ideaId={1} currentStatus="submitted" onSuccess={onSuccess} />)
    expect(screen.getByRole('button', { name: /start review/i })).toBeInTheDocument()
  })

  it('calls startReviewAction on button click', async () => {
    mockStart.mockResolvedValue({ ok: true, data: undefined })
    render(<EvaluationPanel ideaId={1} currentStatus="submitted" onSuccess={onSuccess} />)
    fireEvent.click(screen.getByRole('button', { name: /start review/i }))
    await waitFor(() => expect(mockStart).toHaveBeenCalledWith(1))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(toastSuccess).toHaveBeenCalledWith('Review started.')
  })

  it('shows error toast when startReviewAction fails', async () => {
    mockStart.mockResolvedValue({ ok: false, error: 'Already under review' })
    render(<EvaluationPanel ideaId={1} currentStatus="submitted" onSuccess={onSuccess} />)
    fireEvent.click(screen.getByRole('button', { name: /start review/i }))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Already under review'))
  })

  it('renders Accept and Reject buttons for under_review status', () => {
    render(<EvaluationPanel ideaId={2} currentStatus="under_review" onSuccess={onSuccess} />)
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
  })

  it('shows comment form when Accept is clicked', () => {
    render(<EvaluationPanel ideaId={2} currentStatus="under_review" onSuccess={onSuccess} />)
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))
    expect(screen.getByRole('button', { name: /confirm accept/i })).toBeInTheDocument()
  })

  it('calls evaluateIdeaAction with accepted status', async () => {
    mockEvaluate.mockResolvedValue({ ok: true, data: undefined })
    render(<EvaluationPanel ideaId={2} currentStatus="under_review" onSuccess={onSuccess} />)
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm accept/i }))
    await waitFor(() => expect(mockEvaluate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'accepted', ideaId: 2 })
    ))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it('shows validation error when rejecting without comment', async () => {
    render(<EvaluationPanel ideaId={2} currentStatus="under_review" onSuccess={onSuccess} />)
    fireEvent.click(screen.getByRole('button', { name: /reject/i }))
    // Leave comment empty and submit
    fireEvent.submit(screen.getByRole('button', { name: /confirm reject/i }).closest('form')!)
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/rejection reason/i)
    )
  })

  it('renders Evaluation complete for accepted status', () => {
    render(<EvaluationPanel ideaId={3} currentStatus="accepted" onSuccess={onSuccess} />)
    expect(screen.getByText(/evaluation complete/i)).toBeInTheDocument()
  })

  it('renders Evaluation complete for rejected status', () => {
    render(<EvaluationPanel ideaId={4} currentStatus="rejected" onSuccess={onSuccess} />)
    expect(screen.getByText(/evaluation complete/i)).toBeInTheDocument()
  })
})
