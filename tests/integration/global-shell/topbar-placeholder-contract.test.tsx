import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProtectedShell from '@/components/layout/ProtectedShell'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('Topbar placeholder contract', () => {
  it('renders a stable non-interactive placeholder in the topbar', () => {
    render(
      <ProtectedShell role="submitter" displayName="Placeholder User">
        <div>Placeholder Contract Content</div>
      </ProtectedShell>,
    )

    const placeholder = screen.getByTestId('search-placeholder')
    expect(placeholder).toBeInTheDocument()
    expect(placeholder).toHaveAttribute('aria-hidden', 'true')
    expect(placeholder).toHaveClass('min-w-32')
    expect(placeholder).toHaveClass('md:min-w-40')
    expect(placeholder).toHaveClass('lg:min-w-56')
  })
})