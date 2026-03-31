import client from './client'

export const assessmentApi = {
  // POST /api/assessment — { day, rawFeedback } (matches backend contract)
  // Note: GET /api/assessment/:skillId/:day does not exist on the backend
  submit(day, rawFeedback) {
    return client.post('/api/assessment', { day, rawFeedback })
  },
}
