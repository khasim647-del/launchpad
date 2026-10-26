import GoogleSignInButton from './GoogleSignInButton.jsx'

// The top bar: logo, app name, sign-in and the dark mode switch.
function Header({ theme, onToggleTheme, accountsEnabled, user, onSignIn, onSignOut }) {
  const isDark = theme === 'dark'

  return (
    <header className="header">
      <div className="logo">
        <svg className="logo-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3h10a2 2 0 0 1 2 2v16l-7-4-7 4V5a2 2 0 0 1 2-2z" />
        </svg>
        <span className="logo-text">Launchpad</span>
      </div>

      <div className="header-actions">
        {accountsEnabled &&
          (user ? (
            <div className="account">
              {user.pictureUrl && (
                <img className="account-avatar" src={user.pictureUrl} alt="" referrerPolicy="no-referrer" />
              )}
              <span className="account-name" title={user.email}>
                {user.name.split(' ')[0]}
              </span>
              <button type="button" className="button button--ghost account-signout" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          ) : (
            <GoogleSignInButton theme={theme} onCredential={onSignIn} />
          ))}

        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={isDark}
        >
          <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
          <span className="theme-toggle-text">{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  )
}

export default Header
