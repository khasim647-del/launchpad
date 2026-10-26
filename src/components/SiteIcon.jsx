import { useState } from 'react'
import { getDomain } from '../utils.js'

// Shows a website's icon. If the icon can't load, shows the site's first letter instead.
function SiteIcon({ name, url, size = 'large' }) {
  const [failed, setFailed] = useState(false)
  const iconUrl = `https://www.google.com/s2/favicons?domain=${getDomain(url)}&sz=64`

  return (
    <span className={`site-icon site-icon--${size}`} aria-hidden="true">
      {failed ? (
        name.charAt(0).toUpperCase()
      ) : (
        <img src={iconUrl} alt="" onError={() => setFailed(true)} />
      )}
    </span>
  )
}

export default SiteIcon
