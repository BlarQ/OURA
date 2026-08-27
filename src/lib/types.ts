export type Role = 'wife' | 'husband';

export interface UserProfile {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  partnerName: string;
  partnerRole: Role;
  coupleId: string;
  isDiscreetMode: boolean;
  salarySharingLevel: number; // 0: None, 1: Salary Only, 2: Salary+Summary, 3: Full Overview, 4: Shared Access
  isSalaryShared: boolean;
  menstrualSharingLevel: 'private' | 'basic' | 'moderate' | 'detailed' | 'full';
  husbandWfhDays: string[]; // e.g. ['Tuesday']
}

export interface Couple {
  id: string;
  inviteCode: string;
  connectedAt: string;
  wifeId: string;
  husbandId: string;
}

export interface SalaryProfile {
  id: string;
  userId: string;
  salaryName: string;
  employer: string;
  frequency: 'monthly' | 'biweekly' | 'weekly' | 'custom';
  grossSalary: number;
  netSalary: number;
  salaryDate: number; // Day of month e.g. 25
  currency: string; // 'NGN', 'USD', etc.
  otherIncome: number;
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  userId: string;
  coupleId?: string;
  type: 'credit' | 'debit';
  amount: number;
  date: string;
  category: string;
  description: string;
  paymentMethod: string;
  relatedItemId?: string;
  isRecurring: boolean;
  isShared: boolean; // false = 'Me', true = 'Us'
  paidBy: Role;
  receiptUrl?: string;
  status: 'planned' | 'pending' | 'completed' | 'cancelled' | 'refunded';
  originalTransactionId?: string; // For refunds/reversals
}

export interface Budget {
  id: string;
  userId: string;
  coupleId?: string;
  category: string;
  limitAmount: number;
  spentAmount: number;
  monthYear: string; // '2026-08'
  isShared: boolean;
}

export interface SavingsGoal {
  id: string;
  coupleId?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  monthlyContribution: number;
  category: 'dream_home' | 'wedding' | 'rent' | 'emergency' | 'car' | 'vacation' | 'investment';
  isShared: boolean;
  husbandContribution?: number;
  wifeContribution?: number;
}

export type ItemStatus =
  | 'needed'
  | 'considering'
  | 'approved'
  | 'budgeted'
  | 'shopping'
  | 'purchased'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'delivered'
  | 'installed'
  | 'cancelled';

export interface PriceHistoryEntry {
  date: string;
  price: number;
  recordedBy: string;
}

export interface HouseholdItem {
  id: string;
  coupleId?: string;
  name: string;
  category: 'Living Room' | 'Bedroom' | 'Kitchen' | 'Bathroom' | 'Cleaning' | 'Safety' | 'Workplace Apartment';
  estimatedPrice: number;
  currentPrice: number;
  quantity: number;
  brand?: string;
  model?: string;
  vendor?: string;
  status: ItemStatus;
  purchasedBy?: Role;
  purchaseDate?: string;
  warrantyMonths?: number;
  receiptUrl?: string;
  priceHistory: PriceHistoryEntry[];
  room: string;
  notes?: string;
  isWorkplaceApartment?: boolean; // True for wife's personal workplace apartment
}

export interface DutyScheduleSetup {
  isConfigured: boolean;
  coupleId?: string;
  day1Date: string; // YYYY-MM-DD
  day1Type: 'Morning' | 'Night' | 'OFF';
  day2Date: string; // YYYY-MM-DD
  day2Type: 'Morning' | 'Night' | 'OFF';
}

export interface DutyDay {
  date: string; // YYYY-MM-DD
  dutyType: 'Morning' | 'Night' | 'OFF';
  isHomeWeekend: boolean;
  isHusbandWfh: boolean;
  overrideNote?: string;
}

export interface MenstrualLog {
  id: string;
  coupleId?: string;
  startDate: string;
  endDate?: string;
  flow: 'light' | 'medium' | 'heavy';
  painLevel: number; // 1-10
  symptoms: string[];
  energy: 'low' | 'normal' | 'high';
  mood: string;
  sleepHours: number;
  stressLevel: 'low' | 'moderate' | 'high';
  notes?: string;
}

export interface CyclePrediction {
  avgCycleLength: number; // e.g. 28 days
  avgPeriodDuration: number; // e.g. 5 days
  estimatedNextPeriodStart: string;
  estimatedNextPeriodEnd: string;
  predictionWindowText: string;
}

export interface Meal {
  id: string;
  name: string;
  cuisine: 'Yoruba' | 'Igbo' | 'Nigerian General' | 'African' | 'International';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  ironMg: number;
  folateMcg: number;
  potassiumMg: number;
  description: string;
  isLightForNightDuty?: boolean;
}

export interface WeeklyMealPlan {
  dayOfWeek: string;
  coupleId?: string;
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  snack?: Meal;
}

export interface Task {
  id: string;
  coupleId?: string;
  title: string;
  description?: string;
  assignedTo: Role | 'both';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  category: 'Apartment' | 'Finance' | 'Marriage' | 'Work' | 'General';
}

export interface DecisionOption {
  id: string;
  title: string;
  price: number;
  description: string;
}

export interface Decision {
  id: string;
  coupleId?: string;
  title: string;
  category: string;
  options: DecisionOption[];
  wifeStatus: 'pending' | 'approved' | 'rejected';
  husbandStatus: 'pending' | 'approved' | 'rejected';
  selectedOptionId?: string;
  status: 'proposed' | 'discussing' | 'wife_approved' | 'husband_approved' | 'both_agreed' | 'rejected';
}

export interface Note {
  id: string;
  coupleId?: string;
  title: string;
  content: string;
  category: 'Personal' | 'Work' | 'Home' | 'Marriage' | 'Shopping' | 'Ideas';
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  isShared: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  coupleId?: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime: string;
  priority: 'low' | 'medium' | 'high';
  category: 'Bill' | 'Duty' | 'Health' | 'Household' | 'Personal';
  isShared: boolean;
  isCompleted: boolean;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
}

export interface InventoryItem {
  id: string;
  coupleId?: string;
  name: string;
  location: string;
  owner: Role | 'shared';
  purchaseDate: string;
  cost: number;
  warrantyPeriodMonths: number;
  condition: 'new' | 'good' | 'fair' | 'needs_maintenance';
  serialNumber?: string;
}

export interface AuditLog {
  id: string;
  coupleId?: string;
  timestamp: string;
  actorRole: Role;
  action: string;
  details: string;
}
