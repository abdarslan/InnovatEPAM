import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import UserTable from '@/components/auth/UserTable'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session.userId || session.role !== 'admin') {
    redirect('/access-denied')
  }

  const allUsers = db.select().from(users).orderBy(asc(users.createdAt)).all()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[--color-text]">User Management</h1>
        <p className="mt-1 text-sm text-[--color-text-muted]">
          {allUsers.length} user{allUsers.length !== 1 ? 's' : ''} total
        </p>
      </div>
      <UserTable users={allUsers} />
    </div>
  )
}
