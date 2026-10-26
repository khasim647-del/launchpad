import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SearchHistory from './SearchHistory.jsx'

function makeHistory(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    engine: index % 2 === 0 ? 'google' : 'youtube',
    query: `search ${index + 1}`,
    searchedAt: '2026-10-26T14:00:00Z',
  }))
}

function renderHistory(history, handlers = {}) {
  const props = { onSearchAgain: vi.fn(), onDelete: vi.fn(), onClear: vi.fn(), ...handlers }
  render(<SearchHistory history={history} {...props} />)
  return props
}

describe('SearchHistory', () => {
  it('shows a message when there is no history', () => {
    renderHistory([])

    expect(screen.getByText(/No searches yet/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
  })

  it('shows each search with its engine', () => {
    renderHistory(makeHistory(2))

    expect(screen.getByText('search 1')).toBeInTheDocument()
    expect(screen.getByText(/^Google ·/)).toBeInTheDocument()
    expect(screen.getByText(/^YouTube ·/)).toBeInTheDocument()
  })

  it('searches again when an entry is clicked', async () => {
    const { onSearchAgain } = renderHistory(makeHistory(2))

    await userEvent.click(screen.getByText('search 2'))

    expect(onSearchAgain).toHaveBeenCalledWith('youtube', 'search 2')
  })

  it('deletes one entry', async () => {
    const { onDelete } = renderHistory(makeHistory(2))

    await userEvent.click(screen.getByRole('button', { name: 'Delete search "search 1"' }))

    expect(onDelete).toHaveBeenCalledWith(1)
  })

  it('clears everything only after the user confirms', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const { onClear } = renderHistory(makeHistory(2))
    const clearButton = screen.getByRole('button', { name: 'Clear all' })

    await userEvent.click(clearButton)
    expect(onClear).not.toHaveBeenCalled()

    await userEvent.click(clearButton)
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(confirmSpy).toHaveBeenCalledTimes(2)
  })

  it('shows 8 searches at first and the rest on request', async () => {
    renderHistory(makeHistory(10))

    expect(screen.getAllByTitle('Search again')).toHaveLength(8)

    await userEvent.click(screen.getByRole('button', { name: 'Show all (10)' }))
    expect(screen.getAllByTitle('Search again')).toHaveLength(10)

    await userEvent.click(screen.getByRole('button', { name: 'Show less' }))
    expect(screen.getAllByTitle('Search again')).toHaveLength(8)
  })
})
