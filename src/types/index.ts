export type CurrencyCode = 'NGN' | 'USD' | 'EUR' | 'GBP';

export interface SalaryConfig {
  employer: string;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  deductions: number;
  notes?: string;
  pay_start_day: number; // e.g. 24
  pay_end_day: number;   // e.g. 2
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  currency: CurrencyCode;
  minimum_safe_balance: number;
  salary_config?: SalaryConfig;
  claimed_salary_months?: string[];
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskRecurrence = 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  due_time?: string;
  project_id?: string;
  project_name?: string;
  category?: string;
  recurrence: TaskRecurrence;
  notification_enabled: boolean;
  reminder_time?: string; // e.g. "15 minutes before"
  subtasks?: Subtask[];
  created_at: string;
  updated_at: string;
}

export type ActivityStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Paused' | 'Cancelled';

export interface Activity {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  activity_date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  project_id?: string;
  project_name?: string;
  category?: string;
  status: ActivityStatus;
  accomplishment?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived';
export type ProjectPriority = 'Low' | 'Medium' | 'High';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number; // 0 to 100
  total_tasks_count?: number;
  completed_tasks_count?: number;
  time_spent_minutes?: number;
  created_at: string;
  updated_at: string;
}

export type PlanStatus = 'Draft' | 'Active' | 'Completed' | 'Archived';
export type PlanItemStatus = 'Planned' | 'In Progress' | 'Purchased' | 'Completed' | 'Cancelled';
export type PlanItemPriority = 'Low' | 'Medium' | 'High' | 'Essential';

export interface PlanItem {
  id: string;
  plan_id: string;
  name: string;
  description?: string;
  estimated_amount: number;
  actual_amount?: number;
  quantity: number;
  priority: PlanItemPriority;
  status: PlanItemStatus;
  due_date?: string;
  purchased_date?: string;
  category?: string;
  notes?: string;
  expense_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  target_date?: string;
  budget?: number;
  status: PlanStatus;
  progress: number;
  items?: PlanItem[];
  total_estimated?: number;
  total_actual?: number;
  created_at: string;
  updated_at: string;
}

export interface SalaryRecord {
  id: string;
  user_id: string;
  employer: string;
  salary_month: string; // e.g. "2026-08"
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  bonus: number;
  deductions: number;
  gross_salary: number;
  net_salary: number;
  payment_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type IncomeCategory = 'Salary' | 'Freelance' | 'Business' | 'Commission' | 'Bonus' | 'Investment' | 'Gift' | 'Refund' | 'Other';
export type ExpenseCategory = 'Food' | 'Transport' | 'Rent' | 'Housing' | 'Electricity' | 'Water' | 'Airtime' | 'Internet' | 'Shopping' | 'Family' | 'Education' | 'Healthcare' | 'Entertainment' | 'Travel' | 'Debt' | 'Subscriptions' | 'Other';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Debit Card' | 'Credit Card' | 'POS' | 'Mobile Payment' | 'Other';

export interface IncomeRecord {
  id: string;
  user_id: string;
  source: string;
  category: IncomeCategory;
  amount: number;
  date: string;
  description?: string;
  payment_method: PaymentMethod;
  created_at: string;
}

export interface ExpenseRecord {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  date: string;
  payment_method: PaymentMethod;
  plan_item_id?: string;
  created_at: string;
}

export type TransactionType = 'CREDIT' | 'DEBIT';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  transaction_date: string;
  related_type?: 'INCOME' | 'EXPENSE' | 'SALARY' | 'BILL' | 'SAVINGS' | 'PLAN_ITEM';
  related_id?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  month: string; // e.g. "2026-08"
  category: ExpenseCategory;
  budgeted_amount: number;
  spent_amount: number;
  created_at: string;
  updated_at: string;
}

export type BillFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  due_date: string;
  frequency: BillFrequency;
  reminder_enabled: boolean;
  is_paid: boolean;
  last_paid_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  status: 'In Progress' | 'Reached' | 'On Hold';
  description?: string;
  created_at: string;
  updated_at: string;
}

export type GoalCategory = 'Financial' | 'Career' | 'Personal' | 'Learning' | 'Project' | 'Travel' | 'Other';

export interface GoalDeposit {
  id: string;
  goal_id: string;
  amount: number;
  date: string;
  note?: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  target_date?: string;
  start_date?: string;
  target_amount?: number;
  current_amount?: number;
  duration_months?: number;
  saving_frequency?: 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly';
  deposits?: GoalDeposit[];
  status: 'Not Started' | 'In Progress' | 'Achieved' | 'On Hold';
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category?: string;
  is_pinned?: boolean;
  attached_type?: 'TASK' | 'ACTIVITY' | 'PROJECT' | 'PLAN' | 'GOAL';
  attached_id?: string;
  attached_title?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyReview {
  id: string;
  user_id: string;
  review_date: string;
  tasks_completed_count: number;
  activities_count: number;
  total_work_minutes: number;
  accomplishments: string;
  challenges?: string;
  outstanding?: string;
  tomorrow_plans?: string;
  rating?: number; // 1-5
  created_at: string;
}

export interface WeeklyReview {
  id: string;
  user_id: string;
  week_start_date: string; // YYYY-MM-DD
  tasks_completed: number;
  total_tasks: number;
  activities_count: number;
  work_minutes: number;
  focus_minutes: number;
  total_income: number;
  total_expenses: number;
  total_saved: number;
  biggest_accomplishment: string;
  highest_spending_category: string;
  created_at: string;
}

export interface MonthlyReview {
  id: string;
  user_id: string;
  month: string; // YYYY-MM
  tasks_completed: number;
  total_work_hours: number;
  task_completion_rate: number;
  total_salary: number;
  total_other_income: number;
  total_expenses: number;
  total_savings: number;
  savings_rate: number;
  key_highlights: string;
  created_at: string;
}

export type NotificationType =
  | 'TASK_REMINDER'
  | 'TASK_OVERDUE'
  | 'BILL_REMINDER'
  | 'BUDGET_WARNING'
  | 'LOW_BALANCE'
  | 'GOAL_REMINDER'
  | 'PLAN_REMINDER'
  | 'DAILY_REVIEW'
  | 'WEEKLY_REVIEW'
  | 'MONTHLY_REVIEW';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  scheduled_for: string;
  related_type?: string;
  related_id?: string;
  status: 'Pending' | 'Sent' | 'Read';
  read_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  task_reminders: boolean;
  overdue_reminders: boolean;
  bill_reminders: boolean;
  budget_warnings: boolean;
  low_balance_warnings: boolean;
  goal_reminders: boolean;
  plan_reminders: boolean;
  daily_review: boolean;
  weekly_review: boolean;
  monthly_review: boolean;
}

export interface AffordabilityCalculation {
  item_name: string;
  purchase_amount: number;
  current_balance: number;
  upcoming_planned_expenses: number;
  projected_balance: number;
  minimum_safe_balance: number;
  is_affordable: boolean;
  status: 'Affordable' | 'Caution' | 'Unaffordable';
  message: string;
}

export interface GlobalSearchResult {
  id: string;
  type: 'TASK' | 'ACTIVITY' | 'PROJECT' | 'PLAN' | 'EXPENSE' | 'INCOME' | 'TRANSACTION' | 'GOAL' | 'NOTE' | 'BILL';
  title: string;
  subtitle: string;
  url: string;
  date?: string;
}
