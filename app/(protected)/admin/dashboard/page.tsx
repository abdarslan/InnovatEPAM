import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function AdminDashboardPage() {
  const session = await getSession()
  if (!session.userId || session.role !== 'admin') {
    redirect('/access-denied')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[--color-text]">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-[--color-text-muted]">
          Welcome, {session.displayName}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[--color-border] bg-white p-6">
          <h2 className="font-semibold text-[--color-text]">User Management</h2>
          <p className="mt-1 text-sm text-[--color-text-muted]">
            Manage user accounts and permissions.
          </p>
          <a
            href="/admin/users"
            className="mt-3 inline-block text-sm text-[--color-primary] hover:underline"
          >
            View Users →
          </a>
        </div>
      </div>
    </div>
  )
}
