import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/admin',
});

// Dynamically attach the Supabase access token to every request
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminApi = {
  // Analytics
  getAnalytics: () => api.get('/analytics').then(r => r.data),

  // Users
  getUsers: (q?: string) => api.get(`/users${q ? `?q=${q}` : ''}`).then(r => r.data),
  updateUserStatus: (id: string, data: { status: string; reason?: string }) =>
    api.post(`/users/${id}/status`, data).then(r => r.data),

  // Verifications
  getVerifications: () => api.get('/verifications').then(r => r.data),
  updateVerificationStatus: (id: string, data: { status: string; rejectionReason?: string }) =>
    api.post(`/verifications/${id}/status`, data).then(r => r.data),

  // Withdrawals
  getWithdrawals: (status?: string) => api.get(`/withdrawals${status ? `?status=${status}` : ''}`).then(r => r.data),
  processWithdrawal: (id: string, data: { status: string; rejectionReason?: string }) =>
    api.post(`/withdrawals/${id}/status`, data).then(r => r.data),

  // Disputes
  getDisputes: (status?: string) => api.get(`/disputes${status ? `?status=${status}` : ''}`).then(r => r.data),
  resolveDispute: (id: string, data: { resolutionSummary: string; action: 'refund' | 'release' }) =>
    api.post(`/disputes/${id}/resolve`, data).then(r => r.data),

  // Reports
  getReports: () => api.get('/reports').then(r => r.data),
  updateReportStatus: (id: string, data: { status: string; adminNotes?: string }) =>
    api.post(`/reports/${id}/status`, data).then(r => r.data),

  // Transactions
  getTransactions: (type?: string, status?: string) =>
    api.get(`/transactions${type || status ? `?${type ? `type=${type}` : ''}${type && status ? '&' : ''}${status ? `status=${status}` : ''}` : ''}`).then(r => r.data),
  getPayments: () => api.get('/payments').then(r => r.data),

  // Content Moderation
  getServices: () => api.get('/moderation/services').then(r => r.data),
  deleteService: (id: string) => api.delete(`/moderation/services/${id}`).then(r => r.data),
  getJobs: () => api.get('/moderation/jobs').then(r => r.data),
  deleteJob: (id: string) => api.delete(`/moderation/jobs/${id}`).then(r => r.data),

  // Config
  getConfigTable: (table: string) => api.get(`/config/${table}`).then(r => r.data),
  addConfigEntry: (table: string, data: any) => api.post(`/config/${table}`, data).then(r => r.data),
  updateConfigEntry: (table: string, id: string, data: any) =>
    api.put(`/config/${table}/${id}`, data).then(r => r.data),

  // Audit Logs
  getAuditLogs: (params?: { action?: string; adminId?: string; targetTable?: string; page?: string }) =>
    api.get('/audit/logs', { params }).then(r => r.data),
  getAuditLogDetail: (id: string) => api.get(`/audit/logs/${id}`).then(r => r.data),
  reverseAction: (id: string) => api.post(`/audit/logs/${id}/reverse`).then(r => r.data),
};
