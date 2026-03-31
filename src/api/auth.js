import client, { setToken, clearToken, getToken } from './client'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const auth = {
  // Redirect browser to Google OAuth
  loginWithGoogle() {
    window.location.href = `${BASE_URL}/auth/google`
  },

  // Called on /auth/callback?token=<jwt>
  handleCallback(token) {
    setToken(token)
  },

  // GET /auth/me — returns { name, email, avatar, uid, isAdmin }
  async getMe() {
    return client.get('/auth/me')
  },

  logout() {
    clearToken()
    localStorage.removeItem('sf_user')
    window.location.href = '/login'
  },

  isLoggedIn() {
    return !!getToken()
  },
}
