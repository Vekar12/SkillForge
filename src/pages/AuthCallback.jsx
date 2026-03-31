import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user, userLoading } = useApp()

  useEffect(() => {
    // Wait for auth processing to complete before redirecting
    if (userLoading) return

    if (user) {
      navigate('/skills', { replace: true })
    } else {
      // No token was processed (e.g. direct navigation without OAuth token)
      navigate('/login', { replace: true })
    }
  }, [user, userLoading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: '#0A84FF', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Signing you in...</p>
      </div>
    </div>
  )
}
