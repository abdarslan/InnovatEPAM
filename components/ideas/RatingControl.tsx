'use client'

import { Button } from '@/components/ui/button'

type Props = {
  idPrefix: string
  label: string
  value: number | null
  disabled?: boolean
  onChange: (value: number) => void
}

const SCORE_VALUES = [1, 2, 3, 4, 5] as const

export function RatingControl({ idPrefix, label, value, disabled = false, onChange }: Props) {
  return (
    <fieldset className="space-y-2" aria-label={label}>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex items-center gap-2" role="radiogroup" aria-label={label}>
        {SCORE_VALUES.map((score) => {
          const isSelected = value === score
          return (
            <Button
              key={score}
              type="button"
              id={`${idPrefix}-${score}`}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${label} ${score} of 5`}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              disabled={disabled}
              onClick={() => onChange(score)}
            >
              {score}
            </Button>
          )
        })}
      </div>
    </fieldset>
  )
}
