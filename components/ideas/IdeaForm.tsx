'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IDEA_CATEGORIES, type IdeaCategory } from '@/lib/db/schema'
import {
  MAX_ATTACHMENTS_PER_IDEA,
  MAX_TOTAL_ATTACHMENT_SIZE_BYTES,
  isPreviewEligibleMimeType,
  submitIdeaSchema,
  type SubmitIdeaInput,
  validateAttachmentFiles,
} from '@/lib/ideas/validation'
import type { ActionResult, IdeaAttachmentMeta } from '@/actions/ideas'

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  process_improvement: 'Process Improvement',
  technology_innovation: 'Technology Innovation',
  customer_experience: 'Customer Experience',
  workplace_culture: 'Workplace Culture',
  cost_reduction: 'Cost Reduction',
}

type IdeaFormProps = {
  action: (formData: FormData) => Promise<ActionResult<{ id: number } | void>>
  defaultValues?: Partial<SubmitIdeaInput>
  onSuccess?: (id?: number) => void
  submitLabel?: string
  existingAttachments?: IdeaAttachmentMeta[]
}

type IdeaFormValues = Pick<SubmitIdeaInput, 'title' | 'description' | 'category'>

type PendingAttachment = {
  id: string
  file: File
  previewUrl: string | null
}

const ideaFormSchema = submitIdeaSchema.omit({ attachments: true })

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function createPendingAttachment(file: File, index: number): PendingAttachment {
  return {
    id: `${file.name}-${file.size}-${Date.now()}-${index}`,
    file,
    previewUrl: isPreviewEligibleMimeType(file.type) ? URL.createObjectURL(file) : null,
  }
}

function renderAttachmentPreview(name: string, mimeType: string, previewUrl: string | null) {
  if (!previewUrl) {
    return <p className="text-xs text-[--color-text-muted]">Preview not available for this file type.</p>
  }

  if (mimeType.startsWith('image/')) {
    return <img src={previewUrl} alt={name} className="max-h-32 rounded-md border border-[--color-border] object-cover" />
  }

  if (mimeType.startsWith('audio/')) {
    return <audio controls src={previewUrl} className="w-full" />
  }

  if (mimeType.startsWith('video/')) {
    return <video controls src={previewUrl} className="max-h-40 w-full rounded-md border border-[--color-border]" />
  }

  if (mimeType === 'application/pdf') {
    return <iframe src={previewUrl} title={name} className="h-40 w-full rounded-md border border-[--color-border]" />
  }

  return <p className="text-xs text-[--color-text-muted]">Preview not available for this file type.</p>
}

function getAttachmentError(
  pendingAttachments: PendingAttachment[],
  existingAttachments: IdeaAttachmentMeta[],
  removedAttachmentIds: number[],
) {
  const validation = validateAttachmentFiles(pendingAttachments.map((attachment) => attachment.file))
  if (!validation.success) {
    return validation.error.issues[0].message
  }

  const remainingExisting = existingAttachments.filter(
    (attachment) => !removedAttachmentIds.includes(attachment.id),
  )

  if (remainingExisting.length + pendingAttachments.length > MAX_ATTACHMENTS_PER_IDEA) {
    return 'You can upload up to 5 attachments.'
  }

  const totalBytes = remainingExisting.reduce((sum, attachment) => sum + attachment.sizeBytes, 0)
    + pendingAttachments.reduce((sum, attachment) => sum + attachment.file.size, 0)

  if (totalBytes > MAX_TOTAL_ATTACHMENT_SIZE_BYTES) {
    return 'Attachments must total 25 MB or less.'
  }

  return null
}

