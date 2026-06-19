import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// API endpoints
export const endpoints = {
  bars: '/bars',
  distilleries: '/distilleries',
  events: '/events',
  blogs: '/blogs',
  homepage: '/homepage',
  orders: '/orders',
  platformConfig: '/platform-config',
  customers: '/customers',
}

// API functions
export const apiService = {
  // Bars
  getBars: (params?: any) => api.get(endpoints.bars, { params }),
  getBar: (id: number) => api.get(`${endpoints.bars}/${id}`),
  
  // Distilleries
  getDistilleries: (params?: any) => api.get(endpoints.distilleries, { params }),
  getDistillery: (id: number) => api.get(`${endpoints.distilleries}/${id}`),
  
  // Events
  getEvents: (params?: any) => api.get(endpoints.events, { params }),
  getEvent: (id: number) => api.get(`${endpoints.events}/${id}`),
  
  // Blogs
  getBlogs: (params?: any) => api.get(endpoints.blogs, { params }),
  getBlog: (id: number) => api.get(`${endpoints.blogs}/${id}`),
  
  // Homepage
  getHomepageContent: () => api.get(endpoints.homepage),
  
  // Orders
  createOrder: (orderData: any) => api.post(endpoints.orders, orderData),
  getMyOrders: () => api.get(`${endpoints.orders}/my-orders`),
  getOrder: (id: number) => api.get(`${endpoints.orders}/${id}`),
  // Customer-scoped — the JWT identifies the caller
  getMyCustomerOrders: () => api.get(`${endpoints.orders}/customer/mine`),
  getMyCustomerOrder: (id: number) => api.get(`${endpoints.orders}/customer/mine/${id}`),
  
  // Customer Auth
  loginCustomer: (email: string, password: string) => api.post(`${endpoints.customers}/login`, { email, password }),
  signupCustomer: (data: any) => api.post(`${endpoints.customers}/signup`, data),
  setAuthToken: (token: string) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  },
  updateCustomerProfile: (id: number, data: any) => api.patch(`${endpoints.customers}/${id}`, data),
  getCustomerProfile: (id: number) => api.get(`${endpoints.customers}/${id}`),
  
  // Platform Config (Categories, How It Works, Business Types, etc.)
  getCategories: () => api.get(`${endpoints.platformConfig}/categories`),
  getHowItWorks: () => api.get(`${endpoints.platformConfig}/how-it-works`),
  getBusinessTypes: () => api.get(`${endpoints.platformConfig}/business-types`),
  getExperienceTypes: () => api.get(`${endpoints.platformConfig}/experience-types`),
  getCurrencies: () => api.get(`${endpoints.platformConfig}/currencies`),
}

export default api
