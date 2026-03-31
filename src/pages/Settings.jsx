import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Settings() {
  const navigate = useNavigate()
  const { groqKeySet, saveGroqKey } = useApp()
  const [groqKey, setGroqKey] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (groqKeySet) setSaved(true)
  }, [groqKeySet])

  async function handleSave() {
    if (saving) return
    setError('')
    if (!groqKey.trim()) return setError('Groq API key is required')
    setSaving(true)
    try {
      await saveGroqKey(groqKey.trim())
      setSaved(true)
      setTimeout(() => navigate('/'), 1000)
    } catch {
      setError('Failed to save Groq key. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Settings</h1>
      <p style={{ color: 'var(--text-3)', marginBottom: 32, fontSize: 14 }}>
        Saved to your browser only — never touches git.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>Groq API Key</label>
        <input
          type="password"
          value={groqKey}
          onChange={e => setGroqKey(e.target.value)}
          placeholder={groqKeySet ? 'Key already set — enter new key to change' : 'gsk_...'}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-3)',
            borderRadius: 8,
            padding: '10px 14px',
            color: 'var(--text-1)',
            fontSize: 14,
            outline: 'none',
          }}
        />
      </div>

      {error && <p style={{ color: '#F87171', fontSize: 13, marginTop: 12 }}>{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || saved}
        style={{
          marginTop: 24,
          background: saving ? '#4B5563' : saved ? '#16A34A' : '#6366F1',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: 14,
          cursor: saving || saved ? 'not-allowed' : 'pointer',
          width: '100%',
          opacity: saving || saved ? 0.8 : 1,
        }}
      >
        {saving ? 'Saving...' : saved ? 'Saved! Redirecting...' : 'Save & Continue'}
      </button>
    </div>
  )
}
