import client from './client'

export const tasksApi = {
  // POST /api/task/complete — { taskId, skillId, day, type }
  complete(taskId, skillId, day, type) {
    return client.post('/api/task/complete', { taskId, skillId, day, type })
  },

}
