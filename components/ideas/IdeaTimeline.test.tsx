import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IdeaTimeline } from './IdeaTimeline'
import type { IdeaTimelineEntry } from '@/actions/ideas'

describe('IdeaTimeline', () => {
  it('renders privileged fields when comment and deciding user are provided', () => {
    const entries: IdeaTimelineEntry[] = [
      {
        sequence: 1,
        stage: 'stage_1_triage',
        decisionType: 'submitted',
        outcome: 'approved_to_next_stage',
        decidedAt: 1710000000000,
        decidedByUser: 'Admin User',
        comment: 'Looks good to proceed.',
      },
    ]

    render(<IdeaTimeline entries={entries} />)

    expect(screen.getByText(/timeline/i)).toBeInTheDocument()
    expect(screen.getByText(/action: submission/i)).toBeInTheDocument()
    expect(screen.getByText(/by: admin user/i)).toBeInTheDocument()
    expect(screen.getByText(/comment: looks good to proceed\./i)).toBeInTheDocument()
  })

  it('hides privileged fields when they are omitted from entries', () => {
    const entries: IdeaTimelineEntry[] = [
      {
        sequence: 2,
        stage: 'stage_2_department_review',
        decisionType: 'approve_next',
        outcome: 'in_progress',
        decidedAt: 1710000001000,
      },
    ]

    render(<IdeaTimeline entries={entries} />)

    expect(screen.queryByText(/comment:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/by:/i)).not.toBeInTheDocument()
    expect(screen.getByText(/action: approve to next stage/i)).toBeInTheDocument()
    expect(screen.getByText(/outcome: in progress/i)).toBeInTheDocument()
  })
})
