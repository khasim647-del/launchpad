import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID } from '../api.js'

// Load Google's sign-in script once, the first time a button needs it.
let googleScript
function loadGoogleScript() {
  googleScript ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve(window.google)
    script.onerror = () => {
      googleScript = undefined
      reject(new Error('Could not load Google sign-in.'))
    }
    document.head.append(script)
  })
  return googleScript
}

// Google's official "Sign in with Google" button.
function GoogleSignInButton({ theme, onCredential }) {
  const containerRef = useRef(null)
  const onCredentialRef = useRef(onCredential)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    onCredentialRef.current = onCredential
  })

  useEffect(() => {
    let cancelled = false
    loadGoogleScript()
      .then((google) => {
        if (cancelled) return
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onCredentialRef.current(response.credential),
        })
        google.accounts.id.renderButton(containerRef.current, {
          theme: theme === 'dark' ? 'filled_black' : 'outline',
          size: 'medium',
          shape: 'pill',
          text: 'signin_with',
        })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [theme])

  if (failed) return <span className="account-note">Sign-in unavailable</span>
  return <div ref={containerRef} className="google-button" />
}

export default GoogleSignInButton
