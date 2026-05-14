import { getSession } from '@/lib/auth/session'
import Link from 'next/link'

export default async function AccessDeniedPage() {
  const session = await getSession()
  const backHref = session.role === 'admin' ? '/admin/dashboard' : '/dashboard'

  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div>
        <h1 className="text-3xl font-bold text-[--color-text]">Access denied</h1>
        <p className="mt-3 text-[--color-text-muted]">
          You do not have permission to access this page.
        </p>
      </div>
      <Link
        href={backHref}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
