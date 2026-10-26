import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import SearchBox from './components/SearchBox.jsx'
import Bookmarks from './components/Bookmarks.jsx'
import TopSites from './components/TopSites.jsx'
import Footer from './components/Footer.jsx'
import { DEFAULT_BOOKMARKS } from './data.js'
import { loadFromStorage, saveToStorage } from './utils.js'

// Pick the starting theme: the saved one, or the computer's own setting.
function getInitialTheme() {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return loadFromStorage('mystart-theme', prefersDark ? 'dark' : 'light')
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [bookmarks, setBookmarks] = useState(() =>
    loadFromStorage('mystart-bookmarks', DEFAULT_BOOKMARKS),
  )

  // Whenever the theme changes, apply it to the page and remember it.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    saveToStorage('mystart-theme', theme)
  }, [theme])

  // Whenever the bookmarks change, remember them.
  useEffect(() => {
    saveToStorage('mystart-bookmarks', bookmarks)
  }, [bookmarks])

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  function addBookmark(name, url) {
    const newBookmark = { id: Date.now().toString(), name, url }
    setBookmarks([...bookmarks, newBookmark])
  }

  function deleteBookmark(id) {
    setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== id))
  }

  return (
    <div className="app">
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="main">
        <SearchBox />
        <Bookmarks bookmarks={bookmarks} onAdd={addBookmark} onDelete={deleteBookmark} />
        <TopSites />
      </main>

      <Footer />
    </div>
  )
}

export default App
