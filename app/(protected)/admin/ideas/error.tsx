'use client'

type Props = {
  error: Error
  reset: () => void
}

export default function AdminIdeasError({ error, reset }: Props) {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="rounded bg-primary px-4 py-2 text-primary-foreground text-sm"
      >
        Try again
      </button>
    </main>
  )
}
