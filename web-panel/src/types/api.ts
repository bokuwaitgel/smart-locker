export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface Container {
  id: number;
  boardId: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'UNDER_REPAIR';
  createdAt: string;
  updatedAt: string;
  description?: string;
  Lockers?: Locker[];
}

export interface Locker {
  id: number;
  lockerNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'PENDING' | 'MAINTENANCE';
  boardId: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface DeliveryOrder {
  id: number;
  boardId: string;
  lockerId: string;
  pickupCode: string;
  status: 'WAITING' | 'PENDING' | 'DELIVERED' | 'PICKED_UP' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED';
  pickupMobile: string;
  isSendSMS: boolean;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  pickedUpAt?: string;
}

export interface Payment {
  id: number;
  amount: number;
  status: 'UNPAID' | 'PAID' | 'FAILED';
  deliveryId: number;
  InvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SMS {
  id: number;
  phoneNumber: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}