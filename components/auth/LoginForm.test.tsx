import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm'

vi.mock('@/actions/auth', () => ({
  loginAction: vi.fn(),
  logoutAction: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

import { loginAction } from '@/actions/auth'
const mockLoginAction = vi.mocked(loginAction)

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email, password fields and submit button', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation error when email is empty', async () => {
    render(<LoginForm />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })

  it('disables submit button while login is pending', async () => {
    let resolveAction!: (value: { ok: false; error: string }) => void
    mockLoginAction.mockReturnValue(
      new Promise((res) => { resolveAction = res })
    )

    render(<LoginForm />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'user@epam.com')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })

    resolveAction({ ok: false, error: 'Invalid email or password.' })
  })

  it('shows error message from server action', async () => {
    mockLoginAction.mockResolvedValue({
      ok: false,
      error: 'Invalid email or password.',
    })

    render(<LoginForm />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'user@epam.com')
    await user.type(screen.getByLabelText(/password/i), 'WrongPass1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })
})
