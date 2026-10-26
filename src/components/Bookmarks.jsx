import { useState } from 'react'
import BookmarkCard from './BookmarkCard.jsx'
import AddBookmarkForm from './AddBookmarkForm.jsx'

// The "Favorite bookmarks" section: the grid of cards plus the add form.
function Bookmarks({ bookmarks, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false)

  function handleAdd(name, url) {
    onAdd(name, url)
    setShowForm(false)
  }

  return (
    <section className="section" aria-labelledby="bookmarks-heading">
      <div className="section-header">
        <h2 id="bookmarks-heading">Favorite bookmarks</h2>
        {!showForm && (
          <button type="button" className="button button--primary" onClick={() => setShowForm(true)}>
            + Add bookmark
          </button>
        )}
      </div>

      {showForm && <AddBookmarkForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />}

      {bookmarks.length === 0 ? (
        <p className="empty-message">No bookmarks yet. Add your favorite websites above.</p>
      ) : (
        <ul className="bookmark-grid">
          {bookmarks.map((bookmark) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  )
}

export default Bookmarks
