import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageSurface from './PageSurface'

describe('PageSurface', () => {
  it('renders title, description, actions, and content in one shared frame', () => {
    render(
      <PageSurface
        title="Ideas"
        description="Innovation ideas submitted by the team."
        actions={<button type="button">Submit an idea</button>}
      >
        <p>Primary content</p>
      </PageSurface>,
    )

    expect(screen.getByRole('heading', { name: 'Ideas' })).toBeInTheDocument()
    expect(screen.getByText(/innovation ideas submitted by the team/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit an idea/i })).toBeInTheDocument()
    expect(screen.getByText('Primary content')).toBeInTheDocument()
  })

  it('keeps the page title and supporting text in a clear hierarchy', () => {
    render(
      <PageSurface title="Dashboard" description="Welcome back to the portal.">
        <p>Content</p>
      </PageSurface>,
    )

    const title = screen.getByRole('heading', { name: 'Dashboard' })
    const description = screen.getByText(/welcome back to the portal/i)

    expect(title).toHaveClass('text-2xl')
    expect(description).toHaveClass('text-sm')
  })
})