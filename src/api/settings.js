import client from './client'

export const settingsApi = {
  // GET /api/settings → { groqKeySet: true/false }
  get() {
    return client.get('/api/settings')
  },

  // POST /api/settings/groq-key — save Groq key server-side (encrypted)
  saveGroqKey(key) {
    return client.post('/api/settings/groq-key', { key })
  },
}
