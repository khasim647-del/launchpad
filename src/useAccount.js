import { useCallback, useEffect, useState } from 'react'
import { apiRequest, SignedOutError } from './api.js'
import { loadFromStorage, saveToStorage } from './utils.js'

// Everything about the signed-in user: who they are, their private links and
// their search history. All of it lives on the server, per user.
export function useAccount() {
  const [session, setSession] = useState(() => loadFromStorage('launchpad-session', null))
  const [privateLinks, setPrivateLinks] = useState([])
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const token = session?.token ?? null

  // Remember the sign-in so a page reload keeps the user signed in.
  useEffect(() => {
    saveToStorage('launchpad-session', session)
  }, [session])

  const signOut = useCallback(() => {
    setSession(null)
    setPrivateLinks([])
    setHistory([])
    window.google?.accounts.id.disableAutoSelect()
  }, [])

  const handleError = useCallback(
    (caught) => {
      if (caught instanceof SignedOutError) signOut()
      setError(caught.message || 'Could not reach the server.')
    },
    [signOut],
  )

  // Load the user's own data whenever they sign in.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    Promise.all([apiRequest('/api/private-links', token), apiRequest('/api/history', token)])
      .then(([links, searches]) => {
        if (cancelled) return
        setPrivateLinks(links)
        setHistory(searches)
      })
      .catch((caught) => {
        if (!cancelled) handleError(caught)
      })
    return () => {
      cancelled = true
    }
  }, [token, handleError])

  // Called with the ID token from the Google button.
  async function signIn(credential) {
    try {
      setError('')
      setSession(await apiRequest('/api/auth/google', null, { method: 'POST', body: { credential } }))
    } catch (caught) {
      handleError(caught)
    }
  }

  async function addPrivateLink(name, url) {
    try {
      const link = await apiRequest('/api/private-links', token, { method: 'POST', body: { name, url } })
      setPrivateLinks((links) => [...links, link])
    } catch (caught) {
      handleError(caught)
    }
  }

  async function deletePrivateLink(id) {
    try {
      await apiRequest(`/api/private-links/${id}`, token, { method: 'DELETE' })
      setPrivateLinks((links) => links.filter((link) => link.id !== id))
    } catch (caught) {
      handleError(caught)
    }
  }

  async function recordSearch(engine, query) {
    if (!token) return
    try {
      const entry = await apiRequest('/api/history', token, { method: 'POST', body: { engine, query } })
      setHistory((entries) => [entry, ...entries])
    } catch (caught) {
      handleError(caught)
    }
  }

  async function deleteSearch(id) {
    try {
      await apiRequest(`/api/history/${id}`, token, { method: 'DELETE' })
      setHistory((entries) => entries.filter((entry) => entry.id !== id))
    } catch (caught) {
      handleError(caught)
    }
  }

  async function clearHistory() {
    try {
      await apiRequest('/api/history', token, { method: 'DELETE' })
      setHistory([])
    } catch (caught) {
      handleError(caught)
    }
  }

  return {
    user: session?.user ?? null,
    privateLinks,
    history,
    error,
    dismissError: () => setError(''),
    signIn,
    signOut,
    addPrivateLink,
    deletePrivateLink,
    recordSearch,
    deleteSearch,
    clearHistory,
  }
}
