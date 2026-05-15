import type { SessionData } from '@/lib/auth/session'
import type { GlobalNavigationItem, TopBarPlaceholderContract } from '@/lib/navigation/types'

export const GLOBAL_NAV_ITEMS: GlobalNavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['submitter'],
  },
  {
    id: 'ideas',
    label: 'Ideas',
    href: '/ideas',
    roles: ['submitter', 'admin'],
  },
  {
    id: 'admin-dashboard',
    label: 'Admin Dashboard',
    href: '/admin/dashboard',
    roles: ['admin'],
  },
  {
    id: 'admin-users',
    label: 'Users',
    href: '/admin/users',
    roles: ['admin'],
  },
  {
    id: 'admin-ideas',
    label: 'Idea Management',
    href: '/admin/ideas',
    roles: ['admin'],
  },
  {
    id: 'admin-field-rules',
    label: 'Field Rules',
    href: '/admin/idea-field-rules',
    roles: ['admin'],
  },
]

export const TOP_BAR_PLACEHOLDER: TopBarPlaceholderContract = {
  alignment: 'center',
  minWidthByBreakpoint: {
    mobile: '8rem',
    tablet: '10rem',
    desktop: '14rem',
  },
  isInteractive: false,
}

export function getAuthorizedNavigationItems(role: SessionData['role']): GlobalNavigationItem[] {
  return GLOBAL_NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
}
