import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getStatusColor(status: string) {
  const statusColors = {
    ACTIVE: 'bg-success-100 text-success-600',
    INACTIVE: 'bg-gray-100 text-gray-600',
    MAINTENANCE: 'bg-warning-100 text-warning-600',
    UNDER_REPAIR: 'bg-error-100 text-error-600',
    AVAILABLE: 'bg-success-100 text-success-600',
    OCCUPIED: 'bg-error-100 text-error-600',
    PENDING: 'bg-warning-100 text-warning-600',
    WAITING: 'bg-warning-100 text-warning-600',
    DELIVERED: 'bg-primary-100 text-primary-600',
    PICKED_UP: 'bg-success-100 text-success-600',
    CANCELLED: 'bg-gray-100 text-gray-600',
    PAID: 'bg-success-100 text-success-600',
    UNPAID: 'bg-warning-100 text-warning-600',
    FAILED: 'bg-error-100 text-error-600',
  };
  
  return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-600';
}