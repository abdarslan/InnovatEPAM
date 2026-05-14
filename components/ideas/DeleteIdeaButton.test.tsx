import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DeleteIdeaButton from './DeleteIdeaButton'
import type { ActionResult } from '@/actions/ideas'

// Mock useTransition to run synchronously
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useTransition: () => [false, (fn: () => void) => fn()],
  }
})

const mockDeleteAction = vi.fn()
vi.mock('@/actions/ideas', async () => {
  const actual = await vi.importActual<typeof import('@/actions/ideas')>('@/actions/ideas')
  return {
    ...actual,
    deleteIdeaAction: (...args: unknown[]) => mockDeleteAction(...args),
  }
})

describe('DeleteIdeaButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteAction.mockResolvedValue({ ok: true, data: undefined } satisfies ActionResult<void>)
  })

  it('does not show dialog on initial render', () => {
    render(<DeleteIdeaButton id={1} />)
    expect(screen.queryByText(/permanently delete/i)).not.toBeInTheDocument()
  })

  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<DeleteIdeaButton id={1} />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(await screen.findByText(/permanently delete this idea/i)).toBeInTheDocument()
  })

  it('calls deleteIdeaAction when confirm is clicked', async () => {
    const user = userEvent.setup()
    render(<DeleteIdeaButton id={42} />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await screen.findByText(/permanently delete this idea/i)
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(mockDeleteAction).toHaveBeenCalledWith(42))
  })

  it('does NOT call deleteIdeaAction when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<DeleteIdeaButton id={1} />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await screen.findByText(/permanently delete this idea/i)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockDeleteAction).not.toHaveBeenCalled()
  })

  it('shows error when action returns failure', async () => {
    mockDeleteAction.mockResolvedValue({ ok: false, error: 'Delete failed. Please try again.' } satisfies ActionResult<void>)
    const user = userEvent.setup()
    render(<DeleteIdeaButton id={1} />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await screen.findByText(/permanently delete this idea/i)
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Delete failed. Please try again.')
  })

  it('calls onDeleted callback after successful delete', async () => {
    const onDeleted = vi.fn()
    const user = userEvent.setup()
    render(<DeleteIdeaButton id={1} onDeleted={onDeleted} />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await screen.findByText(/permanently delete this idea/i)
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1))
  })
})
