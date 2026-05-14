import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getAdminIdeasAction } from '@/actions/ideas'
import { AdminIdeaList } from '@/components/ideas/AdminIdeaList'
import { IDEA_STATUSES } from '@/lib/db/schema'
import type { IdeaStatus } from '@/actions/ideas'

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
    throw new Error(result.error)
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Idea Management</h1>
      <AdminIdeaList ideas={result.data} currentStatus={statusFilter} />
    </main>
  )
}
