import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProtectedShell from '@/components/layout/ProtectedShell'

vi.mock('next/navigation', () => ({
  usePathname: () => '/ideas',
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('ProtectedShell integration', () => {
  it('renders top bar, sidebar navigation, and children content together', () => {
    render(
      <ProtectedShell role="submitter" displayName="Test User">
        <div>Protected Page Content</div>
      </ProtectedShell>,
    )

    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument()
    expect(screen.getByText(/search placeholder/i)).toBeInTheDocument()
    expect(screen.getByText(/protected page content/i)).toBeInTheDocument()
  })
})
