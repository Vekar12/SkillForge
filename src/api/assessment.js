import client from './client'

export const assessmentApi = {
  // GET /api/assessment/:skillId/:day
  get(skillId, day) {
    return client.get(`/api/assessment/${skillId}/${day}`)
  },

  // POST /api/assessment — submit assessment feedback
  submit(skillId, day, feedback) {
    return client.post('/api/assessment', { skillId, day, feedback })
  },
}
