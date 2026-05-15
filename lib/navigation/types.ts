import type { SessionData } from '@/lib/auth/session'

export type ShellViewportMode = 'desktopFixedSidebar' | 'tabletOffCanvas' | 'mobileOffCanvas'

export interface GlobalNavigationItem {
  id: string
  label: string
  href: string
  iconKey?: string
  roles?: Array<SessionData['role']>
}

export interface TopBarPlaceholderContract {
  alignment: 'left' | 'center' | 'right'
  minWidthByBreakpoint: {
    mobile: string
    tablet: string
    desktop: string
  }
  isInteractive: false
}
