import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StateSurface from './StateSurface'

describe('StateSurface', () => {
  it('renders a readable shared surface for state feedback', () => {
    render(<StateSurface title="Access denied" description="You do not have permission." />)

    expect(screen.getByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
    expect(screen.getByText(/you do not have permission/i)).toBeInTheDocument()
  })

  it('renders action buttons for recovery flows', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()

    render(
      <StateSurface
        title="Could not load ideas"
        description="Please try again."
        primaryAction={{ label: 'Retry', onClick: onRetry }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})