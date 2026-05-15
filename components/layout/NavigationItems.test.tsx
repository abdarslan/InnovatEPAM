import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NavigationItems from '@/components/layout/NavigationItems'

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard',
}))

describe('NavigationItems', () => {
  it('marks matching route with aria-current="page"', () => {
    render(
      <NavigationItems
        items={[
          { id: 'admin-dashboard', label: 'Admin Dashboard', href: '/admin/dashboard' },
          { id: 'ideas', label: 'Ideas', href: '/ideas' },
        ]}
      />,
    )

    expect(screen.getByRole('link', { name: /admin dashboard/i })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: /ideas/i })).not.toHaveAttribute('aria-current')
  })
})
