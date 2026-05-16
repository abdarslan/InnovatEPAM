import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import RegisterForm from '@/components/auth/RegisterForm'
import Link from 'next/link'
import { PageSurface } from '@/components/layout'

export default async function RegisterPage() {
  const session = await getSession()
  if (session.userId) {
    const dest = session.role === 'admin' ? '/admin/dashboard' : '/dashboard'
    redirect(dest)
  }

  return (
    <PageSurface title="Create Account" description="Register with your EPAM email address">
      <RegisterForm />
      <p className="text-center text-sm text-[var(--color-shell-text-muted)]">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--color-shell-primary)] hover:underline">
          Sign in
        </Link>
      </p>
    </PageSurface>
  )
}
