import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Header() {
  const { user, logout, groqKey, setGroqKey } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [showGroqInput, setShowGroqInput] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showKeyEdit, setShowKeyEdit] = useState(false)

  const handleSaveKey = () => {
    if (keyInput.trim()) {
      setGroqKey(keyInput.trim())
      setKeyInput('')
      setShowGroqInput(false)
      setShowKeyEdit(false)
    }
  }

  const isHome = location.pathname === '/' || location.pathname === '/skills'

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:px-8"
        style={{
          height: '56px',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate('/skills')}
          className="text-base font-bold transition-opacity hover:opacity-70"
          style={{ color: '#0A84FF', letterSpacing: '-0.3px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          SkillForge
        </button>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Groq key indicator */}
          {groqKey ? (
            <button
              onClick={() => setShowKeyEdit(!showKeyEdit)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
              style={{ background: 'rgba(48,209,88,0.12)', color: '#30D158', border: '1px solid rgba(48,209,88,0.2)', cursor: 'pointer' }}
            >
              <span>●</span> Groq Connected
            </button>
          ) : (
            <button
              onClick={() => setShowGroqInput(!showGroqInput)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
              style={{ background: 'rgba(255,159,10,0.12)', color: '#FF9F0A', border: '1px solid rgba(255,159,10,0.2)', cursor: 'pointer' }}
            >
              <span>⚠</span> Add Groq Key
            </button>
          )}

          {/* Avatar */}
          {user && (
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-opacity hover:opacity-80"
              style={{ background: '#0A84FF', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              {user.avatar}
            </button>
          )}
        </div>

        {/* User dropdown */}
        {showUserMenu && (
          <div
            className="absolute top-14 right-4 rounded-2xl p-1 min-w-48 z-50"
            style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{user.email}</p>
            </div>
            <button
              onClick={() => { setShowGroqInput(true); setShowUserMenu(false) }}
              className="w-full text-left px-3 py-2 text-sm rounded-xl transition-all hover:bg-white/5"
              style={{ color: groqKey ? '#30D158' : '#FF9F0A', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {groqKey ? '🔑 Change Groq Key' : '🔑 Add Groq Key'}
            </button>
            <button
              onClick={() => { logout(); setShowUserMenu(false) }}
              className="w-full text-left px-3 py-2 text-sm rounded-xl transition-all hover:bg-white/5"
              style={{ color: '#FF453A', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Groq Key Banner */}
      {(showGroqInput || showKeyEdit) && (
        <div
          className="fixed top-14 left-0 right-0 z-40 px-4 py-3"
          style={{ background: '#1C1C1E', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
              {showKeyEdit ? 'CHANGE GROQ API KEY' : 'ADD GROQ API KEY'}
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                placeholder="gsk_••••••••••••••••••••••••••••••••"
                className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ background: '#2C2C2E', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                autoFocus
              />
              <button
                onClick={handleSaveKey}
                disabled={!keyInput.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: keyInput.trim() ? '#0A84FF' : 'rgba(255,255,255,0.06)', color: keyInput.trim() ? '#fff' : 'rgba(255,255,255,0.25)', border: 'none', cursor: keyInput.trim() ? 'pointer' : 'not-allowed' }}
              >
                Save
              </button>
              <button
                onClick={() => { setShowGroqInput(false); setShowKeyEdit(false); setKeyInput('') }}
                className="px-3 py-2 rounded-xl text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Get your free key at console.groq.com · Saved locally, never sent to any server
            </p>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {(showUserMenu || showGroqInput || showKeyEdit) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => { setShowUserMenu(false); setShowGroqInput(false); setShowKeyEdit(false); setKeyInput('') }}
        />
      )}
    </>
  )
}
