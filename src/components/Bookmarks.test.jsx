import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Bookmarks from './Bookmarks.jsx'

const bookmarks = [
  { id: '1', name: 'GitHub', url: 'https://github.com' },
  { id: '2', name: 'YouTube', url: 'https://www.youtube.com' },
]

describe('Bookmarks', () => {
  it('shows a card for each bookmark that opens the site', () => {
    render(<Bookmarks bookmarks={bookmarks} onAdd={vi.fn()} onDelete={vi.fn()} />)

    const github = screen.getByRole('link', { name: /GitHub/ })
    expect(github).toHaveAttribute('href', 'https://github.com')
    expect(github).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: /YouTube/ })).toHaveTextContent('youtube.com')
  })

  it('shows a message when there are no bookmarks', () => {
    render(<Bookmarks bookmarks={[]} onAdd={vi.fn()} onDelete={vi.fn()} emptyMessage="Nothing here" />)

    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('deletes a bookmark with its × button', async () => {
    const onDelete = vi.fn()
    render(<Bookmarks bookmarks={bookmarks} onAdd={vi.fn()} onDelete={onDelete} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete GitHub bookmark' }))

    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('opens the form, adds a bookmark and closes the form', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(<Bookmarks bookmarks={bookmarks} onAdd={onAdd} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '+ Add bookmark' }))
    await user.type(screen.getByLabelText('Website name'), 'Wiki')
    await user.type(screen.getByLabelText('Website URL'), 'wikipedia.org')
    await user.click(screen.getByRole('button', { name: 'Save bookmark' }))

    expect(onAdd).toHaveBeenCalledWith('Wiki', 'https://wikipedia.org/')
    expect(screen.queryByLabelText('Website name')).not.toBeInTheDocument()
  })

  it('uses its own title, note and form ids', async () => {
    render(
      <Bookmarks
        id="private"
        title="My private bookmarks"
        note="Only you can see these."
        bookmarks={bookmarks}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    const section = screen.getByRole('region', { name: 'My private bookmarks' })
    expect(within(section).getByText('Only you can see these.')).toBeInTheDocument()

    await userEvent.click(within(section).getByRole('button', { name: '+ Add bookmark' }))
    expect(screen.getByLabelText('Website name')).toHaveAttribute('id', 'private-name')
  })
})
