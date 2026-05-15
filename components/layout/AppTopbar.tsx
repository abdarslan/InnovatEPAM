'use client'

import LogoutButton from '@/components/auth/LogoutButton'
import SearchPlaceholder from '@/components/layout/SearchPlaceholder'

type AppTopbarProps = {
  displayName: string
  onToggleNavigation: () => void
  toggleButtonId: string
}

export default function AppTopbar({
  displayName,
  onToggleNavigation,
  toggleButtonId,
}: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-shell-border)] bg-[var(--color-shell-topbar)] px-4 py-3 [font-family:var(--font-shell-body)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id={toggleButtonId}
            type="button"
            onClick={onToggleNavigation}
            className="inline-flex items-center justify-center rounded-md border border-[var(--color-shell-border)] px-2.5 py-1.5 text-sm text-[var(--color-shell-text)] transition-colors hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-shell-focus)] lg:hidden"
            aria-label="Open navigation"
          >
            Menu
          </button>
          <SearchPlaceholder />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-shell-text-muted)]">{displayName}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
