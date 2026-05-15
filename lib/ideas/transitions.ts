import type {
  IdeaDecisionType,
  IdeaEvaluationOutcome,
  IdeaEvaluationStage,
  IdeaStatus,
} from '@/lib/db/schema'

const ALLOWED_TRANSITIONS: Record<IdeaStatus, IdeaStatus[]> = {
  submitted:    ['under_review'],
  under_review: ['accepted', 'rejected'],
  accepted:     [],
  rejected:     [],
}

export function validateTransition(from: IdeaStatus, to: IdeaStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

type EvaluationState = {
  stage: IdeaEvaluationStage
  outcome: IdeaEvaluationOutcome
  isTerminal: boolean
}

type TransitionDecision = {
  nextStage: IdeaEvaluationStage
  nextOutcome: IdeaEvaluationOutcome
  isTerminal: boolean
}

const NEXT_STAGE_BY_STAGE: Record<IdeaEvaluationStage, IdeaEvaluationStage | null> = {
  stage_1_triage: 'stage_2_department_review',
  stage_2_department_review: 'stage_3_feasibility',
  stage_3_feasibility: 'stage_4_final_executive_decision',
  stage_4_final_executive_decision: null,
}

export function resolveStageDecision(
  state: EvaluationState,
  decision: Exclude<IdeaDecisionType, 'submitted'>,
): TransitionDecision | null {
  if (state.isTerminal || state.outcome !== 'in_progress') {
    return null
  }

  if (state.stage === 'stage_4_final_executive_decision') {
    if (decision === 'final_approve') {
      return {
        nextStage: state.stage,
        nextOutcome: 'final_approved',
        isTerminal: true,
      }
    }
    if (decision === 'final_reject') {
      return {
        nextStage: state.stage,
        nextOutcome: 'final_rejected',
        isTerminal: true,
      }
    }
    return null
  }

  if (decision === 'approve_next') {
    const nextStage = NEXT_STAGE_BY_STAGE[state.stage]
    if (!nextStage) return null
    return {
      nextStage,
      nextOutcome: 'in_progress',
      isTerminal: false,
    }
  }

  if (decision === 'reject') {
    return {
      nextStage: state.stage,
      nextOutcome: 'rejected',
      isTerminal: true,
    }
  }

  return null
}
