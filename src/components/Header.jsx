// The top bar: logo, app name and the dark mode switch.
function Header({ theme, onToggleTheme }) {
  const isDark = theme === 'dark'

  return (
    <header className="header">
      <div className="logo">
        <svg className="logo-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3h10a2 2 0 0 1 2 2v16l-7-4-7 4V5a2 2 0 0 1 2-2z" />
        </svg>
        <span className="logo-text">Launchpad</span>
      </div>

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
    </header>
  )
}

export default Header
