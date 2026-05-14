'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import IdeaForm from '@/components/ideas/IdeaForm'
import { submitIdeaAction } from '@/actions/ideas'
import { upsertIdeaDraftAction, getIdeaDraftDetailAction, type IdeaDraftDetail } from '@/actions/idea-drafts'
import Link from 'next/link'

export default function NewIdeaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftIdParam = searchParams.get('draftId')

  const [successId, setSuccessId] = useState<number | null>(null)
  const [draftDetail, setDraftDetail] = useState<IdeaDraftDetail | null>(null)
  const [draftLoadError, setDraftLoadError] = useState<string | null>(null)

  // T021/T033: Load draft prefill data when ?draftId= is present
  useEffect(() => {
    if (!draftIdParam) return
    const id = parseInt(draftIdParam, 10)
    if (Number.isNaN(id)) return

    void (async () => {
      const result = await getIdeaDraftDetailAction(id)
      if (!result.ok) {
        setDraftLoadError('Could not load draft. It may have been deleted.')
        return
      }
      setDraftDetail(result.data)
    })()
  }, [draftIdParam])

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

      {draftLoadError && (
        <div role="alert" className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          {draftLoadError}
        </div>
      )}

      <IdeaForm
        action={async (formData) => {
          // T035: Pass draftId so submitIdeaAction can delete draft atomically
          if (draftDetail?.id !== undefined) {
            formData.set('draftId', String(draftDetail.id))
          }
          return submitIdeaAction(formData)
        }}
        draftAction={upsertIdeaDraftAction}
        draftDefaultValues={draftDetail ?? undefined}
        existingAttachments={draftDetail?.attachments}
        onSuccess={(id) => {
          if (id !== undefined) setSuccessId(id)
          else router.push('/ideas')
        }}
        onDraftSaved={(savedId) => {
          // Keep draftDetail.id in sync so the final submit can pass draftId
          setDraftDetail((prev) =>
            prev ? { ...prev, id: savedId } : { id: savedId, title: null, description: null, category: null, updatedAt: Date.now(), attachments: [], fieldValues: {} },
          )
          // Update URL without navigation so page refresh re-loads the correct draft
          const url = new URL(window.location.href)
          url.searchParams.set('draftId', String(savedId))
          window.history.replaceState(null, '', url.toString())
        }}
      />
    </div>
  )
}
