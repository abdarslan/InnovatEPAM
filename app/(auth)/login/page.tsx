import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'
import { Suspense } from 'react'
import { PageSurface } from '@/components/layout'

interface LoginPageProps {
  searchParams: Promise<{ reason?: string; returnUrl?: string }>
}

function SessionExpiredBanner() {
  return (
    <div
      role="status"
      className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700"
    >
      Your session has expired. Please sign in again.
    </div>
  )
}

async function LoginPageContent({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const session = await getSession()

  if (session.userId) {
    const dest = session.role === 'admin' ? '/admin/dashboard' : '/dashboard'
    redirect(dest)
  }

  const showExpired = params.reason === 'session_expired'

  return (
    <PageSurface title="Sign In" description="Access your InnovatEPAM account">
      {showExpired && <SessionExpiredBanner />}
      <LoginForm />
      <p className="text-center text-sm text-[var(--color-shell-text-muted)]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[var(--color-shell-primary)] hover:underline">
          Register
        </Link>
      </p>
    </PageSurface>
  )
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <Suspense fallback={<div className="text-center text-sm text-[--color-text-muted]">Loading…</div>}>
      <LoginPageContent {...props} />
    </Suspense>
  )
}
