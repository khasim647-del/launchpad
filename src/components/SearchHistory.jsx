import { useState } from 'react'
import { SEARCH_ENGINES } from '../data.js'

const SHORT_LIST = 8

function formatTime(isoText) {
  return new Date(isoText).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

// The signed-in user's past searches. Click one to search it again.
function SearchHistory({ history, onSearchAgain, onDelete, onClear }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? history : history.slice(0, SHORT_LIST)

  function handleClear() {
    if (window.confirm('Delete your whole search history?')) onClear()
  }

  return (
    <section className="section" aria-labelledby="history-heading">
      <div className="section-header">
        <div>
          <h2 id="history-heading">Search history</h2>
          <p className="section-note">Only you can see this.</p>
        </div>
        {history.length > 0 && (
          <button type="button" className="button button--ghost" onClick={handleClear}>
            Clear all
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="empty-message">No searches yet. Your searches will show up here.</p>
      ) : (
        <ul className="history-list">
          {visible.map((entry) => (
            <li key={entry.id} className="history-item">
              <button
                type="button"
                className="history-search"
                onClick={() => onSearchAgain(entry.engine, entry.query)}
                title="Search again"
              >
                <span className="history-query">{entry.query}</span>
                <span className="history-meta">
                  {SEARCH_ENGINES[entry.engine]?.label ?? entry.engine} · {formatTime(entry.searchedAt)}
                </span>
              </button>
              <button
                type="button"
                className="history-delete"
                onClick={() => onDelete(entry.id)}
                aria-label={`Delete search "${entry.query}"`}
                title="Delete from history"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {history.length > SHORT_LIST && (
        <button type="button" className="button button--ghost show-more" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show less' : `Show all (${history.length})`}
        </button>
      )}
    </section>
  )
}

export default SearchHistory
