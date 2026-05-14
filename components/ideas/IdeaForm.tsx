'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getCategoryFieldRulesAction, type CategoryFieldRule, type IdeaAttachmentMeta } from '@/actions/ideas'
import { IDEA_CATEGORIES, type IdeaCategory } from '@/lib/db/schema'
import { submitIdeaSchema, type SubmitIdeaFormValues } from '@/lib/ideas/validation'
import {
  MAX_ATTACHMENTS_PER_IDEA,
  MAX_TOTAL_ATTACHMENT_SIZE_BYTES,
  isPreviewEligibleMimeType,
  validateAttachmentFiles,
} from '@/lib/ideas/validation'
import type { ActionResult } from '@/actions/ideas'
import type { IdeaDraftDetail } from '@/actions/idea-drafts'

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  process_improvement: 'Process Improvement',
  technology_innovation: 'Technology Innovation',
  customer_experience: 'Customer Experience',
  workplace_culture: 'Workplace Culture',
  cost_reduction: 'Cost Reduction',
  event_plan: 'Event Plan',
}

type PendingAttachment = {
  id: string
  file: File
  previewUrl: string | null
}

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
  if (!previewUrl) return <p className="text-xs text-[--color-text-muted]">Preview not available for this file type.</p>
  if (mimeType.startsWith('image/')) return <img src={previewUrl} alt={name} className="max-h-32 rounded-md border border-[--color-border] object-cover" />
  if (mimeType.startsWith('audio/')) return <audio controls src={previewUrl} className="w-full" />
  if (mimeType.startsWith('video/')) return <video controls src={previewUrl} className="max-h-40 w-full rounded-md border border-[--color-border]" />
  if (mimeType === 'application/pdf') return <iframe src={previewUrl} title={name} className="h-40 w-full rounded-md border border-[--color-border]" />
  return <p className="text-xs text-[--color-text-muted]">Preview not available for this file type.</p>
}

function getAttachmentError(
  pendingAttachments: PendingAttachment[],
  existingAttachments: IdeaAttachmentMeta[],
  removedAttachmentIds: number[],
): string | null {
  const validation = validateAttachmentFiles(pendingAttachments.map((a) => a.file))
  if (!validation.success) return validation.error.issues[0].message
  const remaining = existingAttachments.filter((a) => !removedAttachmentIds.includes(a.id))
  if (remaining.length + pendingAttachments.length > MAX_ATTACHMENTS_PER_IDEA) return 'You can upload up to 5 attachments.'
  const totalBytes = remaining.reduce((s, a) => s + a.sizeBytes, 0) + pendingAttachments.reduce((s, a) => s + a.file.size, 0)
  if (totalBytes > MAX_TOTAL_ATTACHMENT_SIZE_BYTES) return 'Attachments must total 25 MB or less.'
  return null
}

type IdeaFormProps = {
  action: (formData: FormData) => Promise<ActionResult<{ id: number } | void>>
  draftAction?: (formData: FormData) => Promise<ActionResult<{ draftId: number }>>
  defaultValues?: Partial<SubmitIdeaFormValues>
  draftDefaultValues?: IdeaDraftDetail
  onSuccess?: (id?: number) => void
  onDraftSaved?: (draftId: number) => void
  submitLabel?: string
  existingAttachments?: IdeaAttachmentMeta[]
}

