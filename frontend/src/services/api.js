import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach authorization token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 responses to auto-logout on expired session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data)
};

// Amenities APIs
export const amenitiesApi = {
  getAmenities: (params) => api.get('/amenities', { params }),
  getAmenityById: (id) => api.get(`/amenities/${id}`),
  createAmenity: (data) => api.post('/amenities', data),
  updateAmenity: (id, data) => api.put(`/amenities/${id}`, data),
  deleteAmenity: (id) => api.delete(`/amenities/${id}`),
  toggleSave: (id) => api.post(`/amenities/${id}/save`),
  getSavedAmenities: () => api.get('/amenities/saved')
};

// Subscriptions APIs
export const subscriptionsApi = {
  createSubscription: (data) => api.post('/subscriptions', data),
  getUserSubscriptions: () => api.get('/subscriptions'),
  getSubscriptionById: (id) => api.get(`/subscriptions/${id}`),
  cancelSubscription: (id) => api.patch(`/subscriptions/${id}/cancel`)
};

// Payments APIs
export const paymentsApi = {
  verifyPayment: (data) => api.post('/payments/verify', data),
  getPaymentHistory: () => api.get('/payments/history')
};

// Reviews APIs
export const reviewsApi = {
  getReviews: (amenityId) => api.get(`/amenities/${amenityId}/reviews`),
  createReview: (amenityId, data) => api.post(`/amenities/${amenityId}/reviews`, data)
};

// Provider APIs
export const providerApi = {
  getStats: () => api.get('/provider/stats'),
  getListings: () => api.get('/provider/listings'),
  getSubscriptions: () => api.get('/provider/subscriptions'),
  getPayments: () => api.get('/provider/payments'),
  toggleAvailability: (id) => api.patch(`/provider/listings/${id}/availability`),
  addPlan: (amenityId, data) => api.post(`/provider/listings/${amenityId}/plans`, data),
  deletePlan: (planId) => api.delete(`/provider/plans/${planId}`),
  replyReview: (reviewId, reply) => api.post(`/provider/reviews/${reviewId}/reply`, { reply })
};

// Admin APIs
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getAmenities: (params) => api.get('/admin/amenities', { params }),
  updateApproval: (id, status, remarks) => api.patch(`/admin/amenities/${id}/approval`, { status, remarks }),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/status`),
  getReviews: () => api.get('/admin/reviews'),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  triggerRenewalCron: () => api.post('/admin/trigger-renewal-reminders')
};

// Notifications APIs
export const notificationsApi = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all')
};

export default api;
