import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import IdeaForm from './IdeaForm'
import { getCategoryFieldRulesAction, type ActionResult } from '@/actions/ideas'

vi.mock('@/actions/ideas', async () => {
  const actual = await vi.importActual<typeof import('@/actions/ideas')>('@/actions/ideas')
  return {
    ...actual,
    getCategoryFieldRulesAction: vi.fn(async (category: string) => {
      if (category !== 'event_plan') return { ok: true, data: [] }
      return {
        ok: true,
        data: [
          {
            id: 1,
            category: 'event_plan',
            fieldKey: 'planned_date',
            label: 'Planned Date',
            fieldType: 'date',
            required: false,
            minValue: null,
            maxValue: null,
            minLength: null,
            maxLength: null,
            helpText: 'Optional event date (YYYY-MM-DD).',
            sortOrder: 1,
            isActive: true,
            updatedAt: Date.now(),
          },
          {
            id: 2,
            category: 'event_plan',
            fieldKey: 'planned_attendees',
            label: 'Planned Number of Attendees',
            fieldType: 'number',
            required: false,
            minValue: 1,
            maxValue: null,
            minLength: null,
            maxLength: null,
            helpText: 'Optional expected attendee count.',
            sortOrder: 2,
            isActive: true,
            updatedAt: Date.now(),
          },
        ],
      }
    }),
  }
})

// Mock useTransition so async transitions run synchronously in tests
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useTransition: () => [false, (fn: () => void) => fn()],
  }
})

const mockSuccessAction = vi.fn(
  async (_formData: FormData): Promise<ActionResult<{ id: number }>> => ({
    ok: true,
    data: { id: 1 },
  }),
)

const mockErrorAction = vi.fn(
  async (_formData: FormData): Promise<ActionResult<{ id: number }>> => ({
    ok: false,
    error: 'Submission failed. Please try again.',
  }),
)

