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
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || 'U'

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
          <div className="inline-flex max-w-[16rem] items-center gap-2 rounded-full border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] px-2.5 py-1">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-shell-primary)]/15 text-xs font-semibold text-[var(--color-shell-primary)]"
              aria-hidden="true"
            >
              {avatarInitial}
            </span>
            <span className="truncate text-sm text-[var(--color-shell-text-muted)]">{displayName}</span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
