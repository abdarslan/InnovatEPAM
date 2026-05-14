import { getIronSession, type IronSession, type SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  userId:      number
  email:       string
  role:        'submitter' | 'admin'
  displayName: string
}

const sessionOptions: SessionOptions = {
  cookieName: 'innovatepam_session',
  password: process.env.SESSION_SECRET ?? 'fallback-dev-secret-change-in-production-32chars',
  ttl: 8 * 60 * 60, // 8 hours in seconds
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}

export async function getSession(): Promise<IronSession<Partial<SessionData>>> {
  const cookieStore = await cookies()
  return getIronSession<Partial<SessionData>>(cookieStore, sessionOptions)
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession()
  if (!session.userId) {
    throw new Error('UNAUTHENTICATED')
  }
  return {
    userId: session.userId,
    email: session.email!,
    role: session.role!,
    displayName: session.displayName!,
  }
}

export async function requireRole(role: 'submitter' | 'admin'): Promise<SessionData> {
  const sessionData = await requireAuth()
  if (sessionData.role !== role) {
    throw new Error('FORBIDDEN')
  }
  return sessionData
}
