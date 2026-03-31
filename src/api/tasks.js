import client from './client'

export const tasksApi = {
  // POST /api/task/complete — { taskId, skillId, day, type }
  complete(taskId, skillId, day, type) {
    return client.post('/api/task/complete', { taskId, skillId, day, type })
  },

  // GET /api/tasks/pending — all incomplete tasks across skills
  getPending() {
    return client.get('/api/tasks/pending')
  },

  // POST /api/tasks/carryover — carry incomplete tasks forward
  carryOver(skillId, day) {
    return client.post('/api/tasks/carryover', { skillId, day })
  },
}
