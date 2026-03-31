import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useApp } from '../context/AppContext'

export default function Login() {
  const { user, loginWithGoogle } = useApp()
  const navigate = useNavigate()
  const hasClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (user) navigate('/skills', { replace: true })
  }, [user, navigate])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: 'var(--bg)' }}>
      <div style={{ position: 'absolute', top: '33%', left: '50%', transform: 'translate(-50%, -50%)', width: 384, height: 384, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-1px', color: '#3B82F6', margin: '0 0 8px' }}>SkillForge</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0 }}>Build real skills. One day at a time.</p>
        </div>
        <div style={{ borderRadius: 24, padding: 32, background: 'var(--surface-2)', border: '1px solid var(--border-3)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.3px' }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '0 0 32px' }}>Sign in to continue your learning</p>
          {hasClientId ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={cr => loginWithGoogle(cr.credential)}
                onError={() => console.error('Google Sign-In failed')}
                theme="filled_black" shape="rectangular" size="large" text="continue_with" width="296"
              />
            </div>
          ) : (
            <>
              <button
                onClick={() => loginWithGoogle(null)}
                style={{ width: '100%', height: 52, borderRadius: 14, background: '#fff', color: '#000', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-6)', marginTop: 14 }}>Demo mode — set VITE_GOOGLE_CLIENT_ID to enable real sign-in</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
