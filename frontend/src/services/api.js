import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'https://auction-platform-production-579c.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh & errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          localStorage.setItem('token', data.token);
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    if (error.response?.status !== 401) {
      if (!error.response) toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// =================== AUTH ===================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
};

// =================== AUCTIONS ===================
export const auctionAPI = {
  getAll: (params) => api.get('/auctions', { params }),
  getFeatured: () => api.get('/auctions/featured'),
  getOne: (id) => api.get(`/auctions/${id}`),
  create: (data) => api.post('/auctions', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/auctions/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/auctions/${id}`),
  placeBid: (id, data) => api.post(`/auctions/${id}/bid`, data),
  getBids: (id, params) => api.get(`/auctions/${id}/bids`, { params }),
  getRecommendation: (id) => api.get(`/auctions/${id}/recommendation`),
  end: (id) => api.post(`/auctions/${id}/end`),
  addToWatchlist: (id) => api.post(`/auctions/${id}/watchlist`),
  removeFromWatchlist: (id) => api.delete(`/auctions/${id}/watchlist`),
};

// =================== USERS ===================
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/users/change-password', data),
  getBids: (params) => api.get('/users/bids', { params }),
  getWins: () => api.get('/users/wins'),
  getWatchlist: () => api.get('/users/watchlist'),
};

// =================== SELLERS ===================
export const sellerAPI = {
  getProfile: (id) => api.get(`/sellers/${id}`),
  updateProfile: (data) => api.put('/sellers/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDashboard: () => api.get('/sellers/dashboard/stats'),
  getMyAuctions: (params) => api.get('/sellers/my/auctions', { params }),
  submitVerification: (data) => api.post('/sellers/verification', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getReviews: (id, params) => api.get(`/sellers/${id}/reviews`, { params }),
};

// =================== NOTIFICATIONS ===================
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

// =================== PAYMENTS ===================
export const paymentAPI = {
  createIntent: (data) => api.post('/payments/create-intent', data),
  confirm: (data) => api.post('/payments/confirm', data),
  getHistory: () => api.get('/payments/history'),
};

// =================== REVIEWS ===================
export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  getSellerReviews: (sellerId, params) => api.get(`/reviews/seller/${sellerId}`, { params }),
};

// =================== ADMIN ===================
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  banUser: (id, data) => api.put(`/admin/users/${id}/ban`, data),
  verifySeller: (id, data) => api.put(`/admin/sellers/${id}/verify`, data),
  getAuctions: (params) => api.get('/admin/auctions', { params }),
};

// =================== CHAT ===================
export const chatAPI = {
  getMessages: (auctionId, recipientId) => api.get(`/chat/${auctionId}/${recipientId}`),
  getConversations: () => api.get('/chat/conversations/list'),
};

// =================== ANALYTICS ===================
export const analyticsAPI = {
  getStats: () => api.get('/analytics/stats'),
  getSeller: () => api.get('/analytics/seller'),
  getAdmin: () => api.get('/analytics/admin'),
};

export default api;
