'use client'

import type { GlobalNavigationItem, ShellViewportMode } from '@/lib/navigation/types'
import { useOffCanvasNavigation } from '@/components/layout/useOffCanvasNavigation'
import BrandHeader from '@/components/layout/BrandHeader'
import NavigationItems from '@/components/layout/NavigationItems'

type AppSidebarProps = {
  mode: ShellViewportMode
  items: GlobalNavigationItem[]
  isOpen: boolean
  onClose: () => void
  toggleButtonId: string
}

function SidebarContent({
  items,
  appName,
  logoSrc,
}: {
  items: GlobalNavigationItem[]
  appName: string
  logoSrc?: string | null
}) {
  return (
    <>
      <BrandHeader appName={appName} logoSrc={logoSrc} />
      <NavigationItems items={items} />
    </>
  )
}

export default function AppSidebar({ mode, items, isOpen, onClose, toggleButtonId }: AppSidebarProps) {
  const { panelRef } = useOffCanvasNavigation({
    isOpen,
    onClose,
    toggleButtonId,
  })

  if (mode === 'desktopFixedSidebar') {
    return (
      <aside className="hidden h-screen w-64 shrink-0 border-r border-[var(--color-shell-border)] bg-[var(--color-shell-sidebar)] [font-family:var(--font-shell-body)] lg:flex lg:flex-col">
        <SidebarContent items={items} appName="InnovatEPAM" />
      </aside>
    )
  }

  return (
    <>
      <div
        className={[
          'fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        className={[
          'fixed inset-y-0 left-0 z-50 w-72 border-r border-[var(--color-shell-border)] bg-[var(--color-shell-sidebar)] shadow-lg transition-transform duration-200 ease-out [font-family:var(--font-shell-body)] lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-hidden={!isOpen}
      >
        <SidebarContent items={items} appName="InnovatEPAM" />
      </aside>
    </>
  )
}
