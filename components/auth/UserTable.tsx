'use client'

import { useState, useTransition } from 'react'
import { deactivateUserAction } from '@/actions/auth'
import type { User } from '@/lib/db/schema'

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
          className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700"
        >
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-[--color-border]">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-[--color-text-muted]">Email</th>
              <th className="px-4 py-3 text-left font-medium text-[--color-text-muted]">Display Name</th>
              <th className="px-4 py-3 text-left font-medium text-[--color-text-muted]">Role</th>
              <th className="px-4 py-3 text-left font-medium text-[--color-text-muted]">Status</th>
              <th className="px-4 py-3 text-left font-medium text-[--color-text-muted]">Created At</th>
              <th className="px-4 py-3 text-left font-medium text-[--color-text-muted]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--color-border] bg-white">
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
    <tr>
      <td className="px-4 py-3 text-[--color-text]">{user.email}</td>
      <td className="px-4 py-3 text-[--color-text]">{user.displayName}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            user.role === 'admin'
              ? 'bg-purple-50 text-purple-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            user.status === 'active'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {user.status}
        </span>
      </td>
      <td className="px-4 py-3 text-[--color-text-muted]">{createdAtFormatted}</td>
      <td className="px-4 py-3">
        {user.status === 'active' ? (
          <button
            onClick={() => onDeactivate(user.id)}
            disabled={isDisabled}
            className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Deactivate
          </button>
        ) : (
          <span className="text-xs text-[--color-text-muted]">Inactive</span>
        )}
      </td>
    </tr>
  )
}
