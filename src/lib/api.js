import axios from 'axios'

const BASE_URL = 'http://localhost:3000'

function getHeaders() {
  return {
    'x-groq-key': localStorage.getItem('sf_groq_key') || '',
  }
}

export function keysConfigured() {
  return !!localStorage.getItem('sf_groq_key')
}

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(config => {
  Object.assign(config.headers, getHeaders())
  return config
})

export default api
