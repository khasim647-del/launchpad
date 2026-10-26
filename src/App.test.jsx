import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

const user = { id: 1, email: 'test@example.com', name: 'Test User', pictureUrl: null }

// The Google button loads a script from Google; the page tests don't need it.
vi.mock('./components/GoogleSignInButton.jsx', () => ({
  default: () => <button type="button">Sign in with Google</button>,
}))

function mockApi(privateLinks = [], history = []) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => ({
      ok: true,
      status: 200,
      json: async () => (url.endsWith('/api/private-links') ? privateLinks : history),
    })),
  )
}

describe('App', () => {
  it('shows the default bookmarks and the sign-in button when signed out', () => {
    mockApi()
    render(<App />)

    expect(screen.getByRole('link', { name: /YouTube/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument()
    expect(screen.getByText(/Sign in with Google to get your own private bookmarks/)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Search history' })).not.toBeInTheDocument()
  })

  it('shows the private sections when signed in', async () => {
    localStorage.setItem('launchpad-session', JSON.stringify({ token: 't', user }))
    mockApi([{ id: 1, name: 'My Bank', url: 'https://bank.com/' }])
    render(<App />)

    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /My Bank/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Search history' })).toBeInTheDocument()
  })

  it('keeps favorite bookmarks in the browser', async () => {
    mockApi()
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete YouTube bookmark' }))

    expect(screen.queryByRole('link', { name: /YouTube/ })).not.toBeInTheDocument()
    const saved = JSON.parse(localStorage.getItem('mystart-bookmarks'))
    expect(saved.some((bookmark) => bookmark.name === 'YouTube')).toBe(false)
  })

  it('switches between light and dark mode', async () => {
    localStorage.setItem('mystart-theme', JSON.stringify('light'))
    mockApi()
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(JSON.parse(localStorage.getItem('mystart-theme'))).toBe('dark')
  })
})
