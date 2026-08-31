import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled']).default('Not Started'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  due_date: z.string().min(1, 'Due date is required'),
  due_time: z.string().optional(),
  project_id: z.string().optional(),
  category: z.string().default('General'),
  recurrence: z.enum(['None', 'Daily', 'Weekly', 'Monthly', 'Yearly']).default('None'),
  notification_enabled: z.boolean().default(false),
  reminder_time: z.string().optional(),
});

export const activitySchema = z.object({
  title: z.string().min(1, 'Activity title is required'),
  description: z.string().optional(),
  activity_date: z.string().min(1, 'Date is required'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  duration_minutes: z.number().min(0).default(0),
  project_id: z.string().optional(),
  category: z.string().default('Work'),
  accomplishment: z.string().optional(),
  notes: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['Planning', 'Active', 'On Hold', 'Completed', 'Archived']).default('Active'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  progress: z.number().min(0).max(100).default(0),
});

export const planSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  target_date: z.string().optional(),
  budget: z.number().min(0, 'Budget must be greater than or equal to 0').optional(),
  status: z.enum(['Draft', 'Active', 'Completed', 'Archived']).default('Active'),
});

export const planItemSchema = z.object({
  plan_id: z.string().min(1),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  estimated_amount: z.number().min(0, 'Estimated amount must be >= 0'),
  actual_amount: z.number().min(0).optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1').default(1),
  priority: z.enum(['Low', 'Medium', 'High', 'Essential']).default('Medium'),
  category: z.string().default('General'),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

export const salarySchema = z.object({
  employer: z.string().min(1, 'Employer name is required'),
  salary_month: z.string().min(1, 'Salary month is required'), // YYYY-MM
  basic_salary: z.number().min(0, 'Basic salary must be >= 0'),
  housing_allowance: z.number().min(0).default(0),
  transport_allowance: z.number().min(0).default(0),
  other_allowances: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  payment_date: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional(),
});

export const incomeSchema = z.object({
  source: z.string().min(1, 'Income source is required'),
  category: z.enum(['Salary', 'Freelance', 'Business', 'Commission', 'Bonus', 'Investment', 'Gift', 'Refund', 'Other']),
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  payment_method: z.enum(['Cash', 'Bank Transfer', 'Debit Card', 'Credit Card', 'POS', 'Mobile Payment', 'Other']).default('Bank Transfer'),
});

export const expenseSchema = z.object({
  category: z.enum([
    'Food', 'Transport', 'Rent', 'Housing', 'Electricity', 'Water', 'Airtime',
    'Internet', 'Shopping', 'Family', 'Education', 'Healthcare', 'Entertainment',
    'Travel', 'Debt', 'Subscriptions', 'Other'
  ]),
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  payment_method: z.enum(['Cash', 'Bank Transfer', 'Debit Card', 'Credit Card', 'POS', 'Mobile Payment', 'Other']).default('Bank Transfer'),
  plan_item_id: z.string().optional(),
});

export const budgetSchema = z.object({
  month: z.string().min(1, 'Month is required'),
  category: z.enum([
    'Food', 'Transport', 'Rent', 'Housing', 'Electricity', 'Water', 'Airtime',
    'Internet', 'Shopping', 'Family', 'Education', 'Healthcare', 'Entertainment',
    'Travel', 'Debt', 'Subscriptions', 'Other'
  ]),
  budgeted_amount: z.number().gt(0, 'Budgeted amount must be greater than 0'),
});

export const billSchema = z.object({
  name: z.string().min(1, 'Bill name is required'),
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  category: z.enum([
    'Food', 'Transport', 'Rent', 'Housing', 'Electricity', 'Water', 'Airtime',
    'Internet', 'Shopping', 'Family', 'Education', 'Healthcare', 'Entertainment',
    'Travel', 'Debt', 'Subscriptions', 'Other'
  ]).default('Subscriptions'),
  due_date: z.string().min(1, 'Due date is required'),
  frequency: z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']).default('Monthly'),
  reminder_enabled: z.boolean().default(true),
});

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  target_amount: z.number().gt(0, 'Target amount must be greater than 0'),
  current_amount: z.number().min(0).default(0),
  target_date: z.string().optional(),
  description: z.string().optional(),
});

export const goalSchema = z.object({
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional(),
  category: z.enum(['Financial', 'Career', 'Personal', 'Learning', 'Project', 'Travel', 'Other']).default('Personal'),
  target_date: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
});

export const noteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  attached_type: z.enum(['TASK', 'ACTIVITY', 'PROJECT', 'PLAN', 'GOAL']).optional(),
  attached_id: z.string().optional(),
});
