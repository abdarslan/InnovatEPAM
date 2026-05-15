import type { IdeaTimelineEntry } from '@/actions/ideas'

type Props = {
  entries: IdeaTimelineEntry[]
}

const STAGE_LABELS: Record<IdeaTimelineEntry['stage'], string> = {
  stage_1_triage: 'Stage 1 Triage',
  stage_2_department_review: 'Stage 2 Department Review',
  stage_3_feasibility: 'Stage 3 Feasibility',
  stage_4_final_executive_decision: 'Stage 4 Final Executive Decision',
}

const OUTCOME_LABELS: Record<IdeaTimelineEntry['outcome'], string> = {
  in_progress: 'In Progress',
  approved_to_next_stage: 'Approved to Next Stage',
  rejected: 'Rejected',
  final_approved: 'Final Approved',
  final_rejected: 'Final Rejected',
}

const ACTION_LABELS: Record<IdeaTimelineEntry['decisionType'], string> = {
  submitted: 'Submission',
  approve_next: 'Approve to Next Stage',
  reject: 'Reject',
  final_approve: 'Final Approve',
  final_reject: 'Final Reject',
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString()
}

function formatRating(entry: IdeaTimelineEntry) {
  if (!entry.ratingLabel || entry.ratingScore === undefined) return null
  return `${entry.ratingLabel} ${entry.ratingScore}/5`
}

export function IdeaTimeline({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded border border-border bg-muted/40 p-3 text-sm">
        <p className="text-muted-foreground">No timeline entries yet.</p>
      </div>
    )
  }

  return (
    <section aria-label="Idea timeline" className="rounded border border-border bg-muted/40 p-3 space-y-3">
      <p className="text-sm font-medium">Timeline</p>

      <ol className="space-y-3">
        {entries.map((entry) => {
          const ratingText = formatRating(entry)
          return (
          <li key={entry.sequence} className="rounded border border-border bg-background p-3 text-sm space-y-1">
            <p className="font-medium">
              {entry.sequence}. {STAGE_LABELS[entry.stage]}
            </p>
            <p className="text-muted-foreground">Action: {ACTION_LABELS[entry.decisionType]}</p>
            <p className="text-muted-foreground">Outcome: {OUTCOME_LABELS[entry.outcome]}</p>
            {ratingText && <p className="text-muted-foreground">Rating: {ratingText}</p>}
            <p className="text-muted-foreground">At: {formatDateTime(entry.decidedAt)}</p>
            {entry.decidedByUser && <p className="text-muted-foreground">By: {entry.decidedByUser}</p>}
            {entry.comment && <p className="text-foreground">Comment: {entry.comment}</p>}
          </li>
          )
        })}
      </ol>
    </section>
  )
}
