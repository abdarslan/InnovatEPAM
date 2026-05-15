import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['submitted',    'Submitted'],
    ['under_review', 'Under Review'],
    ['accepted',     'Accepted'],
    ['rejected',     'Rejected'],
  ] as const)('renders label for status %s', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('sets aria-label to status value', () => {
    render(<StatusBadge status="accepted" />)
    expect(screen.getByLabelText('accepted')).toBeInTheDocument()
  })

  it('renders scored adjunct when scoreReady is true', () => {
    render(<StatusBadge status="accepted" scoreReady />)
    expect(screen.getByText(/accepted · scored/i)).toBeInTheDocument()
  })
})
