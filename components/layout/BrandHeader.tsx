 'use client'

import { useState } from 'react'
import Image from 'next/image'

type BrandHeaderProps = {
  appName: string
  logoSrc?: string | null
}

export default function BrandHeader({ appName, logoSrc }: BrandHeaderProps) {
  const [isLogoVisible, setIsLogoVisible] = useState(Boolean(logoSrc))

  return (
    <div className="flex min-h-14 min-w-0 items-center gap-3 border-b border-[var(--color-shell-border)] px-4 [font-family:var(--font-shell-body)]">
      {logoSrc && isLogoVisible ? (
        <Image
          src={logoSrc}
          alt={`${appName} logo`}
          width={28}
          height={28}
          className="h-7 w-7 rounded-md"
          onError={() => setIsLogoVisible(false)}
        />
      ) : null}
      <span className="truncate text-sm font-semibold text-[var(--color-shell-primary)] [font-family:var(--font-shell-headline)]">
        {appName}
      </span>
    </div>
  )
}
