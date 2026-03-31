import client from './client'

export const skillsApi = {
  // GET /api/skills → list of enrolled skills
  list() {
    return client.get('/api/skills')
  },

  // GET /api/skills/:skillId/roadmap
  getRoadmap(skillId) {
    return client.get(`/api/skills/${skillId}/roadmap`)
  },

  // GET /api/skills/:skillId/day/:day
  getDayData(skillId, day) {
    return client.get(`/api/skills/${skillId}/day/${day}`)
  },
}
