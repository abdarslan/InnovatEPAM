import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppSidebar from '@/components/layout/AppSidebar'
import type { GlobalNavigationItem } from '@/lib/navigation/types'

vi.mock('next/navigation', () => ({
  usePathname: () => '/ideas',
}))

const items: GlobalNavigationItem[] = [
  { id: 'ideas', label: 'Ideas', href: '/ideas' },
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
]

describe('AppSidebar', () => {
  it('renders only items passed to it (authorized-only input contract)', () => {
    render(
      <AppSidebar
        mode="desktopFixedSidebar"
        items={[items[0]]}
        isOpen={false}
        onClose={() => {}}
        toggleButtonId="global-nav-toggle"
      />,
    )

    expect(screen.getByRole('link', { name: /ideas/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument()
  })
})
