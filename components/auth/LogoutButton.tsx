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
      className="rounded-md border border-[--color-border] px-3 py-1.5 text-sm text-[--color-text] hover:bg-[--color-surface] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
      aria-label="Log out"
    >
      {isPending ? 'Logging out…' : 'Logout'}
    </button>
  )
}
