import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user } = useApp()

  useEffect(() => {
    // AppContext handles token extraction from URL
    // Once user is set, redirect to skills
    const timer = setTimeout(() => {
      navigate('/', { replace: true })
    }, 500)
    return () => clearTimeout(timer)
  }, [user])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: '#0A84FF', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Signing you in...</p>
      </div>
    </div>
  )
}
