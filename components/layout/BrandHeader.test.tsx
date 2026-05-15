import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import BrandHeader from '@/components/layout/BrandHeader'

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt ?? ''} />,
}))

describe('BrandHeader', () => {
  it('renders logo and app name when logo source is available', () => {
    render(<BrandHeader appName="InnovatEPAM" logoSrc="/logo.svg" />)

    expect(screen.getByText('InnovatEPAM')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /innovatepam logo/i })).toBeInTheDocument()
  })

  it('falls back to text-only brand header when logo fails to load', () => {
    render(<BrandHeader appName="InnovatEPAM" logoSrc="/broken-logo.svg" />)

    const logo = screen.getByRole('img', { name: /innovatepam logo/i })
    fireEvent.error(logo)

    expect(screen.getByText('InnovatEPAM')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /innovatepam logo/i })).not.toBeInTheDocument()
  })

  it('keeps long app names in a truncation-safe layout', () => {
    const longName = 'InnovatEPAM Global Innovation Excellence Platform for Emerging Ideas'

    render(<BrandHeader appName={longName} logoSrc={null} />)

    const name = screen.getByText(longName)
    expect(name).toHaveClass('truncate')
  })
})