import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { hasConfig } from '../firebase'

export default function Login() {
  const { user, loginWithGoogle } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/skills', { replace: true })
  }, [user])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#000' }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(10,132,255,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#0A84FF', letterSpacing: '-1px' }}>SkillForge</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Build real skills. One day at a time.</p>
        </div>

        <div className="rounded-3xl p-8" style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-xl font-bold mb-1" style={{ letterSpacing: '-0.3px' }}>Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Sign in to continue your learning streak</p>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 font-semibold transition-all active:scale-[0.98] hover:opacity-90"
            style={{ height: '52px', borderRadius: '14px', background: '#fff', color: '#000', fontSize: '15px', border: 'none', cursor: 'pointer' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {!hasConfig && (
            <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Demo mode — Firebase not configured
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
