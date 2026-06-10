// Ported 1:1 from frontend/src/api/api.js. Uses axios + JWT in localStorage,
// matching the CRA app's CSR auth posture. All callers must run client-side.
'use client';

import axios from 'axios';
import Swal from 'sweetalert2';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({ baseURL: API_BASE_URL });

// Request interceptor: attach JWT from localStorage if present.
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: centralized error handling.
// - 401: clear session and redirect to login (unless already on login or auth endpoint)
// - 403: toast "Access denied"
// - 5xx: toast "Server error"
// - Network error: toast "Connection lost"
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    const status = error.response?.status;
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    const isLoginPage = window.location.pathname === '/shop-login';

    if (status === 401 && !isAuthEndpoint && !isLoginPage) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
      window.location.href = '/shop-login';
      return Promise.reject(error);
    }

    if (status === 403) {
      Swal.fire({ icon: 'error', title: 'Access denied', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } else if (status >= 500) {
      Swal.fire({ icon: 'error', title: 'Server error, please try again', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } else if (!error.response) {
      Swal.fire({ icon: 'warning', title: 'Connection lost', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  googleAuth: (idToken) => api.post('/auth/google', { idToken }),
};

export const bookService = {
  getAll: (params = {}) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  getByCategory: (categoryId) => api.get('/books', { params: { categoryId } }),
  getMyBooks: () => api.get('/books'),
  getSimilar: (id) => api.get(`/books/${id}/similar`),
  getByMood: (mood) => api.get(`/books/mood/${mood}`),
  search: (query) => api.get('/books', { params: { q: query } }),
};

export const categoryService = {
  getAll: () => api.get('/categories'),
};

export const wishlistService = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (bookId) => api.post(`/wishlist/${bookId}`),
  removeFromWishlist: (bookId) => api.delete(`/wishlist/${bookId}`),
};

export const comparisonService = {
  getComparisonList: () => api.get('/comparison'),
  addToComparison: (bookId) => api.post(`/comparison/${bookId}`),
  removeFromComparison: (bookId) => api.delete(`/comparison/${bookId}`),
  clearComparison: () => api.delete('/comparison'),
};

export const userService = {
  getProfile: () => api.get('/profile'),
  updateProfile: (profileData) => api.put('/profile', profileData),
};

export const bookshelfService = {
  getAll: () => api.get('/bookshelves'),
  create: (data) => api.post('/bookshelves', data),
  update: (id, data) => api.put(`/bookshelves/${id}`, data),
  delete: (id) => api.delete(`/bookshelves/${id}`),
  reorder: (shelfIds) => api.post('/bookshelves/reorder', shelfIds),
  getBooks: (shelfId) => api.get(`/bookshelves/${shelfId}/books`),
  addBook: (shelfId, bookId) => api.post(`/bookshelves/${shelfId}/books/${bookId}`),
  removeBook: (shelfId, bookId) =>
    api.delete(`/bookshelves/${shelfId}/books/${bookId}`),
  updateBookStatus: (shelfId, bookId, status) => api.patch(`/bookshelves/${shelfId}/books/${bookId}/status`, null, { params: { status } }),
  updateBookNotes: (shelfId, bookId, notes) => api.patch(`/bookshelves/${shelfId}/books/${bookId}/notes`, { notes }),
};

export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (bookId, quantity = 1) => api.post(`/cart/${bookId}`, { quantity }),
  updateQuantity: (bookId, quantity) => api.put(`/cart/${bookId}`, { quantity }),
  removeFromCart: (bookId) => api.delete(`/cart/${bookId}`),
};

export const orderService = {
  checkout: (orderData) => api.post('/checkout', orderData),
  getUserOrders: () => api.get('/orders'),
  getHistory: () => api.get('/orders/history'),
  getById: (id) => api.get(`/orders/${id}`),
};

export const reviewService = {
  getByBookId: (bookId) => api.get(`/books/${bookId}/reviews`),
  addReview: (bookId, reviewData) => api.post(`/books/${bookId}/reviews`, reviewData),
};

export const dashboardService = {
  getDashboard: () => api.get('/dashboard'),
};

export const socialService = {
  follow: (userId) => api.post(`/social/follow/${userId}`),
  unfollow: (userId) => api.delete(`/social/follow/${userId}`),
  getFollowers: () => api.get('/social/followers'),
  getFollowing: () => api.get('/social/following'),
  search: (query) => api.get('/social/search', { params: { q: query } }),
  getFeed: () => api.get('/feed/following'),
  getDiscoverFeed: () => api.get('/feed/discover'),
};

export const readingRoomService = {
  create: (data) => api.post('/rooms', data),
  getAll: () => api.get('/rooms'),
  getMessages: (roomId) => api.get(`/rooms/${roomId}/messages`),
  postMessage: (roomId, content) => api.post(`/rooms/${roomId}/messages`, { content }),
};

export const adminBookService = {
  create: (data) => api.post('/admin/books', data),
  update: (id, data) => api.put(`/admin/books/${id}`, data),
  delete: (id) => api.delete(`/admin/books/${id}`),
};

export const adminCategoryService = {
  create: (data) => api.post('/admin/categories', data),
  update: (id, data) => api.put(`/admin/categories/${id}`, data),
  delete: (id) => api.delete(`/admin/categories/${id}`),
};

export const adminUserService = {
  getAll: (params) => api.get('/admin/users', { params }),
  ban: (userId) => api.post(`/admin/users/${userId}/ban`),
  unban: (userId) => api.post(`/admin/users/${userId}/unban`),
  warn: (userId, data) => api.post(`/admin/users/${userId}/warn`, data),
  getWarnings: (userId) => api.get(`/admin/users/${userId}/warnings`),
  changeRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  getDashboard: () => api.get('/admin/dashboard'),
};

export const adminOrderService = {
  updateStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
};

export const adminCouponService = {
  getAll: () => api.get('/admin/coupons'),
  create: (data) => api.post('/admin/coupons', data),
  update: (id, data) => api.put(`/admin/coupons/${id}`, data),
  delete: (id) => api.delete(`/admin/coupons/${id}`),
};

export const adminSecurityService = {
  getSummary: () => api.get('/admin/security/summary'),
  getEvents: (limit = 50) => api.get('/admin/security/events', { params: { limit } }),
};

export const exchangeService = {
  createListing: (data) => api.post('/exchange/listings', data),
  getListings: (params) => api.get('/exchange/listings', { params }),
  getMyListings: () => api.get('/exchange/listings/mine'),
  updateListing: (id, data) => api.put(`/exchange/listings/${id}`, data),
  deleteListing: (id) => api.delete(`/exchange/listings/${id}`),
  sendRequest: (listingId, data) => api.post(`/exchange/listings/${listingId}/request`, data),
  getIncoming: () => api.get('/exchange/requests/incoming'),
  getOutgoing: () => api.get('/exchange/requests/outgoing'),
  accept: (id) => api.put(`/exchange/requests/${id}/accept`),
  reject: (id) => api.put(`/exchange/requests/${id}/reject`),
  complete: (id) => api.put(`/exchange/requests/${id}/complete`),
  cancel: (id) => api.put(`/exchange/requests/${id}/cancel`),
  rate: (id, data) => api.post(`/exchange/requests/${id}/rate`, data),
  getTrustProfile: (userId) => api.get(`/exchange/ratings/${userId}`),
};

export const gamificationService = {
  getAchievements: () => api.get('/achievements'),
  getMyAchievements: () => api.get('/achievements/mine'),
  getChallenges: () => api.get('/challenges'),
  getMyChallenges: () => api.get('/challenges/mine'),
  joinChallenge: (id) => api.post(`/challenges/${id}/join`),
  getStreak: () => api.get('/streak'),
};

export const goalService = {
  getActiveGoal: () => api.get('/goals/active'),
  saveGoal: (targetCount, targetYear = new Date().getFullYear()) =>
    api.post('/goals', { targetYear, targetCount }),
};


export const notificationService = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const friendService = {
  sendRequest: (userId) => api.post(`/friends/request/${userId}`),
  acceptRequest: (requestId) => api.put(`/friends/request/${requestId}/accept`),
  rejectRequest: (requestId) => api.delete(`/friends/request/${requestId}`),
  getFriends: () => api.get('/friends'),
  getRequests: () => api.get('/friends/requests'),
};

export const aiService = {
  chat: (message) => api.post('/ai/chat', { message }),
  clearHistory: () => api.delete('/ai/chat'),
  semanticSearch: (query, limit) => api.get('/search/semantic', { params: { q: query, limit } }),
};

export const searchService = {
  textSearch: (params) => api.get('/books', { params }),
  semanticSearch: (query, limit = 10) => api.get('/search/semantic', { params: { q: query, limit } }),
  imageSearch: (file, limit = 10) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/search/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { limit },
    });
  },
};

export const addressService = {
  getAll: () => api.get('/addresses'),
  create: (data) => api.post('/addresses', data),
  delete: (id) => api.delete(`/addresses/${id}`),
};

export const couponService = {
  validate: (code, orderTotal) => api.post('/coupons/validate', { code, orderTotal }),
};

export const checkoutService = {
  checkout: (data) => api.post('/checkout', data),
};

export const uploadService = {
  image: (file) => { const fd = new FormData(); fd.append('file', file); return api.post('/upload/image', fd); },
  cover: (file) => { const fd = new FormData(); fd.append('file', file); return api.post('/upload/cover', fd); },
  pdf: (file) => { const fd = new FormData(); fd.append('file', file); return api.post('/upload/pdf', fd); },
};

export const blogService = {
  getAll: () => api.get('/blogs'),
  getMy: () => api.get('/blogs/my'),
  getById: (id) => api.get(`/blogs/${id}`),
  create: (data) => api.post('/blogs', data),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  delete: (id) => api.delete(`/blogs/${id}`),
  like: (id) => api.post(`/blogs/${id}/like`),
};

export const donationService = {
  create: (data) => api.post('/donations', data),
  getAvailable: (params = {}) => api.get('/donations', { params }),
  getById: (id) => api.get(`/donations/${id}`),
  request: (id, reason) => api.post(`/donations/${id}/request`, { reason }),
  getRequests: (id) => api.get(`/donations/${id}/requests`),
  approveRequest: (requestId) => api.post(`/donations/requests/${requestId}/approve`),
  getMyListings: () => api.get('/donations/my-listings'),
  getMyRequests: () => api.get('/donations/my-requests'),
};

export const reportService = {
  create: (data) => api.post('/reports', data),
  getPending: () => api.get('/admin/reports'),
  dismiss: (id) => api.post(`/admin/reports/${id}/dismiss`),
  action: (id) => api.post(`/admin/reports/${id}/action`),
};

export const reviewCommentService = {
  getByReviewId: (reviewId) => api.get(`/reviews/${reviewId}/comments`),
  create: (reviewId, data) => api.post(`/reviews/${reviewId}/comments`, data),
  delete: (commentId) => api.delete(`/reviews/comments/${commentId}`),
};

export const quoteService = {
  share: (bookId, payload) => api.post(`/books/${bookId}/quotes`, payload),
  getByBookId: (bookId) => api.get(`/books/${bookId}/quotes`),
};

export default api;
