import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[--color-surface] px-4 py-12">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-[--color-primary]">InnovatEPAM Portal</h2>
      </div>
      <div className="w-full max-w-sm rounded-xl border border-[--color-border] bg-white p-8 shadow-sm">
        {children}
      </div>
      <nav className="mt-6 flex gap-4 text-sm text-[--color-text-muted]">
        <Link href="/login" className="hover:text-[--color-primary]">
          Sign In
        </Link>
        <Link href="/register" className="hover:text-[--color-primary]">
          Create Account
        </Link>
      </nav>
    </div>
  )
}
