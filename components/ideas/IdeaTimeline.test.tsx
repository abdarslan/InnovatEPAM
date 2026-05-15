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

  it('keeps evaluator attribution visible for stage 2 evaluation entries', () => {
    const entries: IdeaTimelineEntry[] = [
      {
        sequence: 3,
        stage: 'stage_2_department_review',
        decisionType: 'approve_next',
        outcome: 'approved_to_next_stage',
        decidedAt: 1710000002000,
        decidedByUser: 'Review Admin',
      },
    ]

    render(<IdeaTimeline entries={entries} />)

    expect(screen.getByText(/action: approve to next stage/i)).toBeInTheDocument()
    expect(screen.getByText(/by: review admin/i)).toBeInTheDocument()
  })

  it('renders stage 3 feasibility rating details on timeline entry', () => {
    const entries: IdeaTimelineEntry[] = [
      {
        sequence: 4,
        stage: 'stage_3_feasibility',
        decisionType: 'approve_next',
        outcome: 'approved_to_next_stage',
        decidedAt: 1710000003000,
        ratingLabel: 'Feasibility',
        ratingScore: 4,
      },
    ]

    render(<IdeaTimeline entries={entries} />)

    expect(screen.getByText(/rating: feasibility 4\/5/i)).toBeInTheDocument()
  })

  it('renders stage 4 impact rating on final completion entry', () => {
    const entries: IdeaTimelineEntry[] = [
      {
        sequence: 5,
        stage: 'stage_4_final_executive_decision',
        decisionType: 'final_approve',
        outcome: 'final_approved',
        decidedAt: 1710000004000,
        ratingLabel: 'Impact',
        ratingScore: 5,
      },
    ]

    render(<IdeaTimeline entries={entries} />)

    expect(screen.getByText(/rating: impact 5\/5/i)).toBeInTheDocument()
    expect(screen.getByText(/outcome: final approved/i)).toBeInTheDocument()
  })

  it('renders stage 1 submission without any rating details', () => {
    const entries: IdeaTimelineEntry[] = [
      {
        sequence: 1,
        stage: 'stage_1_triage',
        decisionType: 'submitted',
        outcome: 'in_progress',
        decidedAt: 1710000000001,
      },
    ]

    render(<IdeaTimeline entries={entries} />)

    expect(screen.queryByText(/rating:/i)).not.toBeInTheDocument()
  })

  it('renders rating details for stage 2, 3, and 4 entries', () => {
    const entries: IdeaTimelineEntry[] = [
      {
        sequence: 2,
        stage: 'stage_2_department_review',
        decisionType: 'approve_next',
        outcome: 'approved_to_next_stage',
        decidedAt: 1710000001000,
        ratingLabel: 'Alignment',
        ratingScore: 3,
      },
      {
        sequence: 3,
        stage: 'stage_3_feasibility',
        decisionType: 'approve_next',
        outcome: 'approved_to_next_stage',
        decidedAt: 1710000002000,
        ratingLabel: 'Feasibility',
        ratingScore: 4,
      },
      {
        sequence: 4,
        stage: 'stage_4_final_executive_decision',
        decisionType: 'final_approve',
        outcome: 'final_approved',
        decidedAt: 1710000003000,
        ratingLabel: 'Impact',
        ratingScore: 5,
      },
    ]

    render(<IdeaTimeline entries={entries} />)

    expect(screen.getByText(/rating: alignment 3\/5/i)).toBeInTheDocument()
    expect(screen.getByText(/rating: feasibility 4\/5/i)).toBeInTheDocument()
    expect(screen.getByText(/rating: impact 5\/5/i)).toBeInTheDocument()
  })
})
