import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getAdminIdeasAction } from '@/actions/ideas'
import { AdminIdeaList } from '@/components/ideas/AdminIdeaList'
import { IDEA_STATUSES } from '@/lib/db/schema'
import type { IdeaStatus } from '@/actions/ideas'
import { PageSurface, StateSurface } from '@/components/layout'

type PageProps = {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminIdeasPage({ searchParams }: PageProps) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    redirect('/access-denied')
  }

  const { status: rawStatus } = await searchParams
  const statusFilter: IdeaStatus | undefined =
    rawStatus && (IDEA_STATUSES as readonly string[]).includes(rawStatus)
      ? (rawStatus as IdeaStatus)
      : undefined

  const result = await getAdminIdeasAction(statusFilter)

  if (!result.ok) {
    return <StateSurface title="Could not load ideas" description={result.error} />
  }

  return (
    <PageSurface title="Idea Management" description="Review, evaluate, and manage submitted ideas.">
      <AdminIdeaList ideas={result.data} currentStatus={statusFilter} />
    </PageSurface>
  )
}
