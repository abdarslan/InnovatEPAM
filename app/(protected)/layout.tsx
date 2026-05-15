import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ProtectedShell } from '@/components/layout'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session.userId) {
    redirect('/login?reason=session_expired')
  }

  if (!session.role || !session.displayName) {
    redirect('/login?reason=session_expired')
  }

  const { displayName, role } = session

  return (
    <ProtectedShell role={role} displayName={displayName}>
      {children}
    </ProtectedShell>
  )
}
