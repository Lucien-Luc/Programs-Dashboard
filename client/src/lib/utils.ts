import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    completed: 'status-completed',
    in_progress: 'status-in_progress',
    scheduled: 'status-scheduled',
    pending: 'status-pending',
    cancelled: 'status-cancelled',
  };
  return statusMap[status] || 'bg-gray-100 text-gray-800';
}

// Program type functions removed - each program is now independent
