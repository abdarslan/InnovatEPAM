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
      <div className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] p-4 text-sm">
        <p className="text-[var(--color-shell-text-muted)]">No timeline entries yet.</p>
      </div>
    )
  }

  return (
    <section aria-label="Idea timeline" className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-shell-text-muted)]">Timeline</p>

      <ol className="space-y-3">
        {entries.map((entry) => {
          const ratingText = formatRating(entry)
          return (
            <li key={entry.sequence} className="grid grid-cols-[auto,1fr] gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[var(--color-shell-primary)]" aria-hidden="true" />
              <div className="rounded-xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-3 text-sm space-y-1.5">
                <p className="font-medium text-[var(--color-shell-text)]">
                  {entry.sequence}. {STAGE_LABELS[entry.stage]}
                </p>
                <p className="text-[var(--color-shell-text-muted)]">Action: {ACTION_LABELS[entry.decisionType]}</p>
                <p className="text-[var(--color-shell-text-muted)]">Outcome: {OUTCOME_LABELS[entry.outcome]}</p>
                {ratingText && <p className="text-[var(--color-shell-text-muted)]">Rating: {ratingText}</p>}
                <p className="text-[var(--color-shell-text-muted)]">At: {formatDateTime(entry.decidedAt)}</p>
                {entry.decidedByUser && <p className="text-[var(--color-shell-text-muted)]">By: {entry.decidedByUser}</p>}
                {entry.comment && <p className="text-[var(--color-shell-text)]">Comment: {entry.comment}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
