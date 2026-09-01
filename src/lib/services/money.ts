import {
  SalaryRecord, IncomeRecord, ExpenseRecord, Transaction, Budget, Bill,
  SavingsGoal, AffordabilityCalculation, SalaryConfig, IncomeCategory, PaymentMethod
} from '@/types';
import { supabase, localStore, saveLocalStore, DEFAULT_SALARY_CONFIG } from '../supabase/client';
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

    const deletedSet = new Set(localStore.deletedTxIds || []);
    dbTxs = dbTxs.filter((t) => !deletedSet.has(t.id));

    const dbTxIds = new Set(dbTxs.map((t) => t.id));
    const localOnlyTxs = localStore.transactions.filter(
      (t) => !dbTxIds.has(t.id) && !deletedSet.has(t.id)
    );
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

  // --- SALARY CONFIGURATION & PAYOUT WINDOW AUTOMATION ---
  getSalaryConfig(): SalaryConfig {
    const profile = localStore.profile;
    return profile.salary_config || DEFAULT_SALARY_CONFIG;
  },

  async saveSalaryConfig(config: SalaryConfig): Promise<SalaryConfig> {
    localStore.profile.salary_config = { ...config };
    saveLocalStore();
    notifyBalanceUpdate();
    return config;
  },

  getPayWindowStatus() {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.toISOString().substring(0, 7); // e.g. "2026-09"
    const config = this.getSalaryConfig();
    const startDay = config.pay_start_day || 24;
    const endDay = config.pay_end_day || 2;

    let cycleMonth = currentMonth;
    let isActive = false;

    if (startDay > endDay) {
      // Crosses month boundary (e.g. 24th to 2nd)
      if (currentDay >= startDay || currentDay <= endDay) {
        isActive = true;
        if (currentDay <= endDay) {
          // Current day is e.g. 1st or 2nd -> payout cycle belongs to previous month
          const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          cycleMonth = prevDate.toISOString().substring(0, 7);
        }
      }
    } else {
      // Normal range within same month (e.g. 1st to 5th)
      if (currentDay >= startDay && currentDay <= endDay) {
        isActive = true;
      }
    }

    const claimedMonths = localStore.profile.claimed_salary_months || [];
    const isClaimed = claimedMonths.includes(cycleMonth);

    const grossSalary = calculateGrossSalary(
      config.basic_salary, config.housing_allowance, config.transport_allowance,
      config.other_allowances, 0
    );
    const netSalary = calculateNetSalary(grossSalary, config.deductions);

    return {
      isActive,
      isClaimed,
      cycleMonth,
      startDay,
      endDay,
      employer: config.employer,
      netSalary,
      config,
      formattedRange: `Active from ${startDay}th to ${endDay}nd of each month`,
    };
  },

  async claimMonthlySalary(): Promise<SalaryRecord | null> {
    const status = this.getPayWindowStatus();
    if (status.isClaimed) return null;

    const today = new Date().toISOString().split('T')[0];
    const config = status.config;
    const record = await this.createSalaryRecord({
      employer: config.employer,
      salary_month: status.cycleMonth,
      basic_salary: config.basic_salary,
      housing_allowance: config.housing_allowance,
      transport_allowance: config.transport_allowance,
      other_allowances: config.other_allowances,
      bonus: 0,
      deductions: config.deductions,
      payment_date: today,
      notes: `Automated monthly salary payout for ${status.cycleMonth}`,
    });

    const claimed = localStore.profile.claimed_salary_months || [];
    if (!claimed.includes(status.cycleMonth)) {
      claimed.push(status.cycleMonth);
      localStore.profile.claimed_salary_months = claimed;
      saveLocalStore();
    }

    notifyBalanceUpdate();
    return record;
  },

  async addExtraFunding(data: {
    source: string;
    category?: IncomeCategory;
    amount: number;
    date?: string;
    payment_method?: PaymentMethod;
    description?: string;
  }): Promise<IncomeRecord> {
    const today = new Date().toISOString().split('T')[0];
    const record = await this.addIncome({
      source: data.source || 'Extra Funding',
      category: data.category || 'Bonus',
      amount: data.amount,
      date: data.date || today,
      description: data.description || 'Extra funding added to available balance',
      payment_method: data.payment_method || 'Bank Transfer',
    });
    notifyBalanceUpdate();
    return record;
  },

  // --- SALARY RECORDS MANAGEMENT ---
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

  async deleteSalaryRecord(id: string): Promise<boolean> {
    const target = localStore.salary.find((s) => s.id === id);
    const salaryMonth = target?.salary_month;

    // 1. Remove salary record
    localStore.salary = localStore.salary.filter((s) => s.id !== id);

    // 2. Remove associated income records and credit transactions
    const incomeSources = target
      ? [`${target.employer} Salary (${target.salary_month})`, `Net salary payout for ${target.salary_month}`]
      : [];

    const assocIncomes = localStore.income.filter(
      (inc) =>
        (target && inc.date === target.payment_date && inc.amount === target.net_salary) ||
        (inc.category === 'Salary' && incomeSources.includes(inc.source)) ||
        (salaryMonth && inc.source.includes(salaryMonth))
    );
    const assocIncomeIds = new Set(assocIncomes.map((inc) => inc.id));

    localStore.income = localStore.income.filter(
      (inc) => !assocIncomeIds.has(inc.id) && !(salaryMonth && inc.source.includes(salaryMonth))
    );

    const txsToDelete = localStore.transactions.filter(
      (tx) =>
        (tx.related_id && assocIncomeIds.has(tx.related_id)) ||
        (salaryMonth && tx.description.includes(salaryMonth)) ||
        (target && tx.amount === target.net_salary && tx.category === 'Salary')
    );

    const deletedTxIds = localStore.deletedTxIds || [];
    txsToDelete.forEach((t) => deletedTxIds.push(t.id));
    localStore.deletedTxIds = Array.from(new Set(deletedTxIds));

    localStore.transactions = localStore.transactions.filter(
      (tx) => !localStore.deletedTxIds.includes(tx.id)
    );

    // 3. Reset claimed_salary_months
    if (salaryMonth && localStore.profile.claimed_salary_months) {
      localStore.profile.claimed_salary_months = localStore.profile.claimed_salary_months.filter(
        (m) => m !== salaryMonth
      );
    }
    saveLocalStore();

    if (supabase) {
      try {
        await supabase.from('salary_records').delete().eq('id', id);
        if (salaryMonth) {
          await supabase.from('salary_records').delete().eq('salary_month', salaryMonth);
          await supabase.from('income_records').delete().ilike('source', `%${salaryMonth}%`);
          await supabase.from('transactions').delete().ilike('description', `%${salaryMonth}%`);
        }
        for (const incId of assocIncomeIds) {
          await supabase.from('income_records').delete().eq('id', incId);
          await supabase.from('transactions').delete().eq('related_id', incId);
        }
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user?.id) {
          await supabase
            .from('profiles')
            .update({ claimed_salary_months: localStore.profile.claimed_salary_months })
            .eq('id', userData.user.id);
        }
      } catch (e) {}
    }

    notifyBalanceUpdate();
    return true;
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

  async deleteIncomeRecord(id: string): Promise<boolean> {
    const target = localStore.income.find((inc) => inc.id === id);

    localStore.income = localStore.income.filter((inc) => inc.id !== id);

    const txsToDelete = localStore.transactions.filter(
      (tx) => tx.related_id === id || (target && tx.amount === target.amount && tx.description === target.source)
    );
    const deletedTxIds = localStore.deletedTxIds || [];
    txsToDelete.forEach((t) => deletedTxIds.push(t.id));
    localStore.deletedTxIds = Array.from(new Set(deletedTxIds));

    localStore.transactions = localStore.transactions.filter(
      (tx) => !localStore.deletedTxIds.includes(tx.id)
    );

    if (target && (target.category === 'Salary' || target.source.includes('Salary'))) {
      const salaryRecordsToRemove = localStore.salary.filter(
        (s) => s.net_salary === target.amount || (s.salary_month && target.source.includes(s.salary_month))
      );
      const salaryMonthsToRemove = new Set(salaryRecordsToRemove.map((s) => s.salary_month));

      localStore.salary = localStore.salary.filter((s) => !salaryMonthsToRemove.has(s.salary_month));
      if (localStore.profile.claimed_salary_months) {
        localStore.profile.claimed_salary_months = localStore.profile.claimed_salary_months.filter(
          (m) => !salaryMonthsToRemove.has(m) && !target.source.includes(m)
        );
      }
    }
    saveLocalStore();

    if (supabase) {
      try {
        await supabase.from('income_records').delete().eq('id', id);
        await supabase.from('transactions').delete().eq('related_id', id);
        if (target && target.source) {
          await supabase.from('transactions').delete().eq('description', target.source);
        }
      } catch (e) {}
    }

    notifyBalanceUpdate();
    return true;
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

  async deleteExpenseRecord(id: string): Promise<boolean> {
    const target = localStore.expenses.find((exp) => exp.id === id);

    localStore.expenses = localStore.expenses.filter((exp) => exp.id !== id);

    const txsToDelete = localStore.transactions.filter(
      (tx) => tx.related_id === id || (target && tx.amount === target.amount && tx.description.includes(target.category))
    );
    const deletedTxIds = localStore.deletedTxIds || [];
    txsToDelete.forEach((t) => deletedTxIds.push(t.id));
    localStore.deletedTxIds = Array.from(new Set(deletedTxIds));

    localStore.transactions = localStore.transactions.filter(
      (tx) => !localStore.deletedTxIds.includes(tx.id)
    );
    saveLocalStore();

    if (supabase) {
      try {
        await supabase.from('expense_records').delete().eq('id', id);
        await supabase.from('transactions').delete().eq('related_id', id);
      } catch (e) {}
    }

    notifyBalanceUpdate();
    return true;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const target = localStore.transactions.find((tx) => tx.id === id);

    const deletedTxIds = localStore.deletedTxIds || [];
    deletedTxIds.push(id);
    localStore.deletedTxIds = Array.from(new Set(deletedTxIds));

    localStore.transactions = localStore.transactions.filter((tx) => tx.id !== id);

    if (target) {
      if (target.related_id) {
        if (target.related_type === 'INCOME') {
          localStore.income = localStore.income.filter((i) => i.id !== target.related_id);
        } else if (target.related_type === 'EXPENSE') {
          localStore.expenses = localStore.expenses.filter((e) => e.id !== target.related_id);
        }
      }
      if (target.category === 'Salary' || target.description.includes('Salary')) {
        localStore.salary = localStore.salary.filter(
          (s) => !(s.net_salary === target.amount || target.description.includes(s.salary_month))
        );
      }
    }
    saveLocalStore();

    if (supabase) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
        if (target && target.related_id) {
          if (target.related_type === 'INCOME') {
            await supabase.from('income_records').delete().eq('id', target.related_id);
          } else if (target.related_type === 'EXPENSE') {
            await supabase.from('expense_records').delete().eq('id', target.related_id);
          }
        }
      } catch (e) {}
    }

    notifyBalanceUpdate();
    return true;
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

  // --- RESET ALL PLATFORM DATA TO ZERO ---
  async resetAllPlatformData(): Promise<boolean> {
    localStore.transactions = [];
    localStore.income = [];
    localStore.expenses = [];
    localStore.salary = [];
    localStore.budgets = [];
    localStore.bills = [];
    localStore.savings = [];
    localStore.projects = [];
    localStore.tasks = [];
    localStore.activities = [];
    localStore.plans = [];
    localStore.goals = [];
    localStore.notes = [];
    localStore.notifications = [];
    localStore.deletedTxIds = [];
    localStore.profile.claimed_salary_months = [];

    saveLocalStore();

    if (supabase) {
      try {
        const tables = [
          'transactions', 'income_records', 'expense_records', 'salary_records',
          'budgets', 'bills', 'savings_goals', 'projects', 'tasks', 'activities',
          'plans', 'goals', 'notes', 'notifications'
        ];
        for (const tbl of tables) {
          await supabase.from(tbl).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user?.id) {
          await supabase
            .from('profiles')
            .update({ claimed_salary_months: [] })
            .eq('id', userData.user.id);
        }
      } catch (e) {}
    }

    notifyBalanceUpdate();
    return true;
  },
};
