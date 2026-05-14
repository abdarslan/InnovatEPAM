'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { registerAction } from '@/actions/auth'
import { registerSchema, type RegisterInput } from '@/lib/auth/validation'

export default function RegisterForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  function onSubmit(data: RegisterInput) {
    setServerError(null)
    startTransition(async () => {
      const result = await registerAction(data)
      if (!result.ok) {
        setServerError(result.error)
        return
      }
      router.push('/dashboard')
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
        <label htmlFor="email" className="text-sm font-medium text-[--color-text]">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-invalid={!!errors.email}
          className="rounded-md border border-[--color-border] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] disabled:opacity-50"
          disabled={isPending}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-red-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="displayName" className="text-sm font-medium text-[--color-text]">
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          autoComplete="name"
          aria-describedby={errors.displayName ? 'displayName-error' : undefined}
          aria-invalid={!!errors.displayName}
          className="rounded-md border border-[--color-border] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] disabled:opacity-50"
          disabled={isPending}
          {...register('displayName')}
        />
        {errors.displayName && (
          <p id="displayName-error" className="text-xs text-red-600" role="alert">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-[--color-text]">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-describedby={errors.password ? 'password-error' : undefined}
          aria-invalid={!!errors.password}
          className="rounded-md border border-[--color-border] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] disabled:opacity-50"
          disabled={isPending}
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" className="text-xs text-red-600" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              aria-hidden="true"
            />
            Registering…
          </>
        ) : (
          'Register'
        )}
      </button>
    </form>
  )
}
