import '@testing-library/jest-dom'

export const TEST_EVALUATION_STAGES = [
	'stage_1_triage',
	'stage_2_department_review',
	'stage_3_feasibility',
	'stage_4_final_executive_decision',
] as const

export type TestEvaluationStage = (typeof TEST_EVALUATION_STAGES)[number]

export function buildStageRatingFixture(overrides?: {
	stage?: Exclude<TestEvaluationStage, 'stage_1_triage'>
	score?: number
	label?: 'Alignment' | 'Feasibility' | 'Impact'
}) {
	const stage = overrides?.stage ?? 'stage_2_department_review'
	const score = overrides?.score ?? 4
	const labelByStage: Record<Exclude<TestEvaluationStage, 'stage_1_triage'>, 'Alignment' | 'Feasibility' | 'Impact'> = {
		stage_2_department_review: 'Alignment',
		stage_3_feasibility: 'Feasibility',
		stage_4_final_executive_decision: 'Impact',
	}

	return {
		stage,
		score,
		label: overrides?.label ?? labelByStage[stage],
	}
}
