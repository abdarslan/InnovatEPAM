'use client'

import { useState, useTransition } from 'react'
import { deactivateUserAction } from '@/actions/auth'
import type { User } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'

interface Props {
  users: User[]
}

export default function UserTable({ users: initialUsers }: Props) {
  const [userList, setUserList] = useState(initialUsers)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDeactivate(userId: number) {
    setSuccessMessage(null)
    setErrorMessage(null)
    startTransition(async () => {
      const result = await deactivateUserAction(userId)
      if (!result.ok) {
        setErrorMessage(result.error)
        return
      }
      setSuccessMessage(`Account deactivated: ${result.data.deactivatedEmail}`)
      setUserList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'inactive' as const } : u))
      )
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {successMessage && (
        <div
          role="status"
          className="rounded-2xl border border-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_10%,white)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_10%,white)] px-4 py-3 text-sm text-[var(--color-danger)]"
        >
          {errorMessage}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-[var(--color-shell-surface-muted)]/80">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-shell-text-muted)]">Email</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-shell-text-muted)]">Display Name</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-shell-text-muted)]">Role</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-shell-text-muted)]">Status</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-shell-text-muted)]">Created</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-shell-text-muted)]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-shell-border)] bg-[var(--color-shell-surface)]">
            {userList.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onDeactivate={handleDeactivate}
                isDisabled={isPending}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { format } from 'date-fns'

function UserRow({
  user,
  onDeactivate,
  isDisabled,
}: {
  user: User
  onDeactivate: (id: number) => void
  isDisabled: boolean
}) {
  const createdAtFormatted = format(new Date(user.createdAt), 'dd MMM yyyy HH:mm')

  return (
    <tr className="transition-colors hover:bg-[var(--color-shell-surface-muted)]/70">
      <td className="px-4 py-3 text-[var(--color-shell-text)]">{user.email}</td>
      <td className="px-4 py-3 text-[var(--color-shell-text)]">{user.displayName}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
            user.role === 'admin'
              ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,white)] text-[var(--color-primary)]'
              : 'border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] text-[var(--color-shell-text)]'
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
            user.status === 'active'
              ? 'border-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_10%,white)] text-[var(--color-success)]'
              : 'border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_10%,white)] text-[var(--color-danger)]'
          }`}
        >
          {user.status}
        </span>
      </td>
      <td className="px-4 py-3 text-[var(--color-shell-text-muted)]">{createdAtFormatted}</td>
      <td className="px-4 py-3">
        {user.status === 'active' ? (
          <Button
            type="button"
            onClick={() => onDeactivate(user.id)}
            disabled={isDisabled}
            variant="destructive"
            size="sm"
            className="shrink-0"
          >
            Deactivate
          </Button>
        ) : (
          <span className="text-xs text-[var(--color-shell-text-muted)]">Inactive</span>
        )}
      </td>
    </tr>
  )
}
