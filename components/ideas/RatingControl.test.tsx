import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RatingControl } from './RatingControl'

describe('RatingControl', () => {
  it('renders 1-5 rating options', () => {
    render(
      <RatingControl
        idPrefix="alignment"
        label="Alignment Rating"
        value={null}
        onChange={() => undefined}
      />, 
    )

    for (const score of [1, 2, 3, 4, 5]) {
      expect(screen.getByRole('radio', { name: new RegExp(`alignment rating ${score} of 5`, 'i') })).toBeInTheDocument()
    }
  })

  it('calls onChange when a rating is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <RatingControl
        idPrefix="alignment"
        label="Alignment Rating"
        value={null}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('radio', { name: /alignment rating 4 of 5/i }))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('supports keyboard activation and exposes radiogroup label', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <RatingControl
        idPrefix="impact"
        label="Impact Rating"
        value={null}
        onChange={onChange}
      />,
    )

    expect(screen.getByRole('radiogroup', { name: /impact rating/i })).toBeInTheDocument()

    await user.tab()
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith(1)
  })
})
