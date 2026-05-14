import { NextRequest, NextResponse } from 'next/server'
import { unsealData } from 'iron-session'
import type { SessionData } from '@/lib/auth/session'

const SESSION_COOKIE = 'innovatepam_session'
const SESSION_PASSWORD = process.env.SESSION_SECRET ?? 'fallback-dev-secret-change-in-production-32chars'

async function getSessionFromRequest(request: NextRequest): Promise<Partial<SessionData>> {
  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value
  if (!cookieValue) return {}
  try {
    return await unsealData<Partial<SessionData>>(cookieValue, {
      password: SESSION_PASSWORD,
      ttl: 8 * 60 * 60,
    })
  } catch {
    return {}
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Parse session from the request cookies
  const session = await getSessionFromRequest(request)
  const isAuthenticated = Boolean(session.userId)
  const role = session.role

  // Auth routes: redirect authenticated users to their dashboard
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (isAuthenticated) {
      const dest = role === 'admin' ? '/admin/dashboard' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  // Protected routes: require authentication
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/access-denied') || pathname.startsWith('/ideas')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      loginUrl.searchParams.set('reason', 'session_expired')
      return NextResponse.redirect(loginUrl)
    }

    // Admin-only routes
    if (pathname.startsWith('/admin')) {
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/access-denied', request.url))
      }
    }

    // Submitter-only: /dashboard (admins should be at /admin/dashboard)
    if (pathname.startsWith('/dashboard')) {
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/access-denied', '/ideas/:path*', '/login', '/register'],
}
