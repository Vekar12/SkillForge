import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const TOKEN_KEY = 'sf_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

// Attach auth header on every request
client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Unwrap { data: ... } envelope + handle 401
client.interceptors.response.use(
  (response) => {
    // Backend wraps everything in { data: ... }
    // Return the inner data so callers get the payload directly
    return response.data?.data !== undefined ? response.data.data : response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
