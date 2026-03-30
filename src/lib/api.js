import axios from 'axios'

const BASE_URL = 'http://localhost:3000'

function getHeaders() {
  return {
    'x-groq-key': localStorage.getItem('sf_groq_key') || '',
    'x-sheet-id': localStorage.getItem('sf_sheet_id') || '',
    'x-service-account': localStorage.getItem('sf_service_account_json') || '',
  }
}

export function keysConfigured() {
  return !!(
    localStorage.getItem('sf_groq_key') &&
    localStorage.getItem('sf_sheet_id') &&
    localStorage.getItem('sf_service_account_json')
  )
}

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(config => {
  Object.assign(config.headers, getHeaders())
  return config
})

export default api
