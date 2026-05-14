import type { IdeaStatus } from '@/lib/db/schema'

const ALLOWED_TRANSITIONS: Record<IdeaStatus, IdeaStatus[]> = {
  submitted:    ['under_review'],
  under_review: ['accepted', 'rejected'],
  accepted:     [],
  rejected:     [],
}

export function validateTransition(from: IdeaStatus, to: IdeaStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}
