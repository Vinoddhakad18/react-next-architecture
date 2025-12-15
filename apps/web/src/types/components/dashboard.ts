/**
 * Dashboard Component Types
 */

export interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

export type OrderStatus = 'Completed' | 'Processing' | 'Pending';

export interface Order {
  id: string;
  customer: string;
  amount: string;
  status: OrderStatus;
  date: string;
}

export interface DashboardStats {
  totalRevenue: string;
  totalOrders: number;
  newUsers: number;
  conversionRate: string;
}



