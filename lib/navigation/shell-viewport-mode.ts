import type { ShellViewportMode } from '@/lib/navigation/types'

export const SHELL_BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
} as const

export function getShellViewportMode(viewportWidth: number): ShellViewportMode {
  if (viewportWidth >= SHELL_BREAKPOINTS.desktop) {
    return 'desktopFixedSidebar'
  }

  if (viewportWidth >= SHELL_BREAKPOINTS.tablet) {
    return 'tabletOffCanvas'
  }

  return 'mobileOffCanvas'
}
