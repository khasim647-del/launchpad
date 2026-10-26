// Talking to the Launchpad API (the .NET server in the server/ folder).
// Both values come from .env.local locally, or from the host's environment variables.

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

// Sign-in only appears once both settings are filled in.
export const accountsEnabled = API_URL !== '' && GOOGLE_CLIENT_ID !== ''

// Thrown when the saved sign-in has expired, so the app can sign the user out.
export class SignedOutError extends Error {}

export async function apiRequest(path, token, { method = 'GET', body } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(API_URL + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 401) throw new SignedOutError('Please sign in again.')
  if (!response.ok) throw new Error('Something went wrong. Please try again.')
  return response.status === 204 ? null : response.json()
}
