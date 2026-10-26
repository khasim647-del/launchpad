import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAccount } from './useAccount.js'

const API = 'http://api.test'
const user = { id: 1, email: 'test@example.com', name: 'Test User', pictureUrl: null }

// A fake API: `routes` maps "METHOD /path" to { status, body }.
// Unknown requests fail the test with a clear message.
function mockApi(routes) {
  const fetchMock = vi.fn(async (url, options = {}) => {
    const key = `${options.method ?? 'GET'} ${url.replace(API, '')}`
    const route = routes[key]
    if (!route) throw new Error(`Unexpected request: ${key}`)
    const status = route.status ?? 200
    return { ok: status < 400, status, json: async () => route.body }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function signedIn() {
  localStorage.setItem('launchpad-session', JSON.stringify({ token: 'token-123', user }))
}

const emptyAccount = {
  'GET /api/private-links': { body: [] },
  'GET /api/history': { body: [] },
}

describe('useAccount', () => {
  it('starts signed out without calling the API', () => {
    const fetchMock = mockApi({})
    const { result } = renderHook(() => useAccount())

    expect(result.current.user).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('signs in with the Google credential and loads the user data', async () => {
    const fetchMock = mockApi({
      'POST /api/auth/google': { body: { token: 'token-123', user } },
      'GET /api/private-links': { body: [{ id: 5, name: 'Bank', url: 'https://bank.com/' }] },
      'GET /api/history': { body: [{ id: 9, engine: 'google', query: 'cats', searchedAt: '2026-10-26T14:00:00Z' }] },
    })
    const { result } = renderHook(() => useAccount())

    await act(() => result.current.signIn('google-credential'))

    expect(result.current.user).toEqual(user)
    await waitFor(() => expect(result.current.privateLinks).toHaveLength(1))
    expect(result.current.history[0].query).toBe('cats')

    const [, signInOptions] = fetchMock.mock.calls[0]
    expect(JSON.parse(signInOptions.body)).toEqual({ credential: 'google-credential' })
    expect(JSON.parse(localStorage.getItem('launchpad-session')).token).toBe('token-123')
  })

  it('sends the saved token with every request', async () => {
    signedIn()
    const fetchMock = mockApi(emptyAccount)
    renderHook(() => useAccount())

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    for (const [, options] of fetchMock.mock.calls) {
      expect(options.headers.Authorization).toBe('Bearer token-123')
    }
  })

  it('signs out when the saved sign-in has expired', async () => {
    signedIn()
    mockApi({
      'GET /api/private-links': { status: 401 },
      'GET /api/history': { status: 401 },
    })
    const { result } = renderHook(() => useAccount())

    await waitFor(() => expect(result.current.user).toBeNull())
    expect(result.current.error).toBe('Please sign in again.')
    expect(JSON.parse(localStorage.getItem('launchpad-session'))).toBeNull()
  })

  it('shows an error when sign-in is rejected', async () => {
    mockApi({ 'POST /api/auth/google': { status: 401 } })
    const { result } = renderHook(() => useAccount())

    await act(() => result.current.signIn('bad-credential'))

    expect(result.current.user).toBeNull()
    expect(result.current.error).toBe('Please sign in again.')
  })

  it('adds and deletes private links', async () => {
    signedIn()
    mockApi({
      ...emptyAccount,
      'POST /api/private-links': { body: { id: 7, name: 'Bank', url: 'https://bank.com/' } },
      'DELETE /api/private-links/7': { status: 204 },
    })
    const { result } = renderHook(() => useAccount())
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))

    await act(() => result.current.addPrivateLink('Bank', 'https://bank.com/'))
    expect(result.current.privateLinks).toEqual([{ id: 7, name: 'Bank', url: 'https://bank.com/' }])

    await act(() => result.current.deletePrivateLink(7))
    expect(result.current.privateLinks).toEqual([])
  })

  it('records searches newest first, deletes one and clears all', async () => {
    signedIn()
    const entry = (id, query) => ({ id, engine: 'google', query, searchedAt: '2026-10-26T14:00:00Z' })
    mockApi({
      'GET /api/private-links': { body: [] },
      'GET /api/history': { body: [entry(1, 'old')] },
      'POST /api/history': { body: entry(2, 'new') },
      'DELETE /api/history/1': { status: 204 },
      'DELETE /api/history': { status: 204 },
    })
    const { result } = renderHook(() => useAccount())
    await waitFor(() => expect(result.current.history).toHaveLength(1))

    await act(() => result.current.recordSearch('google', 'new'))
    expect(result.current.history.map((item) => item.query)).toEqual(['new', 'old'])

    await act(() => result.current.deleteSearch(1))
    expect(result.current.history.map((item) => item.query)).toEqual(['new'])

    await act(() => result.current.clearHistory())
    expect(result.current.history).toEqual([])
  })

  it('does not record searches when signed out', async () => {
    const fetchMock = mockApi({})
    const { result } = renderHook(() => useAccount())

    await act(() => result.current.recordSearch('google', 'cats'))

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows an error when the server fails', async () => {
    signedIn()
    mockApi({ ...emptyAccount, 'POST /api/private-links': { status: 500 } })
    const { result } = renderHook(() => useAccount())
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))

    await act(() => result.current.addPrivateLink('Bank', 'https://bank.com/'))

    expect(result.current.error).toBe('Something went wrong. Please try again.')
    expect(result.current.privateLinks).toEqual([])
    expect(result.current.user).toEqual(user)
  })

  it('clears everything on sign out', async () => {
    signedIn()
    mockApi({
      'GET /api/private-links': { body: [{ id: 5, name: 'Bank', url: 'https://bank.com/' }] },
      'GET /api/history': { body: [] },
    })
    const { result } = renderHook(() => useAccount())
    await waitFor(() => expect(result.current.privateLinks).toHaveLength(1))

    act(() => result.current.signOut())

    expect(result.current.user).toBeNull()
    expect(result.current.privateLinks).toEqual([])
    expect(JSON.parse(localStorage.getItem('launchpad-session'))).toBeNull()
  })
})
