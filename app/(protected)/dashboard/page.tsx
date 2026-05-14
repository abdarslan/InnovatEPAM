import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { getMyIdeaDraftsAction } from '@/actions/idea-drafts'
import DraftList from '@/components/ideas/DraftList'
import Link from 'next/link'

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[--color-text]">Dashboard</h1>
        <p className="mt-1 text-sm text-[--color-text-muted]">
          Welcome back, {session.displayName}
        </p>
      </div>
      <div className="rounded-lg border border-[--color-border] bg-white p-6">
        <dl className="flex flex-col gap-3">
          <div className="flex gap-2">
            <dt className="text-sm font-medium text-[--color-text-muted]">Name:</dt>
            <dd className="text-sm text-[--color-text]">{session.displayName}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-sm font-medium text-[--color-text-muted]">Email:</dt>
            <dd className="text-sm text-[--color-text]">{session.email}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-sm font-medium text-[--color-text-muted]">Role:</dt>
            <dd className="text-sm">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
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
            <h2 id="drafts-heading" className="text-lg font-semibold text-[--color-text]">
              Your Drafts
            </h2>
            <Link
              href="/ideas/new"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
            >
              New Idea
            </Link>
          </div>
          {drafts === null || !drafts.ok ? (
            <p role="alert" className="text-sm text-red-600">
              {drafts?.error ?? 'Could not load drafts.'}
            </p>
          ) : (
            <DraftList drafts={drafts.data} />
          )}
        </section>
      )}
    </div>
  )
}
