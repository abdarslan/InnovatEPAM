'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { DecisionType, EvaluationOutcome, EvaluationStage } from '@/actions/ideas'
import { decideIdeaStageAction } from '@/actions/ideas'
import { Button } from '@/components/ui/button'
import { RatingControl } from '@/components/ideas/RatingControl'

type Props = {
  ideaId: number
  currentStage: EvaluationStage
  currentOutcome: EvaluationOutcome
  isTerminal: boolean
  onSuccess: () => void
}

const STAGE_LABELS: Record<EvaluationStage, string> = {
  stage_1_triage: 'Stage 1 Triage',
  stage_2_department_review: 'Stage 2 Department Review',
  stage_3_feasibility: 'Stage 3 Feasibility',
  stage_4_final_executive_decision: 'Stage 4 Final Executive Decision',
}

const STAGE_RATING_LABELS: Partial<Record<EvaluationStage, string>> = {
  stage_2_department_review: 'Alignment Rating',
  stage_3_feasibility: 'Feasibility Rating',
  stage_4_final_executive_decision: 'Impact Rating',
}

export function EvaluationPanel({ ideaId, currentStage, currentOutcome, isTerminal, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<DecisionType | null>(null)
  const [comment, setComment]           = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [ratingScore, setRatingScore] = useState<number | null>(null)
  const [ratingError, setRatingError] = useState<string | null>(null)

  function decisionRequiresRating(stage: EvaluationStage, decision: DecisionType) {
    if (stage === 'stage_2_department_review' || stage === 'stage_3_feasibility') {
      return decision === 'approve_next'
    }

    if (stage === 'stage_4_final_executive_decision') {
      return decision === 'final_approve' || decision === 'final_reject'
    }

    return false
  }

  function handleDecision(decision: DecisionType) {
    setCommentError(null)
    setRatingError(null)

    if (!comment.trim()) {
      setCommentError('Decision comment is required.')
      return
    }

    if (decisionRequiresRating(currentStage, decision) && ratingScore === null) {
      setRatingError('Please select a rating before confirming.')
      return
    }

    startTransition(async () => {
      const result = await decideIdeaStageAction({
        ideaId,
        decision,
        comment: comment.trim(),
        ratingScore: ratingScore ?? undefined,
      })

      if (result.ok) {
        toast.success('Decision saved.')
        setActiveAction(null)
        setComment('')
        setRatingScore(null)
        onSuccess()
      } else {
        toast.error(result.error)
      }
    })
  }

  const isFinalStage = currentStage === 'stage_4_final_executive_decision'

  const decisionOptions: Array<{ value: DecisionType; label: string; variant: 'default' | 'destructive' }> =
    isFinalStage
      ? [
        { value: 'final_approve', label: 'Final Approve', variant: 'default' },
        { value: 'final_reject', label: 'Final Reject', variant: 'destructive' },
      ]
      : [
        { value: 'approve_next', label: 'Approve to Next Stage', variant: 'default' },
        { value: 'reject', label: 'Reject', variant: 'destructive' },
      ]

  if (!isTerminal && currentOutcome === 'in_progress') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--color-shell-text-muted)]">
          Current step: {STAGE_LABELS[currentStage]}
        </p>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-2">
          {decisionOptions.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={option.variant}
              onClick={() => {
                setActiveAction(activeAction === option.value ? null : option.value)
                setCommentError(null)
              }}
              disabled={isPending}
              aria-label={option.label}
              className={
                option.variant === 'destructive'
                  ? 'min-w-[9rem] hover:bg-[var(--color-danger)]/85 hover:text-white'
                  : 'min-w-[9rem] hover:bg-[var(--color-primary)]/90 hover:text-white'
              }
            >
              {option.label}
            </Button>
          ))}
        </div>

        {activeAction !== null && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleDecision(activeAction)
            }}
            className="space-y-3 rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-4"
          >
            {STAGE_RATING_LABELS[currentStage] && (
              <div>
                <RatingControl
                  idPrefix={`rating-${ideaId}`}
                  label={STAGE_RATING_LABELS[currentStage] as string}
                  value={ratingScore}
                  disabled={isPending}
                  onChange={(value) => {
                    setRatingScore(value)
                    setRatingError(null)
                  }}
                />
                {ratingError && (
                  <p role="alert" className="mt-1 text-sm text-[var(--color-danger)]">
                    {ratingError}
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor={`comment-${ideaId}`} className="mb-1 block text-sm font-medium text-[var(--color-shell-text)]">
                Decision comment (required)
              </label>
              <textarea
                id={`comment-${ideaId}`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] px-3 py-2 text-sm text-[var(--color-shell-text)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-shell-focus)]"
                placeholder="Explain this decision..."
              />
              {commentError && (
                <p role="alert" className="mt-1 text-sm text-[var(--color-danger)]">
                  {commentError}
                </p>
              )}
            </div>
            <Button type="submit" size="sm" disabled={isPending} className="min-w-[8rem]">
              {isPending ? 'Saving…' : 'Confirm Decision'}
            </Button>
          </form>
        )}
      </div>
    )
  }

  return (
    <p className="text-sm text-[var(--color-shell-text-muted)]" aria-label="Evaluation complete">
      Evaluation complete at {STAGE_LABELS[currentStage]}.
    </p>
  )
}
