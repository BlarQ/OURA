import {
  SalaryRecord, IncomeRecord, ExpenseRecord, Transaction, Budget, Bill,
  SavingsGoal, AffordabilityCalculation
} from '@/types';
import { supabase, localStore, saveLocalStore } from '../supabase/client';
import {
  calculateGrossSalary, calculateNetSalary, calculateFinancialBalance,
  calculateAffordability
} from '../calculations/money';

export function notifyBalanceUpdate() {
  saveLocalStore();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('oura_balance_updated'));
  }
}

export const moneyService = {
  // --- FINANCIAL BALANCE & TRANSACTIONS ---
  async getTransactions(): Promise<Transaction[]> {
    let dbTxs: Transaction[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('transaction_date', { ascending: false });
        if (!error && data) dbTxs = data as any;
      } catch (e) {}
    }

    const dbTxIds = new Set(dbTxs.map((t) => t.id));
    const localOnlyTxs = localStore.transactions.filter((t) => !dbTxIds.has(t.id));
    return [...dbTxs, ...localOnlyTxs];
  },

  async getFinancialOverview() {
    const transactions = await this.getTransactions();
    const { availableBalance, totalCredits, totalDebits } = calculateFinancialBalance(transactions);
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);

    const incomeList = await this.getIncomeRecords();
    const expenseList = await this.getExpenseRecords();

    const monthIncome = incomeList
      .filter((inc) => inc.date.startsWith(currentMonth))
      .reduce((sum, inc) => sum + (inc.amount || 0), 0);

    const monthExpenses = expenseList
      .filter((exp) => exp.date.startsWith(currentMonth))
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const spentToday = expenseList
      .filter((exp) => exp.date === today)
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    return {
      availableBalance,
      totalCredits,
      totalDebits,
      monthIncome,
      monthExpenses,
      spentToday,
      minimumSafeBalance: localStore.profile.minimum_safe_balance || 100000,
    };
  },

  // --- SALARY MANAGEMENT ---
  async getSalaryRecords(): Promise<SalaryRecord[]> {
    let dbRecords: SalaryRecord[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('salary_records')
          .select('*')
          .order('payment_date', { ascending: false });
        if (!error && data) dbRecords = data as any;
      } catch (e) {}
    }

    const dbIds = new Set(dbRecords.map((s) => s.id));
    const localOnly = localStore.salary.filter((s) => !dbIds.has(s.id));
    return [...dbRecords, ...localOnly];
  },

  async createSalaryRecord(data: Omit<SalaryRecord, 'id' | 'user_id' | 'gross_salary' | 'net_salary' | 'created_at' | 'updated_at'>): Promise<SalaryRecord> {
    const today = new Date().toISOString().split('T')[0];
    const grossSalary = calculateGrossSalary(
      data.basic_salary, data.housing_allowance, data.transport_allowance,
      data.other_allowances, data.bonus
    );
    const netSalary = calculateNetSalary(grossSalary, data.deductions);

    const record: SalaryRecord = {
      ...data,
      id: `sal_${Date.now()}`,
      user_id: localStore.profile.id,
      gross_salary: grossSalary,
      net_salary: netSalary,
      created_at: today,
      updated_at: today,
    };

    localStore.salary.unshift(record);
    saveLocalStore();

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || localStore.profile.id;
        const { data: salData, error } = await supabase
          .from('salary_records')
          .insert([{
            ...data,
            user_id: userId,
            gross_salary: grossSalary,
            net_salary: netSalary,
          }])
          .select('*')
          .single();

        if (!error && salData) {
          const idx = localStore.salary.findIndex((s) => s.id === record.id);
          if (idx !== -1) {
            localStore.salary[idx] = { ...record, ...salData };
            saveLocalStore();
          }
        }
      } catch (e) {}
    }

    await this.addIncome({
      source: `${data.employer} Salary (${data.salary_month})`,
      category: 'Salary',
      amount: netSalary,
      date: data.payment_date,
      description: `Net salary payout for ${data.salary_month}`,
      payment_method: 'Bank Transfer',
    });

    return record;
  },

  // --- INCOME MANAGEMENT ---
  async getIncomeRecords(): Promise<IncomeRecord[]> {
    let dbRecords: IncomeRecord[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('income_records')
          .select('*')
          .order('date', { ascending: false });
        if (!error && data) dbRecords = data as any;
      } catch (e) {}
    }

    const dbIds = new Set(dbRecords.map((i) => i.id));
    const localOnly = localStore.income.filter((i) => !dbIds.has(i.id));
    return [...dbRecords, ...localOnly];
  },

  async addIncome(data: Omit<IncomeRecord, 'id' | 'user_id' | 'created_at'>): Promise<IncomeRecord> {
    const today = new Date().toISOString().split('T')[0];
    const newIncome: IncomeRecord = {
      ...data,
      id: `inc_${Date.now()}`,
      user_id: localStore.profile.id,
      created_at: today,
    };
    localStore.income.unshift(newIncome);

    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      user_id: localStore.profile.id,
      type: 'CREDIT',
      amount: data.amount,
      description: data.source,
      category: data.category,
      transaction_date: data.date,
      related_type: 'INCOME',
      related_id: newIncome.id,
      created_at: today,
    };
    localStore.transactions.unshift(tx);
    saveLocalStore();

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || localStore.profile.id;
        const { data: incData, error } = await supabase
          .from('income_records')
          .insert([{ ...data, user_id: userId }])
          .select('*')
          .single();

        if (!error && incData) {
          await supabase.from('transactions').insert([{
            user_id: userId,
            type: 'CREDIT',
            amount: data.amount,
            description: data.source,
            category: data.category,
            transaction_date: data.date,
            related_type: 'INCOME',
            related_id: incData.id,
          }]);
        }
      } catch (e) {}
    }

    notifyBalanceUpdate();
    return newIncome;
  },

  // --- EXPENSE MANAGEMENT ---
  async getExpenseRecords(): Promise<ExpenseRecord[]> {
    let dbRecords: ExpenseRecord[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('expense_records')
          .select('*')
          .order('date', { ascending: false });
        if (!error && data) dbRecords = data as any;
      } catch (e) {}
    }

    const dbIds = new Set(dbRecords.map((e) => e.id));
    const localOnly = localStore.expenses.filter((e) => !dbIds.has(e.id));
    return [...dbRecords, ...localOnly];
  },

  async addExpense(data: Omit<ExpenseRecord, 'id' | 'user_id' | 'created_at'>): Promise<ExpenseRecord> {
    const today = new Date().toISOString().split('T')[0];
    const newExpense: ExpenseRecord = {
      ...data,
      id: `exp_${Date.now()}`,
      user_id: localStore.profile.id,
      created_at: today,
    };
    localStore.expenses.unshift(newExpense);

    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      user_id: localStore.profile.id,
      type: 'DEBIT',
      amount: data.amount,
      description: data.description || `Expense: ${data.category}`,
      category: data.category,
      transaction_date: data.date,
      related_type: 'EXPENSE',
      related_id: newExpense.id,
      created_at: today,
    };
    localStore.transactions.unshift(tx);
    saveLocalStore();

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || localStore.profile.id;
        const { data: expData, error } = await supabase
          .from('expense_records')
          .insert([{ ...data, user_id: userId }])
          .select('*')
          .single();

        if (!error && expData) {
          await supabase.from('transactions').insert([{
            user_id: userId,
            type: 'DEBIT',
            amount: data.amount,
            description: data.description || `Expense: ${data.category}`,
            category: data.category,
            transaction_date: data.date,
            related_type: 'EXPENSE',
            related_id: expData.id,
          }]);
        }
      } catch (e) {}
    }

    notifyBalanceUpdate();
    return newExpense;
  },

  // --- BUDGETS ---
  async getBudgets(month?: string): Promise<Budget[]> {
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    let dbBudgets: Budget[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('*')
          .eq('month', targetMonth);
        if (!error && data) dbBudgets = data as any;
      } catch (e) {}
    }

    const dbIds = new Set(dbBudgets.map((b) => b.id));
    const localOnly = localStore.budgets.filter((b) => b.month === targetMonth && !dbIds.has(b.id));
    const rawBudgets = [...dbBudgets, ...localOnly];

    // Fetch actual logged expenses to calculate real category spending
    const expenseRecords = await this.getExpenseRecords();

    return rawBudgets.map((budget) => {
      const totalSpent = expenseRecords
        .filter((exp) => exp.category === budget.category && exp.date.startsWith(targetMonth))
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);

      return {
        ...budget,
        spent_amount: totalSpent,
      };
    });
  },

  async createOrUpdateBudget(data: Omit<Budget, 'id' | 'user_id' | 'spent_amount' | 'created_at' | 'updated_at'>): Promise<Budget> {
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = localStore.budgets.findIndex(
      (b) => b.month === data.month && b.category === data.category
    );

    if (existingIndex !== -1) {
      localStore.budgets[existingIndex].budgeted_amount = data.budgeted_amount;
      localStore.budgets[existingIndex].updated_at = today;
      saveLocalStore();
    } else {
      const newBudget: Budget = {
        ...data,
        id: `bud_${Date.now()}`,
        user_id: localStore.profile.id,
        spent_amount: 0,
        created_at: today,
        updated_at: today,
      };
      localStore.budgets.push(newBudget);
      saveLocalStore();
    }

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || localStore.profile.id;
        await supabase
          .from('budgets')
          .upsert([{ ...data, user_id: userId }], { onConflict: 'user_id,month,category' });
      } catch (e) {}
    }

    const updated = localStore.budgets.find((b) => b.month === data.month && b.category === data.category);
    return updated!;
  },

  async deleteBudget(id: string): Promise<boolean> {
    if (supabase && !id.startsWith('bud_')) {
      try {
        await supabase.from('budgets').delete().eq('id', id);
      } catch (e) {}
    }
    localStore.budgets = localStore.budgets.filter((b) => b.id !== id);
    saveLocalStore();
    return true;
  },

  // --- BILLS ---
  async getBills(): Promise<Bill[]> {
    let dbBills: Bill[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bills')
          .select('*')
          .order('due_date', { ascending: true });
        if (!error && data) dbBills = data as any;
      } catch (e) {}
    }

    const dbIds = new Set(dbBills.map((b) => b.id));
    const localOnly = localStore.bills.filter((b) => !dbIds.has(b.id));
    return [...dbBills, ...localOnly];
  },

  async createBill(data: Omit<Bill, 'id' | 'user_id' | 'is_paid' | 'created_at' | 'updated_at'>): Promise<Bill> {
    const today = new Date().toISOString().split('T')[0];
    const newBill: Bill = {
      ...data,
      id: `bill_${Date.now()}`,
      user_id: localStore.profile.id,
      is_paid: false,
      created_at: today,
      updated_at: today,
    };
    localStore.bills.unshift(newBill);
    saveLocalStore();

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || localStore.profile.id;
        const { data: billData, error } = await supabase
          .from('bills')
          .insert([{ ...data, user_id: userId, is_paid: false }])
          .select('*')
          .single();
        if (!error && billData) {
          const idx = localStore.bills.findIndex((b) => b.id === newBill.id);
          if (idx !== -1) {
            localStore.bills[idx] = { ...newBill, ...billData };
            saveLocalStore();
          }
        }
      } catch (e) {}
    }

    return newBill;
  },

  async markBillPaid(billId: string): Promise<Bill | null> {
    const today = new Date().toISOString().split('T')[0];
    const bill = (await this.getBills()).find((b) => b.id === billId);
    if (!bill) return null;

    if (supabase && !billId.startsWith('bill_')) {
      try {
        await supabase
          .from('bills')
          .update({ is_paid: true, last_paid_date: today })
          .eq('id', billId);
      } catch (e) {}
    }

    bill.is_paid = true;
    bill.last_paid_date = today;
    saveLocalStore();

    await this.addExpense({
      category: bill.category,
      amount: bill.amount,
      description: `Bill Payment: ${bill.name}`,
      date: today,
      payment_method: 'Bank Transfer',
    });

    return bill;
  },

  // --- SAVINGS GOALS ---
  async getSavingsGoals(): Promise<SavingsGoal[]> {
    let dbGoals: SavingsGoal[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('savings_goals')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) dbGoals = data as any;
      } catch (e) {}
    }

    const dbIds = new Set(dbGoals.map((s) => s.id));
    const localOnly = localStore.savings.filter((s) => !dbIds.has(s.id));
    return [...dbGoals, ...localOnly];
  },

  async createSavingsGoal(data: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<SavingsGoal> {
    const today = new Date().toISOString().split('T')[0];
    const newSavings: SavingsGoal = {
      ...data,
      id: `sav_${Date.now()}`,
      user_id: localStore.profile.id,
      created_at: today,
      updated_at: today,
    };
    localStore.savings.unshift(newSavings);
    saveLocalStore();

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || localStore.profile.id;
        await supabase
          .from('savings_goals')
          .insert([{ ...data, user_id: userId }]);
      } catch (e) {}
    }

    return newSavings;
  },

  async contributeToSavings(id: string, amount: number): Promise<SavingsGoal | null> {
    const goal = (await this.getSavingsGoals()).find((s) => s.id === id);
    if (!goal) return null;

    const today = new Date().toISOString().split('T')[0];
    const newCurrent = goal.current_amount + amount;
    const newStatus = newCurrent >= goal.target_amount ? 'Reached' : goal.status;

    if (supabase && !id.startsWith('sav_')) {
      try {
        await supabase
          .from('savings_goals')
          .update({ current_amount: newCurrent, status: newStatus })
          .eq('id', id);
      } catch (e) {}
    }

    goal.current_amount = newCurrent;
    goal.status = newStatus;

    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      user_id: localStore.profile.id,
      type: 'DEBIT',
      amount,
      description: `Savings Contribution: ${goal.name}`,
      category: 'Savings',
      transaction_date: today,
      related_type: 'SAVINGS',
      related_id: goal.id,
      created_at: today,
    };
    localStore.transactions.unshift(tx);
    saveLocalStore();

    return goal;
  },

  // --- AFFORDABILITY CALCULATOR ---
  async testAffordability(itemName: string, amount: number): Promise<AffordabilityCalculation> {
    const overview = await this.getFinancialOverview();
    const plans = await (await import('./plans')).planService.getPlans();

    let upcomingPlannedExpenses = 0;
    for (const plan of plans) {
      if (plan.status === 'Active' && plan.items) {
        for (const item of plan.items) {
          if (item.status === 'Planned') {
            upcomingPlannedExpenses += (item.estimated_amount * (item.quantity || 1));
          }
        }
      }
    }

    return calculateAffordability(
      itemName,
      amount,
      overview.availableBalance,
      upcomingPlannedExpenses,
      overview.minimumSafeBalance
    );
  },
};
