export interface UserProfileDTO {
  fullName: string;
  mobileNumber: string;
  email?: string;
  roleName?: string;
}

export interface UserDTO {
  userId: number;
  fullName: string;
  mobileNumber: string;
  isActive: boolean;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface User {
  userId?: number;
  fullName: string;
  email: string;
  mobileNumber: string;
  isActive: boolean;
  roleName?: string;
}

export interface Donor {
  donorId: number;
  fullName: string;
  amount: number;
  donationDate: string; // ISO date string
  remarks?: string;
}

export interface Item {
  itemId: number;
  itemName: string;
  currentPrice: number;
  description?: string;
  isAvailable: boolean;
}

export interface EventItem {
  itemId: number;
  itemName: string;
  quantity: number;
  priceAtBooking: number;
}

export interface Event {
  eventId: number;
  familyHeadName: string;
  contactNumber: string;
  email: string;
  eventType: string;
  eventDate: string; // ISO date string
  statusId: number | null;
  isClosed: boolean | null;
  totalAmount: number;
  items: EventItem[];
  remarks?: string;
  paidAmount?: number;
}

export interface Expense {
  expenseId: number;
  amount: number;
  expenseDate: string; // ISO date string
  category?: string;
  description?: string;
}

export interface DailyExpenseSummary {
  date: string;
  totalAmount: number;
}

export interface DashboardStats {
  totalDonors: number;
  activeEvents: number;
  pendingEvents: number;
  approvedEvents: number;
  inProgressEvents: number;
  totalExpenses: number;
}