describe('IdeaForm', () => {
  const mockedGetCategoryFieldRulesAction = vi.mocked(getCategoryFieldRulesAction)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows validation errors when submitted empty', async () => {
    const user = userEvent.setup()
    render(<IdeaForm action={mockSuccessAction} />)
    await user.click(screen.getByRole('button', { name: /submit idea/i }))
    expect(await screen.findByText(/title must be at least 3 characters/i)).toBeInTheDocument()
    expect(await screen.findByText(/description must be at least 10 characters/i)).toBeInTheDocument()
    expect(await screen.findByText(/please select a valid category/i)).toBeInTheDocument()
    expect(mockSuccessAction).not.toHaveBeenCalled()
  })

  it('calls action with FormData on valid submit', async () => {
    const user = userEvent.setup()
    render(<IdeaForm action={mockSuccessAction} />)
    await user.type(screen.getByLabelText(/title/i), 'My Idea Title')
    await user.type(screen.getByLabelText(/description/i), 'This is a long enough description for the idea.')
    await user.selectOptions(screen.getByLabelText(/category/i), 'process_improvement')
    const fileOne = new File(['file-one'], 'summary.pdf', { type: 'application/pdf' })
    const fileTwo = new File(['file-two'], 'preview.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText(/attachments/i), [fileOne, fileTwo])
    await user.click(screen.getAllByRole('button', { name: /remove/i })[0])
    await user.click(screen.getByRole('button', { name: /submit idea/i }))
    await waitFor(() => expect(mockSuccessAction).toHaveBeenCalledTimes(1))
    const formData: FormData = mockSuccessAction.mock.calls[0][0]
    expect(formData.get('title')).toBe('My Idea Title')
    expect(formData.get('category')).toBe('process_improvement')
    expect(formData.getAll('attachments')).toHaveLength(1)
    expect((formData.getAll('attachments')[0] as File).name).toBe('preview.png')
  })

  it('displays server error returned from action', async () => {
    const user = userEvent.setup()
    render(<IdeaForm action={mockErrorAction} />)
    await user.type(screen.getByLabelText(/title/i), 'Some Idea')
    await user.type(screen.getByLabelText(/description/i), 'Enough description here to pass.')
    await user.selectOptions(screen.getByLabelText(/category/i), 'cost_reduction')
    await user.click(screen.getByRole('button', { name: /submit idea/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Submission failed. Please try again.')
  })

  it('calls onSuccess callback after successful submit', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<IdeaForm action={mockSuccessAction} onSuccess={onSuccess} />)
    await user.type(screen.getByLabelText(/title/i), 'Valid Idea')
    await user.type(screen.getByLabelText(/description/i), 'Plenty of description text here.')
    await user.selectOptions(screen.getByLabelText(/category/i), 'workplace_culture')
    await user.click(screen.getByRole('button', { name: /submit idea/i }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(1))
  })

<<<<<<< HEAD
  it('shows attachment validation feedback when too many files are selected', async () => {
    const user = userEvent.setup()
    render(<IdeaForm action={mockSuccessAction} />)
    const files = Array.from({ length: 6 }, (_, index) => new File([`file-${index}`], `asset-${index}.pdf`, { type: 'application/pdf' }))
    await user.upload(screen.getByLabelText(/attachments/i), files)
    expect(await screen.findByRole('alert')).toHaveTextContent(/up to 5 attachments/i)
  })

  it('renders dynamic fields for event_plan category', async () => {
    const user = userEvent.setup()
    render(<IdeaForm action={mockSuccessAction} />)

    await user.selectOptions(screen.getByLabelText(/category/i), 'event_plan')

    expect(await screen.findByLabelText(/planned date/i)).toBeInTheDocument()
    expect(await screen.findByLabelText(/planned number of attendees/i)).toBeInTheDocument()
    expect(mockedGetCategoryFieldRulesAction).toHaveBeenCalledWith('event_plan')
  })

  it('replaces dynamic fields when category changes and excludes stale values from submission', async () => {
    const user = userEvent.setup()
    render(<IdeaForm action={mockSuccessAction} />)

    await user.type(screen.getByLabelText(/title/i), 'Event Idea')
    await user.type(screen.getByLabelText(/description/i), 'This description is long enough for submission.')
    await user.selectOptions(screen.getByLabelText(/category/i), 'event_plan')

    const dateInput = await screen.findByLabelText(/planned date/i)
    await user.type(dateInput, '2026-10-20')

    await user.selectOptions(screen.getByLabelText(/category/i), 'process_improvement')

    await waitFor(() => {
      expect(screen.queryByLabelText(/planned date/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/planned number of attendees/i)).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /submit idea/i }))

    await waitFor(() => expect(mockSuccessAction).toHaveBeenCalledTimes(1))
    const formData: FormData = mockSuccessAction.mock.calls[0][0]
    expect(formData.get('dynamic_planned_date')).toBeNull()
    expect(formData.get('dynamic_planned_attendees')).toBeNull()
  })

  it('associates dynamic help text and validation error via aria-describedby', async () => {
    const user = userEvent.setup()

    mockedGetCategoryFieldRulesAction.mockResolvedValueOnce({
      ok: true,
      data: [
        {
          id: 10,
          category: 'event_plan',
          fieldKey: 'venue_name',
          label: 'Venue Name',
          fieldType: 'text',
          required: true,
          minValue: null,
          maxValue: null,
          minLength: 3,
          maxLength: null,
          helpText: 'Name of the event venue.',
          sortOrder: 1,
          isActive: true,
          updatedAt: Date.now(),
        },
      ],
    })

    render(<IdeaForm action={mockSuccessAction} />)

    await user.type(screen.getByLabelText(/title/i), 'Accessibility Idea')
    await user.type(screen.getByLabelText(/description/i), 'This description is sufficient for validation.')
    await user.selectOptions(screen.getByLabelText(/category/i), 'event_plan')

    const dynamicInput = await screen.findByLabelText(/venue name/i)
    expect(dynamicInput).toHaveAttribute('aria-describedby')

    await user.click(screen.getByRole('button', { name: /submit idea/i }))

    const errorText = await screen.findByText(/venue name is required/i)
    expect(errorText).toBeInTheDocument()

    const describedBy = dynamicInput.getAttribute('aria-describedby') ?? ''
    expect(describedBy).toContain('dynamic_venue_name-help')
    expect(describedBy).toContain('dynamic_venue_name-error')
  })
})
