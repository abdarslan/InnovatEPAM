'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import IdeaForm from '@/components/ideas/IdeaForm'
import { submitIdeaAction } from '@/actions/ideas'
import { upsertIdeaDraftAction, getIdeaDraftDetailAction, type IdeaDraftDetail } from '@/actions/idea-drafts'
import Link from 'next/link'
import { PageSurface, StateSurface } from '@/components/layout'

export default function NewIdeaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftIdParam = searchParams.get('draftId')

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

  return (
    <PageSurface
      title="Submit a New Idea"
      description="Share your innovation idea with the team."
      actions={
        <Link
          href="/ideas"
          className="inline-flex items-center rounded-md border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-shell-text)] transition-colors hover:bg-[var(--color-shell-surface-muted)]"
        >
          ← Back to ideas
        </Link>
      }
    >

      {draftLoadError && (
        <StateSurface title="Could not load draft" description={draftLoadError} />
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
        onSuccess={() => {
          router.push('/ideas')
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
    </PageSurface>
  )
}