export default function IdeaForm({
  action,
  defaultValues,
  onSuccess,
  submitLabel = 'Submit Idea',
  existingAttachments = [],
}: IdeaFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<number[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      category: defaultValues?.category,
    },
  })

  useEffect(() => {
    return () => {
      for (const attachment of pendingAttachments) {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl)
        }
      }
    }
  }, [pendingAttachments])

  useEffect(() => {
    setAttachmentError(getAttachmentError(pendingAttachments, existingAttachments, removedAttachmentIds))
  }, [existingAttachments, pendingAttachments, removedAttachmentIds])

  function onSubmit(data: IdeaFormValues) {
    setServerError(null)
    const currentAttachmentError = getAttachmentError(pendingAttachments, existingAttachments, removedAttachmentIds)
    if (currentAttachmentError) {
      setAttachmentError(currentAttachmentError)
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('title', data.title)
      formData.set('description', data.description)
      formData.set('category', data.category)

      for (const attachment of pendingAttachments) {
        formData.append('attachments', attachment.file)
      }

      for (const attachmentId of removedAttachmentIds) {
        formData.append('removeAttachmentIds', String(attachmentId))
      }

      const result = await action(formData)
      if (!result.ok) {
        setServerError(result.error)
        return
      }

      for (const attachment of pendingAttachments) {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl)
        }
      }

      reset()
      setPendingAttachments([])
      setRemovedAttachmentIds([])
      setAttachmentError(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      const id = result.ok && 'data' in result && result.data && typeof result.data === 'object' && 'id' in result.data
        ? (result.data as { id: number }).id
        : undefined
      onSuccess?.(id)
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Server error */}
      {serverError && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm font-medium text-[--color-text]">
          Title <span aria-hidden="true">*</span>
        </label>
        <input
          id="title"
          type="text"
          autoComplete="off"
          aria-describedby={errors.title ? 'title-error' : undefined}
          aria-invalid={!!errors.title}
          className="w-full rounded-md border border-[--color-border] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          {...register('title')}
        />
        {errors.title && (
          <p id="title-error" role="alert" className="text-xs text-red-600">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium text-[--color-text]">
          Description <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="description"
          rows={5}
          aria-describedby={errors.description ? 'description-error' : undefined}
          aria-invalid={!!errors.description}
          className="w-full rounded-md border border-[--color-border] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          {...register('description')}
        />
        {errors.description && (
          <p id="description-error" role="alert" className="text-xs text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label htmlFor="category" className="block text-sm font-medium text-[--color-text]">
          Category <span aria-hidden="true">*</span>
        </label>
        <select
          id="category"
          aria-describedby={errors.category ? 'category-error' : undefined}
          aria-invalid={!!errors.category}
          className="w-full rounded-md border border-[--color-border] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
          {...register('category')}
        >
          <option value="">Select a category…</option>
          {IDEA_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
        {errors.category && (
          <p id="category-error" role="alert" className="text-xs text-red-600">
            {errors.category.message}
          </p>
        )}
      </div>

      {/* File attachments */}
      <div className="space-y-1">
        <label htmlFor="attachments" className="block text-sm font-medium text-[--color-text]">
          Attachments{' '}
          <span className="text-xs font-normal text-[--color-text-muted]">
            (optional — up to 5 files, 10 MB each, 25 MB total)
          </span>
        </label>
        <input
          id="attachments"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,image/*,audio/*,video/*"
          ref={fileInputRef}
          aria-describedby="attachment-hint"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length === 0) return

            setPendingAttachments((current) => [
              ...current,
              ...files.map((file, index) => createPendingAttachment(file, index)),
            ])

            e.target.value = ''
          }}
          className="block w-full text-sm text-[--color-text-muted] file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:cursor-pointer"
        />
        <p id="attachment-hint" className="text-xs text-[--color-text-muted]">
          Supported files include PDF, DOC, DOCX, PNG, JPG, GIF, MP3, WAV, WEBM, and MP4.
        </p>
        {attachmentError && (
          <p role="alert" className="text-xs text-red-600">
            {attachmentError}
          </p>
        )}

        {existingAttachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[--color-text-muted]">
              Existing attachments
            </p>
            {existingAttachments
              .filter((attachment) => !removedAttachmentIds.includes(attachment.id))
              .map((attachment) => (
                <div key={attachment.id} className="rounded-md border border-[--color-border] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[--color-text]">{attachment.originalName}</p>
                      <p className="text-xs text-[--color-text-muted]">
                        {attachment.mimeType} · {formatBytes(attachment.sizeBytes)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRemovedAttachmentIds((current) => [...current, attachment.id])}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {pendingAttachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[--color-text-muted]">
              Selected attachments
            </p>
            {pendingAttachments.map((attachment) => (
              <div key={attachment.id} className="rounded-md border border-[--color-border] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-[--color-text]">{attachment.file.name}</p>
                      <p className="text-xs text-[--color-text-muted]">
                        {attachment.file.type || 'application/octet-stream'} · {formatBytes(attachment.file.size)}
                      </p>
                    </div>
                    {renderAttachmentPreview(attachment.file.name, attachment.file.type, attachment.previewUrl)}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingAttachments((current) => current.filter((item) => item.id !== attachment.id))
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
