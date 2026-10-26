import SiteIcon from './SiteIcon.jsx'
import { getDomain } from '../utils.js'

// One bookmark tile. The whole card is a link; the × button deletes it.
function BookmarkCard({ bookmark, onDelete }) {
  return (
    <li className="bookmark-card">
      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="bookmark-link">
        <SiteIcon name={bookmark.name} url={bookmark.url} />
        <span className="bookmark-name">{bookmark.name}</span>
        <span className="bookmark-url">{getDomain(bookmark.url)}</span>
      </a>
      <button
        type="button"
        className="delete-button"
        onClick={() => onDelete(bookmark.id)}
        aria-label={`Delete ${bookmark.name} bookmark`}
        title="Delete bookmark"
      >
        ×
      </button>
    </li>
  )
}

export default BookmarkCard
