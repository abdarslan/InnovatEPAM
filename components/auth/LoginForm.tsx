'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { loginAction } from '@/actions/auth'
import { loginSchema, type LoginInput } from '@/lib/auth/validation'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  function onSubmit(data: LoginInput) {
    setServerError(null)
    startTransition(async () => {
      const result = await loginAction(data)
      if (!result.ok) {
        setServerError(result.error)
        return
      }
      const returnUrl = searchParams.get('returnUrl')
      // Validate returnUrl to prevent open-redirect
      const dest =
        returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
          ? returnUrl
          : result.data.role === 'admin'
          ? '/admin/dashboard'
          : '/dashboard'

      router.push(dest)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {serverError && (
        <div
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="login-email" className="text-sm font-medium text-[--color-text]">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          aria-invalid={!!errors.email}
          className="rounded-md border border-[--color-border] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] disabled:opacity-50"
          disabled={isPending}
          {...register('email')}
        />
        {errors.email && (
          <p id="login-email-error" className="text-xs text-red-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="login-password" className="text-sm font-medium text-[--color-text]">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-describedby={errors.password ? 'login-password-error' : undefined}
          aria-invalid={!!errors.password}
          className="rounded-md border border-[--color-border] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] disabled:opacity-50"
          disabled={isPending}
          {...register('password')}
        />
        {errors.password && (
          <p id="login-password-error" className="text-xs text-red-600" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2 rounded-md bg-[--color-primary] px-4 py-2 text-sm font-medium text-white hover:bg-[--color-primary-dark] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              aria-hidden="true"
            />
            Signing in…
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  )
}
