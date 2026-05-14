import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import RegisterForm from '@/components/auth/RegisterForm'
import Link from 'next/link'

export default async function RegisterPage() {
  const session = await getSession()
  if (session.userId) {
    const dest = session.role === 'admin' ? '/admin/dashboard' : '/dashboard'
    redirect(dest)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[--color-text]">Create Account</h1>
        <p className="mt-1 text-sm text-[--color-text-muted]">
          Register with your EPAM email address
        </p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-[--color-text-muted]">
        Already have an account?{' '}
        <Link href="/login" className="text-[--color-primary] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
