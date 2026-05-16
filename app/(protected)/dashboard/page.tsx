import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { getMyIdeaDraftsAction } from '@/actions/idea-drafts'
import DraftList from '@/components/ideas/DraftList'
import Link from 'next/link'
import { PageSurface, StateSurface } from '@/components/layout'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session.userId) {
    redirect('/login?reason=session_expired')
  }

  // T027: Load drafts for submitter role only (admin guard is inside getMyIdeaDraftsAction)
  const isSubmitter = session.role === 'submitter'
  let drafts: Awaited<ReturnType<typeof getMyIdeaDraftsAction>> | null = null
  if (isSubmitter) {
    drafts = await getMyIdeaDraftsAction()
  }

  return (
    <PageSurface title="Dashboard" description={`Welcome back, ${session.displayName}`}>
      <div className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-6 shadow-sm">
        <dl className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <dt className="text-sm font-medium text-[var(--color-shell-text-muted)]">Name:</dt>
            <dd className="text-sm text-[var(--color-shell-text)]">{session.displayName}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-sm font-medium text-[var(--color-shell-text-muted)]">Email:</dt>
            <dd className="text-sm text-[var(--color-shell-text)]">{session.email}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-sm font-medium text-[var(--color-shell-text-muted)]">Role:</dt>
            <dd className="text-sm">
              <span className="inline-flex items-center rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-shell-primary)]">
                {session.role}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* T027: Draft list section — submitters only */}
      {isSubmitter && (
        <section aria-labelledby="drafts-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="drafts-heading" className="text-lg font-semibold text-[var(--color-shell-text)]">
              Your Drafts
            </h2>
            <Link
              href="/ideas/new"
              className="rounded-md bg-[var(--color-shell-primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
            >
              New Idea
            </Link>
          </div>
          {drafts === null || !drafts.ok ? (
            <StateSurface
              title="Could not load drafts"
              description={drafts?.error ?? 'Could not load drafts.'}
            />
          ) : (
            <DraftList drafts={drafts.data} />
          )}
        </section>
      )}
    </PageSurface>
  )
}
