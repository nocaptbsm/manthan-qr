import { createClient } from '@/lib/supabase/client';
import type { ApiResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }
  
  return { 'Content-Type': 'application/json' };
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'An error occurred');
  }
  
  return data;
}

export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    signup: (data: Record<string, unknown>) =>
      request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    forgotPassword: (email: string) =>
      request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    logout: () =>
      request('/auth/logout', { method: 'POST' }),
    me: () =>
      request('/auth/me'),
  },

  // Dashboard
  dashboard: {
    getStats: () =>
      request('/admin/dashboard'),
  },

  // Sessions
  sessions: {
    getAll: (page = 1, limit = 20, status?: string) =>
      request(`/sessions?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`),
    getById: (id: string) =>
      request(`/sessions/${id}`),
    create: (data: Record<string, unknown>) =>
      request('/sessions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/sessions/${id}`, { method: 'DELETE' }),
    start: (id: string) =>
      request(`/sessions/${id}/start`, { method: 'POST' }),
    end: (id: string) =>
      request(`/sessions/${id}/end`, { method: 'POST' }),
  },

  // Attendance
  attendance: {
    mark: (token: string) =>
      request('/attendance/mark', { method: 'POST', body: JSON.stringify({ token }) }),
    getMy: (page = 1, limit = 20) =>
      request(`/attendance/my?page=${page}&limit=${limit}`),
    getSession: (sessionId: string, page = 1, limit = 20) =>
      request(`/attendance/session/${sessionId}?page=${page}&limit=${limit}`),
    getStats: () =>
      request('/attendance/stats'),
  },

  // Students
  students: {
    getAll: (page = 1, limit = 20, search?: string) =>
      request(`/students?page=${page}&limit=${limit}${search ? `&search=${search}` : ''}`),
    getById: (id: string) =>
      request(`/students/${id}`),
    getStats: (id: string) =>
      request(`/students/${id}/stats`),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Devices
  devices: {
    getAll: () =>
      request('/device'),
    getById: (id: string) =>
      request(`/device/${id}`),
    register: (data: Record<string, unknown>) =>
      request('/device/register', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (deviceId: string, isActive: boolean) =>
      request(`/device/status?device_id=${deviceId}`, { method: 'POST', body: JSON.stringify({ is_active: isActive }) }),
    getCurrentToken: (deviceCode: string, deviceSecret: string) =>
      fetch(`${API_BASE}/device/current-token`, {
        headers: {
          'X-Device-Code': deviceCode,
          'X-Device-Secret': deviceSecret,
        },
      }).then(r => r.json()),
  },

  // Reports
  reports: {
    student: (id: string, format = 'json', startDate?: string, endDate?: string) =>
      request(`/reports/student/${id}?format=${format}${startDate ? `&start_date=${startDate}` : ''}${endDate ? `&end_date=${endDate}` : ''}`),
    daily: (date?: string, format = 'json') =>
      request(`/reports/daily?format=${format}${date ? `&date=${date}` : ''}`),
    monthly: (year?: number, month?: number, format = 'json') =>
      request(`/reports/monthly?format=${format}${year ? `&year=${year}` : ''}${month ? `&month=${month}` : ''}`),
    session: (id: string, format = 'json') =>
      request(`/reports/session/${id}?format=${format}`),
    device: (id: string) =>
      request(`/reports/device/${id}`),
  },

  // Admin
  admin: {
    getUsers: (page = 1, limit = 20, role?: string, search?: string) =>
      request(`/admin/users?page=${page}&limit=${limit}${role ? `&role=${role}` : ''}${search ? `&search=${search}` : ''}`),
    updateUser: (id: string, data: Record<string, unknown>) =>
      request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteUser: (id: string) =>
      request(`/admin/users/${id}`, { method: 'DELETE' }),
    getAuditLogs: (page = 1, limit = 50, action?: string) =>
      request(`/admin/audit-logs?page=${page}&limit=${limit}${action ? `&action=${action}` : ''}`),
  },
};
