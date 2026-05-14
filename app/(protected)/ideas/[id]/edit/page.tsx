'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import IdeaForm from '@/components/ideas/IdeaForm'
import { getIdeaDetailAction, updateIdeaAction } from '@/actions/ideas'
import type { IdeaDetail } from '@/actions/ideas'
import Link from 'next/link'

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
      <div className="space-y-4">
        <div role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
        <Link href="/ideas" className="text-sm text-[--color-primary] hover:underline">
          ← Back to ideas
        </Link>
      </div>
    )
  }

  if (!detail) {
    return <p className="text-sm text-[--color-text-muted]">Loading…</p>
  }

  const boundAction = updateIdeaAction.bind(null, detail.id)

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/ideas" className="text-sm text-[--color-text-muted] hover:text-[--color-primary]">
          ← Back to ideas
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[--color-text]">Edit Idea</h1>
      </div>
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
    </div>
  )
}
