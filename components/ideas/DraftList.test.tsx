import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import DraftList from './DraftList'
import type { IdeaDraftSummary } from '@/actions/idea-drafts'

describe('DraftList', () => {
  it('shows empty state message when there are no drafts', () => {
    render(<DraftList drafts={[]} />)
    expect(screen.getByText(/no drafts/i)).toBeInTheDocument()
  })

  it('renders a row for each draft summary', () => {
    const drafts: IdeaDraftSummary[] = [
      { id: 1, title: 'My First Draft', category: 'process_improvement', updatedAt: Date.now() },
      { id: 2, title: null, category: null, updatedAt: Date.now() },
    ]
    render(<DraftList drafts={drafts} />)
    expect(screen.getByText('My First Draft')).toBeInTheDocument()
    expect(screen.getByText(/untitled draft/i)).toBeInTheDocument()
  })

  it('shows category label when category is set', () => {
    const drafts: IdeaDraftSummary[] = [
      { id: 1, title: 'Draft', category: 'cost_reduction', updatedAt: Date.now() },
    ]
    render(<DraftList drafts={drafts} />)
    expect(screen.getByText(/cost reduction/i)).toBeInTheDocument()
  })

  it('renders a Continue link pointing to /ideas/new?draftId=<id>', () => {
    const drafts: IdeaDraftSummary[] = [
      { id: 7, title: 'Resume me', category: null, updatedAt: Date.now() },
    ]
    render(<DraftList drafts={drafts} />)
    const link = screen.getByRole('link', { name: /continue/i })
    expect(link).toHaveAttribute('href', '/ideas/new?draftId=7')
  })

  it('renders accessible updatedAt timestamp', () => {
    const ts = Date.now()
    const drafts: IdeaDraftSummary[] = [
      { id: 1, title: 'Draft', category: null, updatedAt: ts },
    ]
    render(<DraftList drafts={drafts} />)
    expect(screen.getByRole('time')).toBeInTheDocument()
  })

  // T039: Accessibility checks
  it('has an accessible list label for screen readers', () => {
    const drafts: IdeaDraftSummary[] = [
      { id: 1, title: 'A Draft', category: null, updatedAt: Date.now() },
    ]
    render(<DraftList drafts={drafts} />)
    expect(screen.getByRole('list', { name: /your drafts/i })).toBeInTheDocument()
  })

  it('Continue link has descriptive aria-label including draft title', () => {
    const drafts: IdeaDraftSummary[] = [
      { id: 3, title: 'My Idea', category: null, updatedAt: Date.now() },
    ]
    render(<DraftList drafts={drafts} />)
    expect(screen.getByRole('link', { name: /continue draft: my idea/i })).toBeInTheDocument()
  })
})
