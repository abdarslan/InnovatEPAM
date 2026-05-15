import type { SessionData } from '@/lib/auth/session'
import type { GlobalNavigationItem } from '@/lib/navigation/types'

export function isNavigationItemAuthorized(
  item: GlobalNavigationItem,
  role: SessionData['role'],
): boolean {
  return !item.roles || item.roles.includes(role)
}

export function filterNavigationItemsByRole(
  items: GlobalNavigationItem[],
  role: SessionData['role'],
): GlobalNavigationItem[] {
  return items.filter((item) => isNavigationItemAuthorized(item, role))
}
