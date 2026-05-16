import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageSurface } from '@/components/layout'

export default async function AdminDashboardPage() {
  const session = await getSession()
  if (!session.userId || session.role !== 'admin') {
    redirect('/access-denied')
  }

  return (
    <PageSurface title="Admin Dashboard" description={`Welcome, ${session.displayName}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-6 shadow-sm">
          <h2 className="font-semibold text-[var(--color-shell-text)]">User Management</h2>
          <p className="mt-1 text-sm text-[var(--color-shell-text-muted)]">
            Manage user accounts and permissions.
          </p>
          <Link
            href="/admin/users"
            className="mt-3 inline-block text-sm text-[var(--color-shell-primary)] transition-colors hover:underline"
          >
            View Users →
          </Link>
        </div>
        <div className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-6 shadow-sm">
          <h2 className="font-semibold text-[var(--color-shell-text)]">Idea Management</h2>
          <p className="mt-1 text-sm text-[var(--color-shell-text-muted)]">
            Review, evaluate, and manage submitted ideas.
          </p>
          <Link
            href="/admin/ideas"
            className="mt-3 inline-block text-sm text-[var(--color-shell-primary)] transition-colors hover:underline"
          >
            View Ideas →
          </Link>
        </div>
      </div>
    </PageSurface>
  )
}
