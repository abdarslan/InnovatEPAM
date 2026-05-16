'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import IdeaForm from '@/components/ideas/IdeaForm'
import { getIdeaDetailAction, updateIdeaAction } from '@/actions/ideas'
import type { IdeaDetail } from '@/actions/ideas'
import Link from 'next/link'
import { PageSurface, StateSurface } from '@/components/layout'

type EditIdeaPageProps = {
  params: Promise<{ id: string }>
}

export default function EditIdeaPage({ params }: EditIdeaPageProps) {
  const router = useRouter()
  const [detail, setDetail] = useState<IdeaDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const { id: rawId } = await params
      const id = parseInt(rawId, 10)
      if (isNaN(id)) {
        router.replace('/ideas')
        return
      }
      const result = await getIdeaDetailAction(id)
      if (!result.ok) {
        setLoadError(result.error)
        return
      }
      setDetail(result.data)
    })
  }, [params, router])

  if (loadError) {
    return (
      <PageSurface
        title="Edit Idea"
        description="Update the idea details and attachments."
        actions={
          <Link href="/ideas" className="text-sm text-[var(--color-shell-text-muted)] transition-colors hover:text-[var(--color-shell-primary)]">
            ← Back to ideas
          </Link>
        }
      >
        <StateSurface title="Could not load idea" description={loadError} />
      </PageSurface>
    )
  }

  if (!detail) {
    return <StateSurface title="Loading idea" description="Preparing the idea editor." />
  }

  const boundAction = updateIdeaAction.bind(null, detail.id)

  return (
    <PageSurface
      title="Edit Idea"
      description="Update the idea details and attachments."
      actions={
        <Link href="/ideas" className="text-sm text-[var(--color-shell-text-muted)] transition-colors hover:text-[var(--color-shell-primary)]">
          ← Back to ideas
        </Link>
      }
    >
      <IdeaForm
        action={boundAction}
        defaultValues={{
          title: detail.title,
          description: detail.description,
          category: detail.category,
        }}
        existingAttachments={detail.attachments}
        onSuccess={() => router.push('/ideas')}
        submitLabel="Save changes"
      />
    </PageSurface>
  )
}
