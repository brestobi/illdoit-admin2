import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/_/backend/api/admin',
});

// Add interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('supabase.auth.token'); // Adjust based on your auth implementation
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminApi = {
  getAnalytics: () => api.get('/analytics').then(res => res.data),
  getUsers: (query?: string) => api.get(`/users${query ? `?q=${query}` : ''}`).then(res => res.data),
  updateUserStatus: (id: string, data: { status: string, reason?: string }) => 
    api.post(`/users/${id}/status`, data).then(res => res.data),
  // Add other endpoints as needed...
};
