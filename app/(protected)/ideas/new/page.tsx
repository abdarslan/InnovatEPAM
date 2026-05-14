'use client'

import { useRouter } from 'next/navigation'
import IdeaForm from '@/components/ideas/IdeaForm'
import { submitIdeaAction } from '@/actions/ideas'
import Link from 'next/link'
import { useState } from 'react'

export default function NewIdeaPage() {
  const router = useRouter()
  const [successId, setSuccessId] = useState<number | null>(null)

  if (successId !== null) {
    return (
      <div className="space-y-4">
        <div
          role="status"
          aria-live="polite"
          className="rounded-md bg-green-50 p-4 text-sm text-green-800"
        >
          Your idea has been submitted successfully!
        </div>
        <div className="flex gap-4">
          <Link
            href="/ideas"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            View all ideas
          </Link>
          <button
            onClick={() => setSuccessId(null)}
            className="rounded-md border border-[--color-border] px-4 py-2 text-sm text-[--color-text] hover:bg-surface"
          >
            Submit another idea
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/ideas"
          className="text-sm text-[--color-text-muted] hover:text-[--color-primary]"
        >
          ← Back to ideas
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[--color-text]">Submit a New Idea</h1>
        <p className="mt-1 text-sm text-[--color-text-muted]">
          Share your innovation idea with the team.
        </p>
      </div>
      <IdeaForm
        action={submitIdeaAction}
        onSuccess={(id) => {
          if (id !== undefined) setSuccessId(id)
          else router.push('/ideas')
        }}
      />
    </div>
  )
}
