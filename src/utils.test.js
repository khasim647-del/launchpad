import { describe, expect, it } from 'vitest'
import { buildSearchUrl, getDomain, loadFromStorage, normalizeUrl, saveToStorage } from './utils.js'

describe('normalizeUrl', () => {
  it('adds https:// when it is missing', () => {
    expect(normalizeUrl('github.com')).toBe('https://github.com/')
  })

  it('keeps http and https addresses as they are', () => {
    expect(normalizeUrl('http://example.com/page')).toBe('http://example.com/page')
    expect(normalizeUrl('HTTPS://Example.com')).toBe('https://example.com/')
  })

  it('trims spaces around the address', () => {
    expect(normalizeUrl('  netflix.com  ')).toBe('https://netflix.com/')
  })

  it('rejects empty input', () => {
    expect(normalizeUrl('')).toBeNull()
    expect(normalizeUrl('   ')).toBeNull()
  })

  it('rejects addresses without a dot', () => {
    expect(normalizeUrl('localhost')).toBeNull()
    expect(normalizeUrl('hello')).toBeNull()
  })

  it('rejects dangerous javascript: links', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull()
  })
})

describe('getDomain', () => {
  it('returns the site name without www', () => {
    expect(getDomain('https://www.github.com/some/page')).toBe('github.com')
  })

  it('keeps other subdomains', () => {
    expect(getDomain('https://mail.google.com')).toBe('mail.google.com')
  })

  it('returns the input when it is not a URL', () => {
    expect(getDomain('not a url')).toBe('not a url')
  })
})

describe('buildSearchUrl', () => {
  it('builds a Google search link', () => {
    expect(buildSearchUrl('google', 'cats')).toBe('https://www.google.com/search?q=cats')
  })

  it('builds a YouTube search link', () => {
    expect(buildSearchUrl('youtube', 'lofi')).toBe('https://www.youtube.com/results?search_query=lofi')
  })

  it('encodes spaces and special characters', () => {
    expect(buildSearchUrl('google', 'a&b c?')).toBe('https://www.google.com/search?q=a%26b%20c%3F')
  })

  it('falls back to Google for an unknown engine', () => {
    expect(buildSearchUrl('bing', 'x')).toBe('https://www.google.com/search?q=x')
  })
})

describe('loadFromStorage and saveToStorage', () => {
  it('saves and loads a value', () => {
    saveToStorage('key', { a: [1, 2] })
    expect(loadFromStorage('key', null)).toEqual({ a: [1, 2] })
  })

  it('returns the fallback when nothing is saved', () => {
    expect(loadFromStorage('missing', 'fallback')).toBe('fallback')
  })

  it('returns the fallback when the saved value is broken', () => {
    localStorage.setItem('broken', '{not json')
    expect(loadFromStorage('broken', 'fallback')).toBe('fallback')
  })
})
