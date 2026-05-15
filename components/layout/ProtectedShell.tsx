'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SessionData } from '@/lib/auth/session'
import { GLOBAL_NAV_ITEMS } from '@/lib/navigation/global-nav'
import { getShellViewportMode } from '@/lib/navigation/shell-viewport-mode'
import { filterNavigationItemsByRole } from '@/lib/auth/navigation-permissions'
import AppSidebar from '@/components/layout/AppSidebar'
import AppTopbar from '@/components/layout/AppTopbar'
import type { ShellViewportMode } from '@/lib/navigation/types'

type ProtectedShellProps = {
  role: SessionData['role']
  displayName: string
  children: React.ReactNode
}

const NAV_TOGGLE_ID = 'global-nav-toggle'

export default function ProtectedShell({ role, displayName, children }: ProtectedShellProps) {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [mode, setMode] = useState<ShellViewportMode>(() => {
    if (typeof window === 'undefined') {
      return 'desktopFixedSidebar'
    }

    return getShellViewportMode(window.innerWidth)
  })

  useEffect(() => {
    function onResize() {
      const nextMode = getShellViewportMode(window.innerWidth)
      setMode(nextMode)
      if (nextMode === 'desktopFixedSidebar') {
        setIsNavOpen(false)
      }
    }

    onResize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const items = useMemo(() => filterNavigationItemsByRole(GLOBAL_NAV_ITEMS, role), [role])

  return (
    <div className="flex min-h-screen bg-[var(--color-shell-surface)]">
      <AppSidebar
        mode={mode}
        items={items}
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        toggleButtonId={NAV_TOGGLE_ID}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          displayName={displayName}
          onToggleNavigation={() => setIsNavOpen((current) => !current)}
          toggleButtonId={NAV_TOGGLE_ID}
        />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  )
}
