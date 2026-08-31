import { CurrencyCode, Transaction, AffordabilityCalculation } from '@/types';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/**
 * Format numeric currency amount consistently across the application.
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'NGN'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '₦';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  return `${symbol}${formatted}`;
}

/**
 * Calculate Gross Salary = Basic + Allowances + Bonus
 */
export function calculateGrossSalary(
  basic: number,
  housing: number,
  transport: number,
  other: number,
  bonus: number
): number {
  return (basic || 0) + (housing || 0) + (transport || 0) + (other || 0) + (bonus || 0);
}

/**
 * Calculate Net Salary = Gross Salary - Deductions
 */
export function calculateNetSalary(grossSalary: number, deductions: number): number {
  return Math.max(0, (grossSalary || 0) - (deductions || 0));
}

/**
 * Calculate Financial Balance from Transaction Ledger:
 * Balance = Total Credits - Total Debits
 */
export function calculateFinancialBalance(transactions: Transaction[]): {
  availableBalance: number;
  totalCredits: number;
  totalDebits: number;
} {
  let totalCredits = 0;
  let totalDebits = 0;

  for (const tx of transactions) {
    if (tx.type === 'CREDIT') {
      totalCredits += tx.amount;
    } else if (tx.type === 'DEBIT') {
      totalDebits += tx.amount;
    }
  }

  const availableBalance = totalCredits - totalDebits;

  return {
    availableBalance,
    totalCredits,
    totalDebits,
  };
}

/**
 * Budget threshold check:
 * 0–79%: Normal (green)
 * 80–99%: Warning (amber)
 * 100%+: Exceeded (red)
 */
export function getBudgetStatus(spent: number, budgeted: number): {
  percentage: number;
  status: 'Normal' | 'Warning' | 'Exceeded';
  color: string;
} {
  if (!budgeted || budgeted <= 0) {
    return { percentage: 0, status: 'Normal', color: 'text-slate-600 bg-slate-100' };
  }

  const percentage = Math.round((spent / budgeted) * 100);

  if (percentage >= 100) {
    return { percentage, status: 'Exceeded', color: 'text-red-700 bg-red-100 border-red-200' };
  } else if (percentage >= 80) {
    return { percentage, status: 'Warning', color: 'text-amber-700 bg-amber-100 border-amber-200' };
  }

  return { percentage, status: 'Normal', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' };
}

/**
 * "Can I Afford This?" Affordability calculation
 * Tests purchase against current balance, upcoming planned expenses, and minimum safe balance.
 */
export function calculateAffordability(
  itemName: string,
  purchaseAmount: number,
  currentBalance: number,
  upcomingPlannedExpenses: number,
  minimumSafeBalance: number = 100000
): AffordabilityCalculation {
  const projectedBalance = currentBalance - purchaseAmount - upcomingPlannedExpenses;
  const isAffordable = projectedBalance >= minimumSafeBalance;

  let status: 'Affordable' | 'Caution' | 'Unaffordable';
  let message: string;

  if (currentBalance < purchaseAmount) {
    status = 'Unaffordable';
    message = `Insufficient available balance (${formatCurrency(currentBalance)}) to cover this purchase of ${formatCurrency(purchaseAmount)}.`;
  } else if (projectedBalance < minimumSafeBalance) {
    status = 'Caution';
    message = `Caution: This purchase would reduce your projected balance (${formatCurrency(projectedBalance)}) below your configured Minimum Safe Balance of ${formatCurrency(minimumSafeBalance)}.`;
  } else {
    status = 'Affordable';
    message = `Safe to purchase! You will retain ${formatCurrency(projectedBalance)} projected balance, well above your minimum threshold of ${formatCurrency(minimumSafeBalance)}.`;
  }

  return {
    item_name: itemName,
    purchase_amount: purchaseAmount,
    current_balance: currentBalance,
    upcoming_planned_expenses: upcomingPlannedExpenses,
    projected_balance: projectedBalance,
    minimum_safe_balance: minimumSafeBalance,
    is_affordable: isAffordable,
    status,
    message,
  };
}
