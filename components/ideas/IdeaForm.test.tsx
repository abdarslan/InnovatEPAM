import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import IdeaForm from './IdeaForm'
import type { ActionResult } from '@/actions/ideas'

// Mock useTransition so async transitions run synchronously in tests
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useTransition: () => [false, (fn: () => void) => fn()],
  }
})

const mockSuccessAction = vi.fn(
  async (_formData: FormData): Promise<ActionResult<{ id: number }>> => ({
    ok: true,
    data: { id: 1 },
  }),
)

const mockErrorAction = vi.fn(
  async (_formData: FormData): Promise<ActionResult<{ id: number }>> => ({
    ok: false,
    error: 'Submission failed. Please try again.',
  }),
)

describe('IdeaForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows validation errors when submitted empty', async () => {
    const user = userEvent.setup()
    render(<IdeaForm action={mockSuccessAction} />)
    await user.click(screen.getByRole('button', { name: /submit idea/i }))
    expect(await screen.findByText(/title must be at least 3 characters/i)).toBeInTheDocument()
    expect(await screen.findByText(/description must be at least 10 characters/i)).toBeInTheDocument()
    expect(await screen.findByText(/please select a valid category/i)).toBeInTheDocument()
    expect(mockSuccessAction).not.toHaveBeenCalled()
  })

  it('calls action with FormData on valid submit', async () => {
    const user = userEvent.setup()
    render(<IdeaForm action={mockSuccessAction} />)
    await user.type(screen.getByLabelText(/title/i), 'My Idea Title')
    await user.type(screen.getByLabelText(/description/i), 'This is a long enough description for the idea.')
    await user.selectOptions(screen.getByLabelText(/category/i), 'process_improvement')
    await user.click(screen.getByRole('button', { name: /submit idea/i }))
    await waitFor(() => expect(mockSuccessAction).toHaveBeenCalledTimes(1))
    const formData: FormData = mockSuccessAction.mock.calls[0][0]
    expect(formData.get('title')).toBe('My Idea Title')
    expect(formData.get('category')).toBe('process_improvement')
  })

  it('displays server error returned from action', async () => {
    const user = userEvent.setup()
    render(<IdeaForm action={mockErrorAction} />)
    await user.type(screen.getByLabelText(/title/i), 'Some Idea')
    await user.type(screen.getByLabelText(/description/i), 'Enough description here to pass.')
    await user.selectOptions(screen.getByLabelText(/category/i), 'cost_reduction')
    await user.click(screen.getByRole('button', { name: /submit idea/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Submission failed. Please try again.')
  })

  it('calls onSuccess callback after successful submit', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<IdeaForm action={mockSuccessAction} onSuccess={onSuccess} />)
    await user.type(screen.getByLabelText(/title/i), 'Valid Idea')
    await user.type(screen.getByLabelText(/description/i), 'Plenty of description text here.')
    await user.selectOptions(screen.getByLabelText(/category/i), 'workplace_culture')
    await user.click(screen.getByRole('button', { name: /submit idea/i }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(1))
  })
})
