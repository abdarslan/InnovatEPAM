import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getIdeasAction } from '@/actions/ideas'
import IdeaListClient from '@/components/ideas/IdeaListClient'

export default async function IdeasPage() {
  const session = await getSession()
  if (!session.userId) redirect('/login?reason=session_expired')

  const result = await getIdeasAction()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[--color-text]">Ideas</h1>
          <p className="mt-1 text-sm text-[--color-text-muted]">
            Innovation ideas submitted by the team.
          </p>
        </div>
        <Link
          href="/ideas/new"
          className="rounded-md bg-[--color-primary] px-4 py-2 text-sm font-medium text-white hover:bg-[--color-primary-dark]"
        >
          Submit an idea
        </Link>
      </div>

      {!result.ok ? (
        <div role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {result.error}
        </div>
      ) : (
        <IdeaListClient
          initialIdeas={result.data}
          currentUserId={session.userId}
          currentUserRole={session.role ?? 'submitter'}
        />
      )}
    </div>
  )
}
