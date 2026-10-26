import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SearchBox from './SearchBox.jsx'

describe('SearchBox', () => {
  let openSpy

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  it('searches Google in a new tab and reports the search', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    render(<SearchBox onSearch={onSearch} />)

    await user.type(screen.getByRole('searchbox'), '  react hooks  ')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(openSpy).toHaveBeenCalledWith(
      'https://www.google.com/search?q=react%20hooks',
      '_blank',
      'noopener,noreferrer',
    )
    expect(onSearch).toHaveBeenCalledWith('google', 'react hooks')
  })

  it('searches YouTube when it is picked', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    render(<SearchBox onSearch={onSearch} />)

    await user.click(screen.getByRole('radio', { name: 'YouTube' }))
    expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', 'Search YouTube videos…')

    await user.type(screen.getByRole('searchbox'), 'lofi{Enter}')

    expect(openSpy).toHaveBeenCalledWith(
      'https://www.youtube.com/results?search_query=lofi',
      '_blank',
      'noopener,noreferrer',
    )
    expect(onSearch).toHaveBeenCalledWith('youtube', 'lofi')
  })

  it('ignores empty searches', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    render(<SearchBox onSearch={onSearch} />)

    await user.type(screen.getByRole('searchbox'), '   ')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(openSpy).not.toHaveBeenCalled()
    expect(onSearch).not.toHaveBeenCalled()
  })
})
