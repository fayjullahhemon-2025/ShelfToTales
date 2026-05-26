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
};

export const categoryService = {
  getAll: () => api.get('/categories'),
};

export const wishlistService = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (bookId) => api.post(`/wishlist/${bookId}`),
  removeFromWishlist: (bookId) => api.delete(`/wishlist/${bookId}`),
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
};

export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (bookId, quantity = 1) => api.post(`/cart/${bookId}`, { quantity }),
  updateQuantity: (bookId, quantity) => api.put(`/cart/${bookId}`, { quantity }),
  removeFromCart: (bookId) => api.delete(`/cart/${bookId}`),
};

export const orderService = {
  checkout: (orderData) => api.post('/orders', orderData),
  getUserOrders: () => api.get('/orders'),
  getHistory: () => api.get('/orders/history'),
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
  getFeed: () => api.get('/social/feed'),
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

export default api;
