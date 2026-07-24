import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    api.post('/api/auth/register', data),
  refresh: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data: any) => api.put('/api/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/api/auth/change-password', data),
};

// Customer API
export const customerApi = {
  getAll: (params?: any) => api.get('/api/customers', { params }),
  getById: (id: string) => api.get(`/api/customers/${id}`),
  create: (data: any) => api.post('/api/customers', data),
  update: (id: string, data: any) => api.put(`/api/customers/${id}`, data),
  delete: (id: string) => api.delete(`/api/customers/${id}`),
};

// Policy API
export const policyApi = {
  getAll: (params?: any) => api.get('/api/policies', { params }),
  getById: (id: string) => api.get(`/api/policies/${id}`),
  create: (data: any) => api.post('/api/policies', data),
  update: (id: string, data: any) => api.put(`/api/policies/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/api/policies/${id}/status`, { status }),
  renew: (id: string, data: { newEndDate: string; newTenure: number }) =>
    api.post(`/api/policies/${id}/renew`, data),
  cancel: (id: string, reason?: string) =>
    api.post(`/api/policies/${id}/cancel`, { reason }),
  getExpiring: (days?: number) => api.get('/api/policies/expiring', { params: { days } }),
};

// Claim API
export const claimApi = {
  getAll: (params?: any) => api.get('/api/claims', { params }),
  getById: (id: string) => api.get(`/api/claims/${id}`),
  create: (data: any) => api.post('/api/claims', data),
  updateStatus: (id: string, data: { status: string; reviewNotes?: string; approvedAmount?: number }) =>
    api.patch(`/api/claims/${id}/status`, data),
};

// Premium API
export const premiumApi = {
  getAll: (params?: any) => api.get('/api/premiums', { params }),
  getById: (id: string) => api.get(`/api/premiums/${id}`),
  create: (data: any) => api.post('/api/premiums', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/api/premiums/${id}/status`, { status }),
  getOverdue: () => api.get('/api/premiums/overdue'),
  getSummary: (params?: any) => api.get('/api/premiums/summary', { params }),
};

// Document API
export const documentApi = {
  getAll: (params?: any) => api.get('/api/documents', { params }),
  getById: (id: string) => api.get(`/api/documents/${id}`),
  upload: (formData: FormData) =>
    api.post('/api/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/api/documents/${id}`),
  verify: (id: string) => api.patch(`/api/documents/${id}/verify`),
  getDownloadUrl: (id: string) => api.get(`/api/documents/${id}/download`),
};

// Dashboard API
export const dashboardApi = {
  getOverview: () => api.get('/api/dashboard'),
  getCustomerDashboard: () => api.get('/api/dashboard/customer'),
  getRevenue: (params?: any) => api.get('/api/dashboard/revenue', { params }),
  getPolicyDistribution: () => api.get('/api/dashboard/policy-distribution'),
  getClaimStatistics: () => api.get('/api/dashboard/claim-statistics'),
  getExpiringPolicies: (days?: number) =>
    api.get('/api/dashboard/expiring-policies', { params: { days } }),
};
