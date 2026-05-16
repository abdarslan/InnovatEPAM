import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import UserTable from '@/components/auth/UserTable'
import { PageSurface } from '@/components/layout'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session.userId || session.role !== 'admin') {
    redirect('/access-denied')
  }

  const allUsers = db.select().from(users).orderBy(asc(users.createdAt)).all()

  return (
    <PageSurface
      title="User Management"
      description={`${allUsers.length} user${allUsers.length !== 1 ? 's' : ''} total`}
    >
      <UserTable users={allUsers} />
    </PageSurface>
  )
}
