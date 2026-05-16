import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getIdeasAction } from '@/actions/ideas'
import IdeaListClient from '@/components/ideas/IdeaListClient'
import { PageSurface, StateSurface } from '@/components/layout'

export default async function IdeasPage() {
  const session = await getSession()
  if (!session.userId) redirect('/login?reason=session_expired')

  const result = await getIdeasAction()

  return (
    <PageSurface
      title="Ideas"
      description="Innovation ideas submitted by the team."
      actions={
        <Link
          href="/ideas/new"
          className="rounded-md bg-[var(--color-shell-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          Submit an idea
        </Link>
      }
    >

      {!result.ok ? (
        <StateSurface title="Could not load ideas" description={result.error} />
      ) : (
        <IdeaListClient
          initialIdeas={result.data}
          currentUserId={session.userId}
          currentUserRole={session.role ?? 'submitter'}
        />
      )}
    </PageSurface>
  )
}
