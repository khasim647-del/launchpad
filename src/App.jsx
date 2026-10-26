import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import SearchBox from './components/SearchBox.jsx'
import Bookmarks from './components/Bookmarks.jsx'
import SearchHistory from './components/SearchHistory.jsx'
import TopSites from './components/TopSites.jsx'
import Footer from './components/Footer.jsx'
import { DEFAULT_BOOKMARKS } from './data.js'
import { accountsEnabled } from './api.js'
import { useAccount } from './useAccount.js'
import { buildSearchUrl, loadFromStorage, saveToStorage } from './utils.js'

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
  const account = useAccount()

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

  function searchAgain(engine, query) {
    window.open(buildSearchUrl(engine, query), '_blank', 'noopener,noreferrer')
    account.recordSearch(engine, query)
  }

  return (
    <div className="app">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        accountsEnabled={accountsEnabled}
        user={account.user}
        onSignIn={account.signIn}
        onSignOut={account.signOut}
      />

      {account.error && (
        <div className="account-error" role="alert">
          <span>{account.error}</span>
          <button type="button" className="button button--ghost" onClick={account.dismissError}>
            Dismiss
          </button>
        </div>
      )}

      <main className="main">
        <SearchBox onSearch={account.recordSearch} />
        <Bookmarks bookmarks={bookmarks} onAdd={addBookmark} onDelete={deleteBookmark} />

        {account.user && (
          <>
            <Bookmarks
              id="private"
              title="🔒 My private bookmarks"
              note="Only you can see these. They follow your Google account to any device."
              emptyMessage="Nothing here yet. Add websites only you should see."
              bookmarks={account.privateLinks}
              onAdd={account.addPrivateLink}
              onDelete={account.deletePrivateLink}
            />
            <SearchHistory
              history={account.history}
              onSearchAgain={searchAgain}
              onDelete={account.deleteSearch}
              onClear={account.clearHistory}
            />
          </>
        )}

        {accountsEnabled && !account.user && (
          <p className="empty-message">
            Sign in with Google to get your own private bookmarks and search history.
          </p>
        )}

        <TopSites />
      </main>

      <Footer />
    </div>
  )
}

export default App
