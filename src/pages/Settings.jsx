import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const navigate = useNavigate()
  const [groqKey, setGroqKey] = useState('')
  const [sheetId, setSheetId] = useState('')
  const [serviceAccountJson, setServiceAccountJson] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setGroqKey(localStorage.getItem('sf_groq_key') || '')
    setSheetId(localStorage.getItem('sf_sheet_id') || '')
    setServiceAccountJson(localStorage.getItem('sf_service_account_json') || '')
  }, [])

  function handleSave() {
    setError('')

    if (!groqKey.trim()) return setError('Groq API key is required')
    if (!sheetId.trim()) return setError('Spreadsheet ID is required')
    if (!serviceAccountJson.trim()) return setError('Service account JSON is required')

    try {
      JSON.parse(serviceAccountJson)
    } catch {
      return setError('Service account JSON is not valid JSON')
    }

    localStorage.setItem('sf_groq_key', groqKey.trim())
    localStorage.setItem('sf_sheet_id', sheetId.trim())
    localStorage.setItem('sf_service_account_json', serviceAccountJson.trim())

    setSaved(true)
    setTimeout(() => navigate('/'), 1000)
  }

  function handleClear() {
    localStorage.removeItem('sf_groq_key')
    localStorage.removeItem('sf_sheet_id')
    localStorage.removeItem('sf_service_account_json')
    setGroqKey('')
    setSheetId('')
    setServiceAccountJson('')
    setSaved(false)
  }

  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Settings</h1>
      <p style={{ color: '#9CA3AF', marginBottom: 32, fontSize: 14 }}>
        Keys are saved to your browser only — never sent to git or any server except your own backend.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field
          label="Groq API Key"
          placeholder="gsk_..."
          value={groqKey}
          onChange={setGroqKey}
          type="password"
        />
        <Field
          label="Google Spreadsheet ID"
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
          value={sheetId}
          onChange={setSheetId}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, color: '#D1D5DB', fontWeight: 500 }}>
            Google Service Account JSON
          </label>
          <textarea
            rows={6}
            value={serviceAccountJson}
            onChange={e => setServiceAccountJson(e.target.value)}
            placeholder='{"type":"service_account","project_id":"..."}'
            style={{
              background: '#1A1A1A',
              border: '1px solid #2D2D2D',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#F9FAFB',
              fontSize: 12,
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
        </div>
      </div>

      {error && (
        <p style={{ color: '#F87171', fontSize: 13, marginTop: 16 }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          onClick={handleSave}
          style={{
            background: saved ? '#16A34A' : '#6366F1',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {saved ? 'Saved! Redirecting...' : 'Save & Continue'}
        </button>
        <button
          onClick={handleClear}
          style={{
            background: 'transparent',
            color: '#9CA3AF',
            border: '1px solid #2D2D2D',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Clear All
        </button>
      </div>
    </div>
  )
}

function Field({ label, placeholder, value, onChange, type = 'text' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, color: '#D1D5DB', fontWeight: 500 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: '#1A1A1A',
          border: '1px solid #2D2D2D',
          borderRadius: 8,
          padding: '10px 14px',
          color: '#F9FAFB',
          fontSize: 14,
          outline: 'none',
        }}
      />
    </div>
  )
}
