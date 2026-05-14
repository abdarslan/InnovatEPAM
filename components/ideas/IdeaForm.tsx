'use client'

import { useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IDEA_CATEGORIES, type IdeaCategory } from '@/lib/db/schema'
import { submitIdeaSchema, type SubmitIdeaInput } from '@/lib/ideas/validation'
import type { ActionResult } from '@/actions/ideas'

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
}

export default function IdeaForm({
  action,
  defaultValues,
  onSuccess,
  submitLabel = 'Submit Idea',
}: IdeaFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmitIdeaInput>({
    resolver: zodResolver(submitIdeaSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      category: defaultValues?.category,
    },
  })

  function onSubmit(data: SubmitIdeaInput) {
    setServerError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('title', data.title)
      formData.set('description', data.description)
      formData.set('category', data.category)
      const file = fileInputRef.current?.files?.[0]
      if (file) formData.set('attachment', file)

      const result = await action(formData)
      if (!result.ok) {
        setServerError(result.error)
        return
      }
      reset()
      setSelectedFileName(null)
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

      {/* File attachment */}
      <div className="space-y-1">
        <label htmlFor="attachment" className="block text-sm font-medium text-[--color-text]">
          Attachment{' '}
          <span className="text-xs font-normal text-[--color-text-muted]">
            (optional — PDF, DOCX, PNG, JPG, max 5 MB)
          </span>
        </label>
        <input
          id="attachment"
          type="file"
          accept=".pdf,.docx,.png,.jpg,.jpeg"
          ref={fileInputRef}
          aria-describedby="attachment-hint"
          onChange={(e) => {
            const file = e.target.files?.[0]
            setSelectedFileName(file ? file.name : null)
          }}
          className="block w-full text-sm text-[--color-text-muted] file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:cursor-pointer"
        />
        <p id="attachment-hint" className="text-xs text-[--color-text-muted]">
          {selectedFileName ? `Selected: ${selectedFileName}` : 'No file selected.'}
        </p>
        {errors.attachment && (
          <p role="alert" className="text-xs text-red-600">
            {errors.attachment.message as string}
          </p>
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
