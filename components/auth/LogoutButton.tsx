'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { logoutAction } from '@/actions/auth'

export default function LogoutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logoutAction()
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex items-center rounded-md border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-shell-text)] transition-colors hover:bg-[var(--color-shell-surface-muted)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-shell-focus)]"
      aria-label="Logout"
    >
      {isPending ? 'Logging out…' : 'Logout'}
    </button>
  )
}
