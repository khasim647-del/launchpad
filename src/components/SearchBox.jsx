import { useState } from 'react'
import { SEARCH_ENGINES } from '../data.js'

// The big search box in the middle of the page.
function SearchBox() {
  const [engine, setEngine] = useState('google') // Google is selected by default
  const [query, setQuery] = useState('')

  function handleSubmit(event) {
    event.preventDefault() // stop the page from reloading

    const text = query.trim()
    if (text === '') return // ignore empty searches

    const searchUrl = SEARCH_ENGINES[engine].url + encodeURIComponent(text)
    window.open(searchUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="search-section" aria-labelledby="search-heading">
      <h1 id="search-heading" className="search-title">What are you looking for?</h1>

      <form className="search-form" onSubmit={handleSubmit} role="search">
        <fieldset className="engine-picker">
          <legend className="visually-hidden">Search engine</legend>
          {Object.entries(SEARCH_ENGINES).map(([key, item]) => (
            <label key={key} className={engine === key ? 'engine-option active' : 'engine-option'}>
              <input
                type="radio"
                name="engine"
                value={key}
                checked={engine === key}
                onChange={() => setEngine(key)}
              />
              {item.label}
            </label>
          ))}
        </fieldset>

        <div className="search-row">
          <label htmlFor="search-input" className="visually-hidden">
            Search {SEARCH_ENGINES[engine].label}
          </label>
          <input
            id="search-input"
            type="search"
            className="search-input"
            placeholder={SEARCH_ENGINES[engine].placeholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
        </div>
      </form>
    </section>
  )
}

export default SearchBox
