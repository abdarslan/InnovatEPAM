import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageSurfaceProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export default function PageSurface({
  title,
  description,
  actions,
  children,
  className,
}: PageSurfaceProps) {
  return (
    <section className={cn('space-y-6', className)}>
      <header className="flex flex-col gap-4 border-b border-[var(--color-shell-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium tracking-wide text-[var(--color-shell-text-muted)] uppercase">
            InnovatEPAM Portal
          </p>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-shell-text)] sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-[var(--color-shell-text-muted)] sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
      </header>

      <div className="space-y-6">{children}</div>
    </section>
  )
}