import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="text-xl font-semibold text-[--color-text-muted]">Page Not Found</h2>
      <p className="text-[--color-text-muted]">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/login"
        className="rounded-md bg-[--color-primary] px-4 py-2 text-white hover:bg-[--color-primary-dark]"
      >
        Go to Login
      </Link>
    </div>
  )
}
