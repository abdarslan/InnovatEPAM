import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface-muted)] px-4 py-8 text-[var(--color-text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-shell-primary)]">
            InnovatEPAM Portal
          </h2>
          <p className="mt-2 text-sm text-[var(--color-shell-text-muted)]">
            Sign in to continue into the same shared product experience.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-6 shadow-sm sm:p-8">
          {children}
        </div>
        <nav className="mt-6 flex justify-center gap-4 text-sm text-[var(--color-shell-text-muted)]">
          <Link href="/login" className="transition-colors hover:text-[var(--color-shell-primary)]">
            Sign In
          </Link>
          <Link href="/register" className="transition-colors hover:text-[var(--color-shell-primary)]">
            Create Account
          </Link>
        </nav>
      </div>
    </div>
  )
}
