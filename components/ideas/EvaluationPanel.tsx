'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { DecisionType, EvaluationOutcome, EvaluationStage } from '@/actions/ideas'
import { decideIdeaStageAction } from '@/actions/ideas'
import { Button } from '@/components/ui/button'

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

export function EvaluationPanel({ ideaId, currentStage, currentOutcome, isTerminal, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<DecisionType | null>(null)
  const [comment, setComment]           = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)

  function handleDecision(decision: DecisionType) {
    setCommentError(null)

    if (!comment.trim()) {
      setCommentError('Decision comment is required.')
      return
    }

    startTransition(async () => {
      const result = await decideIdeaStageAction({
        ideaId,
        decision,
        comment: comment.trim(),
      })

      if (result.ok) {
        toast.success('Decision saved.')
        setActiveAction(null)
        setComment('')
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
      <div className="mt-2 space-y-2">
        <p className="text-sm text-muted-foreground">
          Current step: {STAGE_LABELS[currentStage]}
        </p>

        <div className="flex gap-2">
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
            className="space-y-2"
          >
            <div>
              <label htmlFor={`comment-${ideaId}`} className="block text-sm font-medium mb-1">
                Decision comment (required)
              </label>
              <textarea
                id={`comment-${ideaId}`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                placeholder="Explain this decision..."
              />
              {commentError && (
                <p role="alert" className="mt-1 text-sm text-destructive">
                  {commentError}
                </p>
              )}
            </div>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Saving…' : 'Confirm Decision'}
            </Button>
          </form>
        )}
      </div>
    )
  }

  return (
    <p className="mt-2 text-sm text-muted-foreground" aria-label="Evaluation complete">
      Evaluation complete at {STAGE_LABELS[currentStage]}.
    </p>
  )
}
