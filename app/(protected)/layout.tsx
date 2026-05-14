import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import LogoutButton from '@/components/auth/LogoutButton'
import Link from 'next/link'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session.userId) {
    redirect('/login?reason=session_expired')
  }

  const { displayName, role } = session

  return (
    <div className="min-h-screen bg-[--color-surface]">
      <nav className="border-b border-[--color-border] bg-white px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-[--color-primary]">InnovatEPAM</span>
            {role === 'admin' ? (
              <>
                <Link
                  href="/admin/dashboard"
                  className="text-sm text-[--color-text] hover:text-[--color-primary]"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className="text-sm text-[--color-text] hover:text-[--color-primary]"
                >
                  Users
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="text-sm text-[--color-text] hover:text-[--color-primary]"
              >
                Dashboard
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[--color-text-muted]">{displayName}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
