import { useState } from 'react'
import BookmarkCard from './BookmarkCard.jsx'
import AddBookmarkForm from './AddBookmarkForm.jsx'

// A bookmarks section: the grid of cards plus the add form.
// Used for "Favorite bookmarks" and for the signed-in user's private section.
function Bookmarks({
  bookmarks,
  onAdd,
  onDelete,
  id = 'bookmarks',
  title = 'Favorite bookmarks',
  note,
  emptyMessage = 'No bookmarks yet. Add your favorite websites above.',
}) {
  const [showForm, setShowForm] = useState(false)

  function handleAdd(name, url) {
    onAdd(name, url)
    setShowForm(false)
  }

  return (
    <section className="section" aria-labelledby={`${id}-heading`}>
      <div className="section-header">
        <div>
          <h2 id={`${id}-heading`}>{title}</h2>
          {note && <p className="section-note">{note}</p>}
        </div>
        {!showForm && (
          <button type="button" className="button button--primary" onClick={() => setShowForm(true)}>
            + Add bookmark
          </button>
        )}
      </div>

      {showForm && <AddBookmarkForm onAdd={handleAdd} onCancel={() => setShowForm(false)} idPrefix={id} />}

      {bookmarks.length === 0 ? (
        <p className="empty-message">{emptyMessage}</p>
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
