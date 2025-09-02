import axios from 'axios';
import { ApiResponse } from '../types/api';

const API_BASE_URL = 'http://localhost:3030';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  // Container endpoints
  containers: {
    getAll: () => api.get<ApiResponse>('/container/all'),
    getById: (id: number) => api.get<ApiResponse>(`/container/${id}`),
    create: (data: any) => api.post<ApiResponse>('/container/create', data),
    update: (id: number, data: any) => api.put<ApiResponse>(`/container/update/${id}`, data),
    delete: (id: number) => api.post<ApiResponse>(`/container/delete/${id}`, { id }),
    getLockers: (boardId: string) => api.get<ApiResponse>(`/container/lockers/${boardId}`),
  },
  
  // Locker endpoints
  lockers: {
    getStatus: (lockerNumber?: string) => 
      api.get<ApiResponse>('/lockers/status', { params: { lockerNumber } }),
    create: (data: any) => api.post<ApiResponse>('/lockers/create', data),
    update: (id: number, data: any) => api.put<ApiResponse>(`/lockers/update/${id}`, data),
    delete: (id: number) => api.delete<ApiResponse>(`/lockers/delete/${id}`),
  },
  
  // Delivery endpoints
  delivery: {
    getLockerStatus: (boardId: string) => api.get<ApiResponse>(`/delivery/locker-status/${boardId}`),
    start: (data: any) => api.post<ApiResponse>('/delivery/start', data),
    requestPickup: (data: any) => api.post<ApiResponse>('/delivery/pickup-request', data),
  },
  
  // Payment endpoints
  payment: {
    create: (data: any) => api.post<ApiResponse>('/payments/create', data),
    verify: (paymentId: number, deliveryId: number) => 
      api.get<ApiResponse>(`/payments/verify/${paymentId}/${deliveryId}`),
    checkPayment: (invoiceId: string) => 
      api.get<ApiResponse>(`/payments/checkPayment/${invoiceId}`),
  },
  
  // SMS endpoints
  sms: {
    send: (data: any) => api.post<ApiResponse>('/sms/send', data),
  },
};