import { useState } from 'react'
import { normalizeUrl } from '../utils.js'

// A small form for adding a new bookmark.
function AddBookmarkForm({ onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (name.trim() === '') {
      setError('Please enter a website name.')
      return
    }

    const cleanUrl = normalizeUrl(url)
    if (cleanUrl === null) {
      setError('Please enter a valid website address, like example.com')
      return
    }

    onAdd(name.trim(), cleanUrl)
    setName('')
    setUrl('')
    setError('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} noValidate>
      <div className="add-form-fields">
        <div className="field">
          <label htmlFor="bookmark-name">Website name</label>
          <input
            id="bookmark-name"
            type="text"
            placeholder="e.g. Netflix"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="bookmark-url">Website URL</label>
          <input
            id="bookmark-url"
            type="url"
            placeholder="e.g. netflix.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="add-form-actions">
        <button type="button" className="button button--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button button--primary">
          Save bookmark
        </button>
      </div>
    </form>
  )
}

export default AddBookmarkForm
