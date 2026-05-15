import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EvaluationPanel } from './EvaluationPanel'

vi.mock('@/actions/ideas', () => ({
  decideIdeaStageAction: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { decideIdeaStageAction } from '@/actions/ideas'
import { toast } from 'sonner'

const mockDecide = decideIdeaStageAction as ReturnType<typeof vi.fn>
const toastSuccess = (toast as unknown as { success: ReturnType<typeof vi.fn> }).success
const toastError   = (toast as unknown as { error: ReturnType<typeof vi.fn> }).error

describe('EvaluationPanel', () => {
  const onSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders next-stage and reject actions for in-progress non-final stage', () => {
    render(
      <EvaluationPanel
        ideaId={1}
        currentStage="stage_1_triage"
        currentOutcome="in_progress"
        isTerminal={false}
        onSuccess={onSuccess}
      />,
    )
    expect(screen.getByRole('button', { name: /approve to next stage/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
  })

  it('calls decideIdeaStageAction with mandatory comment', async () => {
    mockDecide.mockResolvedValue({ ok: true, data: undefined })
    render(
      <EvaluationPanel
        ideaId={2}
        currentStage="stage_2_department_review"
        currentOutcome="in_progress"
        isTerminal={false}
        onSuccess={onSuccess}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /approve to next stage/i }))
    fireEvent.click(screen.getByRole('radio', { name: /alignment rating 4 of 5/i }))
    fireEvent.change(screen.getByLabelText(/decision comment/i), { target: { value: 'Looks strong.' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm decision/i }))

    await waitFor(() => expect(mockDecide).toHaveBeenCalledWith(
      expect.objectContaining({ ideaId: 2, decision: 'approve_next', comment: 'Looks strong.', ratingScore: 4 }),
    ))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(toastSuccess).toHaveBeenCalledWith('Decision saved.')
  })

  it('shows validation error when comment is empty', async () => {
    render(
      <EvaluationPanel
        ideaId={3}
        currentStage="stage_3_feasibility"
        currentOutcome="in_progress"
        isTerminal={false}
        onSuccess={onSuccess}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /reject/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm decision/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/decision comment is required/i)
  })

  it('requires stage 2 rating before confirming approve-next decision', async () => {
    render(
      <EvaluationPanel
        ideaId={31}
        currentStage="stage_2_department_review"
        currentOutcome="in_progress"
        isTerminal={false}
        onSuccess={onSuccess}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /approve to next stage/i }))
    fireEvent.change(screen.getByLabelText(/decision comment/i), { target: { value: 'Ready to advance' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm decision/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/please select a rating before confirming/i)
    expect(mockDecide).not.toHaveBeenCalled()
  })

  it('renders final decision actions for stage 4', () => {
    render(
      <EvaluationPanel
        ideaId={4}
        currentStage="stage_4_final_executive_decision"
        currentOutcome="in_progress"
        isTerminal={false}
        onSuccess={onSuccess}
      />,
    )
    expect(screen.getByRole('button', { name: /final approve/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /final reject/i })).toBeInTheDocument()
  })

  it('renders complete state for terminal ideas', () => {
    render(
      <EvaluationPanel
        ideaId={5}
        currentStage="stage_4_final_executive_decision"
        currentOutcome="final_approved"
        isTerminal
        onSuccess={onSuccess}
      />,
    )
    expect(screen.getByText(/evaluation complete/i)).toBeInTheDocument()
  })

  it('shows action error toast when decision call fails', async () => {
    mockDecide.mockResolvedValue({ ok: false, error: 'INVALID_TRANSITION' })
    render(
      <EvaluationPanel
        ideaId={6}
        currentStage="stage_1_triage"
        currentOutcome="in_progress"
        isTerminal={false}
        onSuccess={onSuccess}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /approve to next stage/i }))
    fireEvent.change(screen.getByLabelText(/decision comment/i), { target: { value: 'Go ahead.' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm decision/i }))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('INVALID_TRANSITION'))
  })
})