export default function IdeaForm({
  action,
  draftAction,
  defaultValues,
  draftDefaultValues,
  onSuccess,
  onDraftSaved,
  submitLabel = 'Submit Idea',
  existingAttachments = [],
}: IdeaFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isDraftPending, startDraftTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [draftSavedMessage, setDraftSavedMessage] = useState<string | null>(null)
  const [currentDraftId, setCurrentDraftId] = useState<number | undefined>(
    draftDefaultValues?.id,
  )
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<number[]>([])
  const [dynamicRules, setDynamicRules] = useState<CategoryFieldRule[]>([])
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>(
    draftDefaultValues?.fieldValues ?? {},
  )
  const [dynamicErrors, setDynamicErrors] = useState<Record<string, string>>({})
  const [dynamicRulesError, setDynamicRulesError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SubmitIdeaFormValues>({
    resolver: zodResolver(submitIdeaSchema),
    defaultValues: {
      title: draftDefaultValues?.title ?? defaultValues?.title ?? '',
      description: draftDefaultValues?.description ?? defaultValues?.description ?? '',
      category: (draftDefaultValues?.category as SubmitIdeaFormValues['category'] | undefined) ?? defaultValues?.category,
    },
  })

  const selectedCategory = watch('category')

  // Sync form fields + dynamic values when draft loads asynchronously (draftDefaultValues starts
  // as undefined on first render because the page fetches the draft after mount).
  useEffect(() => {
    if (!draftDefaultValues) return
    reset({
      title: draftDefaultValues.title ?? '',
      description: draftDefaultValues.description ?? '',
      category: (draftDefaultValues.category as SubmitIdeaFormValues['category'] | undefined) ?? undefined,
    })
    setDynamicValues(draftDefaultValues.fieldValues ?? {})
    setCurrentDraftId(draftDefaultValues.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftDefaultValues?.id])

  useEffect(() => {
    const category = selectedCategory as IdeaCategory | undefined
    if (!category) {
      setDynamicRules([])
      setDynamicValues({})
      setDynamicErrors({})
      setDynamicRulesError(null)
      return
    }

    let isMounted = true
    void (async () => {
      const result = await getCategoryFieldRulesAction(category)
      if (!isMounted) return
      if (!result.ok) {
        setDynamicRules([])
        setDynamicValues({})
        setDynamicErrors({})
        setDynamicRulesError(result.error)
        return
      }

      setDynamicRules(result.data)
      setDynamicRulesError(null)

      const validKeys = new Set(result.data.map((rule) => rule.fieldKey))
      setDynamicValues((prev) => {
        const next: Record<string, string> = {}
        for (const [key, value] of Object.entries(prev)) {
          if (validKeys.has(key)) next[key] = value
        }
        return next
      })

      setDynamicErrors((prev) => {
        const next: Record<string, string> = {}
        for (const [key, value] of Object.entries(prev)) {
          if (validKeys.has(key)) next[key] = value
        }
        return next
      })
    })()

    return () => {
      isMounted = false
    }
  }, [selectedCategory])

  const activeDynamicFieldKeys = useMemo(
    () => new Set(dynamicRules.map((rule) => rule.fieldKey)),
    [dynamicRules],
  )

  function validateDynamicFields() {
    const nextErrors: Record<string, string> = {}

    for (const rule of dynamicRules) {
      const rawValue = dynamicValues[rule.fieldKey] ?? ''
      const value = rawValue.trim()

      if (!value) {
        if (rule.required) nextErrors[rule.fieldKey] = `${rule.label} is required.`
        continue
      }

      if (rule.fieldType === 'number') {
        const parsed = Number(value)
        if (!Number.isFinite(parsed)) {
          nextErrors[rule.fieldKey] = `${rule.label} must be a valid number.`
          continue
        }
        if (rule.minValue !== null && parsed < rule.minValue) {
          nextErrors[rule.fieldKey] = `${rule.label} must be at least ${rule.minValue}.`
          continue
        }
        if (rule.maxValue !== null && parsed > rule.maxValue) {
          nextErrors[rule.fieldKey] = `${rule.label} must be ${rule.maxValue} or less.`
          continue
        }
      }

      if (rule.fieldType === 'date') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
          nextErrors[rule.fieldKey] = `${rule.label} must be a valid date (YYYY-MM-DD).`
          continue
        }
      }

      if (rule.fieldType === 'text') {
        if (rule.minLength !== null && value.length < rule.minLength) {
          nextErrors[rule.fieldKey] = `${rule.label} must be at least ${rule.minLength} characters.`
          continue
        }
        if (rule.maxLength !== null && value.length > rule.maxLength) {
          nextErrors[rule.fieldKey] = `${rule.label} must be ${rule.maxLength} characters or fewer.`
          continue
        }
      }
    }

    for (const [key, value] of Object.entries(dynamicValues)) {
      if (!activeDynamicFieldKeys.has(key) && value.trim().length > 0) {
        nextErrors[key] = 'This field is not valid for the selected category.'
      }
    }

    setDynamicErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  // T019/T020: Save Draft handler — relaxed validation, no required fields
  function onSaveDraft() {
    if (!draftAction) return
    setDraftError(null)
    setDraftSavedMessage(null)

    startDraftTransition(async () => {
      const formData = new FormData()
      if (currentDraftId !== undefined) formData.set('draftId', String(currentDraftId))

      const titleValue = (document.getElementById('title') as HTMLInputElement | null)?.value ?? ''
      const descriptionValue = (document.getElementById('description') as HTMLTextAreaElement | null)?.value ?? ''
      const categoryValue = (document.getElementById('category') as HTMLSelectElement | null)?.value ?? ''

      if (titleValue.trim()) formData.set('title', titleValue.trim())
      if (descriptionValue.trim()) formData.set('description', descriptionValue.trim())
      if (categoryValue) formData.set('category', categoryValue)

      for (const rule of dynamicRules) {
        const value = (dynamicValues[rule.fieldKey] ?? '').trim()
        if (value.length > 0) formData.set(`dynamic_${rule.fieldKey}`, value)
      }

      for (const attachment of pendingAttachments) formData.append('attachments', attachment.file)

      const result = await draftAction(formData)
      if (!result.ok) {
        setDraftError(result.error)
        return
      }

      setCurrentDraftId(result.data.draftId)
      setDraftSavedMessage('Draft saved.')
      onDraftSaved?.(result.data.draftId)

      // Clear the success message after 3 s
      setTimeout(() => setDraftSavedMessage(null), 3000)
    })
  }

  function onSubmit(data: SubmitIdeaFormValues) {
    setServerError(null)
    const currentAttachmentError = getAttachmentError(pendingAttachments, existingAttachments, removedAttachmentIds)
    if (currentAttachmentError) { setAttachmentError(currentAttachmentError); return }
    if (!validateDynamicFields()) return

    startTransition(async () => {
      const formData = new FormData()
      formData.set('title', data.title)
      formData.set('description', data.description)
      formData.set('category', data.category)

      for (const rule of dynamicRules) {
        const value = (dynamicValues[rule.fieldKey] ?? '').trim()
        if (value.length > 0) formData.set(`dynamic_${rule.fieldKey}`, value)
      }

      for (const attachment of pendingAttachments) formData.append('attachments', attachment.file)
      for (const attachmentId of removedAttachmentIds) formData.append('removeAttachmentIds', String(attachmentId))

      const result = await action(formData)
      if (!result.ok) { setServerError(result.error); return }

      for (const attachment of pendingAttachments) {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl)
      }
      reset()
      setDynamicValues({})
      setDynamicErrors({})
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

      {/* T020: Draft feedback */}
      {draftError && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {draftError}
        </div>
      )}
      {draftSavedMessage && (
        <p aria-live="polite" className="text-sm text-green-700">
          {draftSavedMessage}
        </p>
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
          <option value="">{'Select a category\u2026'}</option>
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

      {/* Dynamic category fields */}
      {dynamicRulesError && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {dynamicRulesError}
        </div>
      )}
      {dynamicRules.length > 0 && (
        <fieldset className="space-y-3 rounded-md border border-[--color-border] p-3" aria-live="polite">
          <legend className="px-1 text-sm font-medium text-[--color-text]">Category details</legend>
          {dynamicRules.map((rule) => {
            const fieldId = `dynamic_${rule.fieldKey}`
            const helpId = `${fieldId}-help`
            const errorId = `${fieldId}-error`
            const isError = Boolean(dynamicErrors[rule.fieldKey])
            const value = dynamicValues[rule.fieldKey] ?? ''
            const describedBy = [
              rule.helpText ? helpId : null,
              isError ? errorId : null,
            ].filter(Boolean).join(' ') || undefined

            return (
              <div key={rule.fieldKey} className="space-y-1">
                <label htmlFor={fieldId} className="block text-sm font-medium text-[--color-text]">
                  {rule.label} {rule.required ? <span aria-hidden="true">*</span> : null}
                </label>

                {rule.fieldType === 'text' ? (
                  <input
                    id={fieldId}
                    type="text"
                    value={value}
                    aria-invalid={isError}
                    aria-describedby={describedBy}
                    onChange={(event) => {
                      const next = event.target.value
                      setDynamicValues((prev) => ({ ...prev, [rule.fieldKey]: next }))
                    }}
                    className="w-full rounded-md border border-[--color-border] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                  />
                ) : (
                  <input
                    id={fieldId}
                    type={rule.fieldType === 'number' ? 'number' : 'date'}
                    value={value}
                    aria-invalid={isError}
                    aria-describedby={describedBy}
                    min={rule.fieldType === 'number' && rule.minValue !== null ? String(rule.minValue) : undefined}
                    max={rule.fieldType === 'number' && rule.maxValue !== null ? String(rule.maxValue) : undefined}
                    onChange={(event) => {
                      const next = event.target.value
                      setDynamicValues((prev) => ({ ...prev, [rule.fieldKey]: next }))
                    }}
                    className="w-full rounded-md border border-[--color-border] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                  />
                )}

                {rule.helpText && (
                  <p id={helpId} className="text-xs text-[--color-text-muted]">{rule.helpText}</p>
                )}
                {isError && (
                  <p id={errorId} role="alert" className="text-xs text-red-600">
                    {dynamicErrors[rule.fieldKey]}
                  </p>
                )}
              </div>
            )
          })}
        </fieldset>
      )}

      {/* File attachment */}
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
            const newAttachments = files.map((file, index) => createPendingAttachment(file, index))
            const remainingExisting = existingAttachments.filter((a) => !removedAttachmentIds.includes(a.id))
            const totalAfter = remainingExisting.length + pendingAttachments.length + newAttachments.length
            if (totalAfter > MAX_ATTACHMENTS_PER_IDEA) {
              setAttachmentError('You can upload up to 5 attachments.')
              e.target.value = ''
              return
            }
            setAttachmentError(null)
            setPendingAttachments((current) => [
              ...current,
              ...newAttachments,
            ])
            e.target.value = ''
          }}
          className="block w-full text-sm text-[--color-text-muted] file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:cursor-pointer"
        />
        <p id="attachment-hint" className="text-xs text-[--color-text-muted]">
          Supported: PDF, DOC, DOCX, PNG, JPG, GIF, MP3, WAV, WEBM, MP4.
        </p>
        {attachmentError && (
          <p role="alert" className="text-xs text-red-600">{attachmentError}</p>
        )}
        {existingAttachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[--color-text-muted]">Existing attachments</p>
            {existingAttachments
              .filter((a) => !removedAttachmentIds.includes(a.id))
              .map((a) => (
                <div key={a.id} className="rounded-md border border-[--color-border] p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[--color-text]">{a.originalName}</p>
                    <p className="text-xs text-[--color-text-muted]">{a.mimeType} · {formatBytes(a.sizeBytes)}</p>
                  </div>
                  <button type="button" onClick={() => setRemovedAttachmentIds((c) => [...c, a.id])} className="text-xs text-red-600 hover:underline">Remove</button>
                </div>
              ))}
          </div>
        )}
        {pendingAttachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[--color-text-muted]">Selected attachments</p>
            {pendingAttachments.map((a) => (
              <div key={a.id} className="rounded-md border border-[--color-border] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-[--color-text]">{a.file.name}</p>
                      <p className="text-xs text-[--color-text-muted]">{a.file.type || 'application/octet-stream'} · {formatBytes(a.file.size)}</p>
                    </div>
                    {renderAttachmentPreview(a.file.name, a.file.type, a.previewUrl)}
                  </div>
                  <button type="button" onClick={() => setPendingAttachments((c) => c.filter((item) => item.id !== a.id))} className="text-xs text-red-600 hover:underline">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending || isDraftPending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Saving\u2026' : submitLabel}
        </button>

        {/* T019: Save Draft button — only rendered when draftAction is provided */}
        {draftAction && (
          <button
            type="button"
            disabled={isPending || isDraftPending}
            onClick={onSaveDraft}
            aria-label="Save draft"
            className="rounded-md border border-[--color-border] px-5 py-2 text-sm font-medium text-[--color-text] hover:bg-[--color-surface] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDraftPending ? 'Saving draft\u2026' : 'Save Draft'}
          </button>
        )}
      </div>
    </form>
  )
}
