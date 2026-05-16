import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { IDEA_CATEGORIES } from '@/lib/db/schema'
import {
  deleteCategoryFieldRuleAction,
  getAdminCategoryFieldRulesAction,
  upsertCategoryFieldRuleAction,
} from '@/actions/idea-field-rules'
import { PageSurface } from '@/components/layout'

function toOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export default async function AdminIdeaFieldRulesPage() {
  const session = await getSession()
  if (!session.userId || session.role !== 'admin') {
    redirect('/access-denied')
  }

  async function createRuleAction(formData: FormData) {
    'use server'

    const category = formData.get('category') as typeof IDEA_CATEGORIES[number]
    const fieldKey = String(formData.get('fieldKey') ?? '').trim()
    const label = String(formData.get('label') ?? '').trim()
    const fieldType = String(formData.get('fieldType') ?? 'text') as 'text' | 'number' | 'date'
    const required = formData.get('required') === 'on'
    const sortOrder = Number(formData.get('sortOrder') ?? 0)

    const result = await upsertCategoryFieldRuleAction({
      category,
      fieldKey,
      label,
      fieldType,
      required,
      minValue: toOptionalNumber(formData.get('minValue')),
      maxValue: toOptionalNumber(formData.get('maxValue')),
      minLength: toOptionalNumber(formData.get('minLength')),
      maxLength: toOptionalNumber(formData.get('maxLength')),
      helpText: String(formData.get('helpText') ?? '').trim() || undefined,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      isActive: true,
    })

    if (!result.ok) {
      throw new Error(result.error)
    }

    revalidatePath('/admin/idea-field-rules')
  }

  async function disableRuleAction(formData: FormData) {
    'use server'
    const id = Number(formData.get('id'))
    const result = await deleteCategoryFieldRuleAction(id)
    if (!result.ok) {
      throw new Error(result.error)
    }
    revalidatePath('/admin/idea-field-rules')
  }

  const result = await getAdminCategoryFieldRulesAction()
  if (!result.ok) {
    throw new Error(result.error)
  }

  return (
    <PageSurface
      title="Category Field Rules"
      description="Manage dynamic category-specific fields for idea submissions."
    >

      <section className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--color-shell-text)]">Create Rule</h2>
        <form action={createRuleAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Category</span>
            <select name="category" required className="w-full rounded border border-[var(--color-shell-border)] px-2 py-1.5">
              {IDEA_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Field Key</span>
            <input name="fieldKey" required className="w-full rounded border border-[var(--color-shell-border)] px-2 py-1.5" />
          </label>
          <label className="space-y-1 text-sm">
            <span>Label</span>
            <input name="label" required className="w-full rounded border border-[var(--color-shell-border)] px-2 py-1.5" />
          </label>
          <label className="space-y-1 text-sm">
            <span>Field Type</span>
            <select name="fieldType" defaultValue="text" className="w-full rounded border border-[var(--color-shell-border)] px-2 py-1.5">
              <option value="text">text</option>
              <option value="number">number</option>
              <option value="date">date</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Sort Order</span>
            <input type="number" name="sortOrder" defaultValue={0} className="w-full rounded border border-[var(--color-shell-border)] px-2 py-1.5" />
          </label>
          <label className="space-y-1 text-sm">
            <span>Help Text</span>
            <input name="helpText" className="w-full rounded border border-[var(--color-shell-border)] px-2 py-1.5" />
          </label>
          <label className="space-y-1 text-sm">
            <span>Min Value</span>
            <input type="number" step="any" name="minValue" className="w-full rounded border border-[var(--color-shell-border)] px-2 py-1.5" />
          </label>
          <label className="space-y-1 text-sm">
            <span>Max Value</span>
            <input type="number" step="any" name="maxValue" className="w-full rounded border border-[var(--color-shell-border)] px-2 py-1.5" />
          </label>
          <label className="space-y-1 text-sm">
            <span>Min Length</span>
            <input type="number" name="minLength" className="w-full rounded border border-[var(--color-shell-border)] px-2 py-1.5" />
          </label>
          <label className="space-y-1 text-sm">
            <span>Max Length</span>
            <input type="number" name="maxLength" className="w-full rounded border border-[var(--color-shell-border)] px-2 py-1.5" />
          </label>
          <label className="col-span-full inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="required" />
            Required field
          </label>
          <div className="col-span-full">
            <button type="submit" className="rounded bg-[var(--color-shell-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]">
              Save Rule
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--color-shell-text)]">Existing Rules</h2>
        {result.data.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-shell-text-muted)]">No field rules created yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {result.data.map((rule) => (
              <li key={rule.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-shell-border)] p-3 text-sm">
                <div>
                  <p className="font-medium">{rule.category} · {rule.label}</p>
                  <p className="text-[var(--color-shell-text-muted)]">{rule.fieldKey} · {rule.fieldType} · required: {rule.required ? 'yes' : 'no'} · active: {rule.isActive ? 'yes' : 'no'}</p>
                </div>
                {rule.isActive && (
                  <form action={disableRuleAction}>
                    <input type="hidden" name="id" value={rule.id} />
                    <button type="submit" className="rounded border border-[var(--color-shell-border)] px-3 py-1.5 transition-colors hover:bg-[var(--color-shell-surface-muted)]">
                      Disable
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageSurface>
  )
}
