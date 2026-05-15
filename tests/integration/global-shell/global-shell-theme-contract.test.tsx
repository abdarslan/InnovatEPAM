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

describe('Global shell theme contract', () => {
  it('applies token-driven classes for shell surfaces and typography roles', () => {
    const { container } = render(
      <ProtectedShell role="submitter" displayName="Theme Contract User">
        <div>Theme Contract Content</div>
      </ProtectedShell>,
    )

    const shellRoot = container.firstElementChild
    expect(shellRoot).toHaveClass('bg-[var(--color-shell-surface)]')

    const topbar = screen.getByRole('banner')
    expect(topbar).toHaveClass('bg-[var(--color-shell-topbar)]')
    expect(topbar).toHaveClass('[font-family:var(--font-shell-body)]')

    const nav = screen.getByRole('navigation', { name: /primary/i })
    const sidebar = nav.closest('aside')
    expect(sidebar).toHaveClass('bg-[var(--color-shell-sidebar)]')

    const brandText = screen.getByText('InnovatEPAM')
    expect(brandText).toHaveClass('[font-family:var(--font-shell-headline)]')

    const menuButton = screen.getByRole('button', { name: /open navigation|menu/i })
    expect(menuButton).toHaveClass('focus-visible:ring-[var(--color-shell-focus)]')
  })
})