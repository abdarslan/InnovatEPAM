'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type StateSurfaceProps = {
  title: string
  description?: string
  icon?: ReactNode
  primaryAction?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
  className?: string
}

export default function StateSurface({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  children,
  className,
}: StateSurfaceProps) {
  return (
    <div
      className={cn(
        'flex min-h-[16rem] flex-col items-center justify-center rounded-2xl border border-[var(--color-shell-border)] bg-[var(--color-shell-surface)] px-6 py-10 text-center shadow-sm sm:px-10',
        className,
      )}
    >
      {icon ? <div className="mb-4 text-[var(--color-shell-primary)]">{icon}</div> : null}
      <div className="max-w-lg space-y-3">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--color-shell-text)] sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-6 text-[var(--color-shell-text-muted)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>

      {children ? <div className="mt-6 w-full max-w-lg">{children}</div> : null}

      {primaryAction || secondaryAction ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {secondaryAction ? (
            <Button type="button" variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          ) : null}
          {primaryAction ? (
            <Button type="button" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}