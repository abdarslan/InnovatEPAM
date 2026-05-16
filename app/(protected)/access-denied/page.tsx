import { getSession } from '@/lib/auth/session'
import Link from 'next/link'
import { StateSurface } from '@/components/layout'

export default async function AccessDeniedPage() {
  const session = await getSession()
  const backHref = session.role === 'admin' ? '/admin/dashboard' : '/dashboard'

  return (
    <StateSurface title="Access denied" description="You do not have permission to access this page.">
      <div className="flex justify-center">
        <Link
          href={backHref}
          className="rounded-md bg-[var(--color-shell-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-shell-focus)]"
        >
          Back to Dashboard
        </Link>
      </div>
    </StateSurface>
  )
}
