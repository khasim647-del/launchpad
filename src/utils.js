// Small helper functions used across the app.

import { SEARCH_ENGINES } from './data.js'

// Read a saved value from localStorage. Returns `fallback` if nothing is saved
// or if the browser blocks storage (for example in some private windows).
export function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved === null ? fallback : JSON.parse(saved)
  } catch {
    return fallback
  }
}

// Save a value to localStorage. Errors are ignored so the page keeps working.
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage is unavailable — nothing else to do.
  }
}

// Turn what the user typed into a full, valid web address.
// "github.com" becomes "https://github.com". Returns null if it isn't valid.
export function normalizeUrl(input) {
  let text = input.trim()
  if (text === '') return null

  if (!/^https?:\/\//i.test(text)) {
    text = 'https://' + text
  }

  try {
    const url = new URL(text)
    // A real website address needs a dot in it, like "example.com".
    if (!url.hostname.includes('.')) return null
    return url.href
  } catch {
    return null
  }
}

// Get just the site name from a URL, e.g. "https://www.github.com/x" -> "github.com".
export function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// Build the web address for a search, e.g. ("google", "cats") -> "https://www.google.com/search?q=cats".
export function buildSearchUrl(engine, query) {
  const searchEngine = SEARCH_ENGINES[engine] ?? SEARCH_ENGINES.google
  return searchEngine.url + encodeURIComponent(query)
}
