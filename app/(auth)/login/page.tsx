import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'
import { Suspense } from 'react'

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
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[--color-text]">Sign In</h1>
        <p className="mt-1 text-sm text-[--color-text-muted]">
          Access your InnovatEPAM account
        </p>
      </div>
      {showExpired && <SessionExpiredBanner />}
      <LoginForm />
      <p className="text-center text-sm text-[--color-text-muted]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[--color-primary] hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <Suspense fallback={<div className="text-center text-sm text-[--color-text-muted]">Loading…</div>}>
      <LoginPageContent {...props} />
    </Suspense>
  )
}
