import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from './RegisterForm'

// Mock the server action
vi.mock('@/actions/auth', () => ({
  registerAction: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

import { registerAction } from '@/actions/auth'

const mockRegisterAction = vi.mocked(registerAction)

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all required fields', () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('shows error when non-EPAM domain is entered', async () => {
    render(<RegisterForm />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'test@gmail.com')
    await user.type(screen.getByLabelText(/display name/i), 'Test User')
    await user.type(screen.getByLabelText(/^password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/only @epam\.com/i)).toBeInTheDocument()
    })
  })

  it('shows error when password does not meet policy', async () => {
    render(<RegisterForm />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'test@epam.com')
    await user.type(screen.getByLabelText(/display name/i), 'Test User')
    await user.type(screen.getByLabelText(/^password/i), 'weak')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('shows server error when registerAction returns error', async () => {
    mockRegisterAction.mockResolvedValue({
      ok: false,
      error: 'An account with this email address already exists.',
    })

    render(<RegisterForm />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'existing@epam.com')
    await user.type(screen.getByLabelText(/display name/i), 'Existing User')
    await user.type(screen.getByLabelText(/^password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })
  })

  it('has aria-describedby on email field linking to error message', async () => {
    render(<RegisterForm />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'bad@gmail.com')
    await user.type(screen.getByLabelText(/display name/i), 'Test')
    await user.type(screen.getByLabelText(/^password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      const emailInput = screen.getByLabelText(/email/i)
      const describedBy = emailInput.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
    })
  })
})
