'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { IdeaStatus } from '@/actions/ideas'
import { startReviewAction, evaluateIdeaAction } from '@/actions/ideas'
import { Button } from '@/components/ui/button'

type Props = {
  ideaId: number
  currentStatus: IdeaStatus
  onSuccess: () => void
}

export function EvaluationPanel({ ideaId, currentStatus, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<'accept' | 'reject' | null>(null)
  const [comment, setComment]           = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)

  function handleStartReview() {
    startTransition(async () => {
      const result = await startReviewAction(ideaId)
      if (result.ok) {
        toast.success('Review started.')
        onSuccess()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleEvaluate(status: 'accepted' | 'rejected') {
    setCommentError(null)
    const payload =
      status === 'accepted'
        ? { status: 'accepted' as const, ideaId, comment: comment || undefined }
        : { status: 'rejected' as const, ideaId, comment }

    if (status === 'rejected' && !comment.trim()) {
      setCommentError('Rejection reason is required.')
      return
    }

    startTransition(async () => {
      const result = await evaluateIdeaAction(payload)
      if (result.ok) {
        toast.success(`Idea ${status === 'accepted' ? 'accepted' : 'rejected'}.`)
        setActiveAction(null)
        setComment('')
        onSuccess()
      } else {
        toast.error(result.error)
      }
    })
  }

  if (currentStatus === 'submitted') {
    return (
      <div className="mt-2">
        <Button
          size="sm"
          onClick={handleStartReview}
          disabled={isPending}
          aria-label="Start review for this idea"
        >
          {isPending ? 'Starting…' : 'Start Review'}
        </Button>
      </div>
    )
  }

  if (currentStatus === 'under_review') {
    return (
      <div className="mt-2 space-y-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => { setActiveAction(activeAction === 'accept' ? null : 'accept'); setCommentError(null) }}
            disabled={isPending}
            aria-label="Accept this idea"
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => { setActiveAction(activeAction === 'reject' ? null : 'reject'); setCommentError(null) }}
            disabled={isPending}
            aria-label="Reject this idea"
          >
            Reject
          </Button>
        </div>

        {activeAction !== null && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleEvaluate(activeAction === 'accept' ? 'accepted' : 'rejected')
            }}
            className="space-y-2"
          >
            <div>
              <label htmlFor={`comment-${ideaId}`} className="block text-sm font-medium mb-1">
                {activeAction === 'reject' ? 'Rejection reason (required)' : 'Comment (optional)'}
              </label>
              <textarea
                id={`comment-${ideaId}`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                placeholder={
                  activeAction === 'reject' ? 'Explain why this idea is rejected…' : 'Optional comment…'
                }
              />
              {commentError && (
                <p role="alert" className="mt-1 text-sm text-destructive">
                  {commentError}
                </p>
              )}
            </div>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending
                ? 'Saving…'
                : activeAction === 'accept'
                  ? 'Confirm Accept'
                  : 'Confirm Reject'}
            </Button>
          </form>
        )}
      </div>
    )
  }

  return (
    <p className="mt-2 text-sm text-muted-foreground" aria-label="Evaluation complete">
      Evaluation complete
    </p>
  )
}
