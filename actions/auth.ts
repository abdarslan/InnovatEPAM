'use server'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { getSession, requireRole } from '@/lib/auth/session'
import { registerSchema, loginSchema } from '@/lib/auth/validation'
import { eq } from 'drizzle-orm'
import { formatDistanceToNow } from 'date-fns'

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ---------------------------------------------------------------------------
// registerAction
// ---------------------------------------------------------------------------
export async function registerAction(
  input: unknown
): Promise<ActionResult<{ userId: number }>> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { ok: false, error: firstError?.message ?? 'Invalid input.' }
  }

  const { email, password, displayName } = parsed.data
  const normalizedEmail = email.toLowerCase()

  try {
    const existing = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .get()

    if (existing) {
      return { ok: false, error: 'An account with this email address already exists.' }
    }

    const passwordHash = await hashPassword(password)
    const now = Date.now()

    const result = db
      .insert(users)
      .values({
        email: normalizedEmail,
        displayName,
        passwordHash,
        role: 'submitter',
        status: 'active',
        failedAttempts: 0,
        lockedUntil: null,
        createdAt: now,
      })
      .returning({ id: users.id })
      .get()

    if (!result) {
      return { ok: false, error: 'Registration failed. Please try again.' }
    }

    // Create session
    const session = await getSession()
    session.userId = result.id
    session.email = normalizedEmail
    session.role = 'submitter'
    session.displayName = displayName
    await session.save()

    return { ok: true, data: { userId: result.id } }
  } catch {
    return { ok: false, error: 'Registration failed. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// loginAction
// ---------------------------------------------------------------------------
export async function loginAction(
  input: unknown
): Promise<ActionResult<{ role: 'submitter' | 'admin' }>> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid email or password.' }
  }

  const { email, password } = parsed.data
  const normalizedEmail = email.toLowerCase()

  try {
    const user = db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .get()

    // Check lockout first (before revealing whether account exists)
    if (user && user.lockedUntil !== null && user.lockedUntil > Date.now()) {
      const remainingTime = formatDistanceToNow(new Date(user.lockedUntil), {
        addSuffix: true,
      })
      return {
        ok: false,
        error: `Your account is locked. Please try again ${remainingTime}.`,
      }
    }

    // Check inactive status
    if (user && user.status === 'inactive') {
      return {
        ok: false,
        error: 'Your account has been deactivated. Please contact your administrator.',
      }
    }

    // Generic invalid credentials — same message for "not found" and "wrong password"
    if (!user) {
      return { ok: false, error: 'Invalid email or password.' }
    }

    const passwordValid = await verifyPassword(password, user.passwordHash)

    if (!passwordValid) {
      const newAttempts = user.failedAttempts + 1
      const lockedUntil = newAttempts >= 5 ? Date.now() + 15 * 60 * 1000 : null

      db.update(users)
        .set({
          failedAttempts: newAttempts,
          lockedUntil,
        })
        .where(eq(users.id, user.id))
        .run()

      if (lockedUntil !== null) {
        const remainingTime = formatDistanceToNow(new Date(lockedUntil), {
          addSuffix: true,
        })
        return {
          ok: false,
          error: `Your account is locked. Please try again ${remainingTime}.`,
        }
      }

      return { ok: false, error: 'Invalid email or password.' }
    }

    // Successful login — reset failed attempts
    db.update(users)
      .set({ failedAttempts: 0, lockedUntil: null })
      .where(eq(users.id, user.id))
      .run()

    const session = await getSession()
    session.userId = user.id
    session.email = user.email
    session.role = user.role
    session.displayName = user.displayName
    await session.save()

    return { ok: true, data: { role: user.role } }
  } catch {
    return { ok: false, error: 'Login failed. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// logoutAction
// ---------------------------------------------------------------------------
export async function logoutAction(): Promise<ActionResult> {
  try {
    const session = await getSession()
    session.destroy()
    return { ok: true, data: undefined }
  } catch {
    return { ok: true, data: undefined }
  }
}

// ---------------------------------------------------------------------------
// deactivateUserAction
// ---------------------------------------------------------------------------
export async function deactivateUserAction(
  targetUserId: number
): Promise<ActionResult<{ deactivatedEmail: string }>> {
  try {
    await requireRole('admin')
  } catch {
    return { ok: false, error: 'Forbidden.' }
  }

  try {
    const target = db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .get()

    if (!target) {
      return { ok: false, error: 'User not found.' }
    }

    if (target.status === 'inactive') {
      return { ok: false, error: 'User is already deactivated.' }
    }

    db.update(users)
      .set({ status: 'inactive' })
      .where(eq(users.id, targetUserId))
      .run()

    return { ok: true, data: { deactivatedEmail: target.email } }
  } catch {
    return { ok: false, error: 'Deactivation failed. Please try again.' }
  }
}
