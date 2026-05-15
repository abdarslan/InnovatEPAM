import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SearchPlaceholder from '@/components/layout/SearchPlaceholder'

describe('SearchPlaceholder', () => {
  it('renders placeholder content as non-interactive region', () => {
    render(<SearchPlaceholder />)

    const placeholder = screen.getByTestId('search-placeholder')
    expect(placeholder).toBeInTheDocument()
    expect(placeholder).toHaveAttribute('aria-hidden', 'true')
    expect(placeholder).toHaveTextContent('Search placeholder')
  })

  it('keeps the responsive minimum-width footprint classes', () => {
    render(<SearchPlaceholder />)

    const placeholder = screen.getByTestId('search-placeholder')
    expect(placeholder).toHaveClass('min-w-32')
    expect(placeholder).toHaveClass('md:min-w-40')
    expect(placeholder).toHaveClass('lg:min-w-56')
  })
})