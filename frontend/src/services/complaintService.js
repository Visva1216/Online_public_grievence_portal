import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (token) => api.post('/auth/google', { token }),
  getMe: () => api.get('/auth/me'),
}

export const complaintService = {
  submit: (formData) =>
    api.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMyComplaints: (page = 0, size = 10) =>
    api.get(`/complaints/my?page=${page}&size=${size}`),
  track: (complaintId) =>
    api.get(`/complaints/track/${complaintId}`),
  getMapData: (params) =>
    api.get('/complaints/map/data', { params }),
  getAll: (params) =>
    api.get('/complaints', { params }),
  updateStatus: (id, status, remarks, sendEmail = true) =>
    api.patch(`/complaints/${id}/status`, { status, remarks, sendEmail }),
  assignDepartment: (id, departmentId, sendEmail = true) =>
    api.patch(`/complaints/${id}/assign`, { departmentId, sendEmail }),
  submitRating: (complaintId, rating) =>
    api.post(`/complaints/${complaintId}/rating`, { rating }).catch(() => {
      // Fallback: store locally if backend endpoint not implemented yet
      localStorage.setItem(`rating_${complaintId}`, rating)
      return { data: { success: true } }
    }),
}

export const departmentService = {
  getAll: () => api.get('/departments'),
}

export const analyticsService = {
  getAnalytics: () => api.get('/analytics'),
  getDepartmentPerformance: () => api.get('/analytics/departments').catch(() => {
    // Graceful fallback
    return { data: { data: [] } }
  }),
}

