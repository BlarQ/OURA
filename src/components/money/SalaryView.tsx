'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard, Plus, Calendar, ShieldCheck, CheckCircle2, DollarSign,
  Settings, Clock, Sparkles, AlertCircle, ArrowUpRight, Check, Trash2
} from 'lucide-react';
import { SalaryRecord, SalaryConfig, IncomeCategory, PaymentMethod } from '@/types';
import { moneyService } from '@/lib/services/money';
import { formatCurrency, calculateGrossSalary, calculateNetSalary } from '@/lib/calculations/money';
import { showToast, showConfirmModal } from '@/components/layout/ConfirmModal';

export function SalaryView() {
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [payWindowStatus, setPayWindowStatus] = useState<any>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isExtraFundingOpen, setIsExtraFundingOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Salary Configuration State
  const [configData, setConfigData] = useState<SalaryConfig>({
    employer: 'TechCorp Africa Ltd',
    basic_salary: 300000,
    housing_allowance: 120000,
    transport_allowance: 50000,
    other_allowances: 30000,
    deductions: 50000,
    pay_start_day: 24,
    pay_end_day: 2,
  });

  // Extra Funding State
  const [extraFunding, setExtraFunding] = useState({
    source: 'Side Hustle / Bonus',
    category: 'Bonus' as IncomeCategory,
    amount: 100000,
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer' as PaymentMethod,
    description: 'Extra funding added to balance',
  });

  const loadData = async () => {
    const list = await moneyService.getSalaryRecords();
    setSalaries(list);
    const status = moneyService.getPayWindowStatus();
    setPayWindowStatus(status);
    setConfigData(status.config);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    if (typeof window !== 'undefined') {
      window.addEventListener('oura_balance_updated', handleUpdate);
      return () => window.removeEventListener('oura_balance_updated', handleUpdate);
    }
  }, []);

  const handleClaimSalary = async () => {
    setIsClaiming(true);
    const record = await moneyService.claimMonthlySalary();
    setIsClaiming(false);

    if (record) {
      showToast(`Salary payout of ${formatCurrency(record.net_salary)} confirmed and credited to balance! 🎉`, 'success');
      await loadData();
    } else {
      showToast('Salary for this month has already been claimed.', 'info');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await moneyService.saveSalaryConfig(configData);
    setIsConfigModalOpen(false);
    showToast('Salary configuration and pay window updated successfully!', 'success');
    await loadData();
  };

  const handleAddExtraFundingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraFunding.amount || extraFunding.amount <= 0) {
      showToast('Please enter a valid funding amount', 'error');
      return;
    }
    await moneyService.addExtraFunding(extraFunding);
    setIsExtraFundingOpen(false);
    showToast(`Extra funding of ${formatCurrency(extraFunding.amount)} added to balance! 💰`, 'success');
    await loadData();
  };

  const handleDeleteSalary = (id: string, salaryMonth: string) => {
    showConfirmModal({
      title: 'Delete Salary Payout Record?',
      message: `Are you sure you want to delete the payout history record for ${salaryMonth}? This will also reset the pay window for this month so you can re-claim if needed.`,
      isDanger: true,
      confirmText: 'Delete Record',
      onConfirm: async () => {
        const deleted = await moneyService.deleteSalaryRecord(id);
        if (deleted) {
          showToast(`Salary payout record for ${salaryMonth} deleted.`, 'success');
          await loadData();
        }
      },
    });
  };

  const grossSalary = calculateGrossSalary(
    configData.basic_salary, configData.housing_allowance, configData.transport_allowance,
    configData.other_allowances, 0
  );
  const netSalary = calculateNetSalary(grossSalary, configData.deductions);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn select-none">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            Salary & Income Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated monthly salary payout confirmation, pay window duration & extra funding
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsExtraFundingOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Add Extra Funding</span>
          </button>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Configure Salary</span>
          </button>
        </div>
      </div>

      {/* 2. Monthly Payout Window Active Banner */}
      {payWindowStatus && (
        <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-500/30">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 max-w-xl relative z-10">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Monthly Pay Window ({payWindowStatus.startDay}th to {payWindowStatus.endDay}nd)</span>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-white">
              {payWindowStatus.isClaimed ? (
                <span className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  Salary Claimed for {payWindowStatus.cycleMonth}
                </span>
              ) : payWindowStatus.isActive ? (
                <span>Salary Payout Available for {payWindowStatus.cycleMonth}</span>
              ) : (
                <span className="text-slate-300">Pay Window Inactive for {payWindowStatus.cycleMonth}</span>
              )}
            </h2>

            <p className="text-xs text-indigo-200/90 leading-relaxed">
              {payWindowStatus.isClaimed
                ? `Net salary of ${formatCurrency(payWindowStatus.netSalary)} has been processed and added to your available balance.`
                : payWindowStatus.isActive
                ? `Your monthly net salary of ${formatCurrency(payWindowStatus.netSalary)} is ready. Click below to confirm payout and update balance.`
                : `Salary payout button activates automatically from the ${payWindowStatus.startDay}th to the ${payWindowStatus.endDay}nd of each month.`}
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            {payWindowStatus.isClaimed ? (
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs">
                <Check className="w-4 h-4 stroke-3" />
                <span>Salary Paid ({formatCurrency(payWindowStatus.netSalary)})</span>
              </div>
            ) : payWindowStatus.isActive ? (
              <button
                onClick={handleClaimSalary}
                disabled={isClaiming}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/30 active:scale-95 transition-all animate-pulse"
              >
                <DollarSign className="w-4 h-4 stroke-3" />
                <span>Confirm Salary Received ({formatCurrency(payWindowStatus.netSalary)})</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Opens on {payWindowStatus.startDay}th</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Base Salary Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Base Salary Template ({configData.employer})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                One-time configured breakdown for automated monthly payouts
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200/60 dark:border-indigo-900 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors"
          >
            Edit Template
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Basic Salary</span>
            <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(configData.basic_salary)}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Allowances</span>
            <span className="font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(configData.housing_allowance + configData.transport_allowance + configData.other_allowances)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Deductions</span>
            <span className="font-extrabold text-rose-600 dark:text-rose-400">{formatCurrency(configData.deductions)}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Net Payout per Month</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(netSalary)}</span>
          </div>
        </div>
      </div>

      {/* 4. Salary Payout History List */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
          Payout History ({salaries.length})
        </h3>

        {salaries.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No salary payouts logged yet. Click "Confirm Salary Received" when your pay window opens.
          </div>
        ) : (
          salaries.map((sal) => (
            <div
              key={sal.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 transition-all"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm truncate">{sal.employer}</span>
                  <span className="shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                    {sal.salary_month} • Paid
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Payment Date: {sal.payment_date} • Basic: {formatCurrency(sal.basic_salary)}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Net Credit</span>
                  <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(sal.net_salary)}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteSalary(sal.id, sal.salary_month)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                  title="Delete Payout History Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. One-Time Salary & Pay Window Configuration Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Configure Base Salary & Pay Window</h2>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Employer Name *</label>
                <input
                  type="text"
                  required
                  value={configData.employer}
                  onChange={(e) => setConfigData({ ...configData, employer: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Pay Window Duration Customization */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-900 space-y-3">
                <h4 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Monthly Payout Window Active Days
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Start Day of Month (e.g. 24th)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={configData.pay_start_day}
                      onChange={(e) => setConfigData({ ...configData, pay_start_day: parseInt(e.target.value) || 24 })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      End Day of Month (e.g. 2nd)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={configData.pay_end_day}
                      onChange={(e) => setConfigData({ ...configData, pay_end_day: parseInt(e.target.value) || 2 })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Basic Salary (₦)</label>
                  <input
                    type="number"
                    value={configData.basic_salary}
                    onChange={(e) => setConfigData({ ...configData, basic_salary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Housing Allowance (₦)</label>
                  <input
                    type="number"
                    value={configData.housing_allowance}
                    onChange={(e) => setConfigData({ ...configData, housing_allowance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Transport Allowance (₦)</label>
                  <input
                    type="number"
                    value={configData.transport_allowance}
                    onChange={(e) => setConfigData({ ...configData, transport_allowance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Other Allowances (₦)</label>
                  <input
                    type="number"
                    value={configData.other_allowances}
                    onChange={(e) => setConfigData({ ...configData, other_allowances: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Monthly Deductions (Tax/Pension) (₦)</label>
                <input
                  type="number"
                  value={configData.deductions}
                  onChange={(e) => setConfigData({ ...configData, deductions: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow-md"
                >
                  Save Salary Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Extra Funding Modal */}
      {isExtraFundingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Add Extra Funding</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add side income, bonus, gift, or refund to balance</p>
              </div>
            </div>

            <form onSubmit={handleAddExtraFundingSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Funding Title / Source *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Freelance Project Bonus, Gift, Tax Refund"
                  value={extraFunding.source}
                  onChange={(e) => setExtraFunding({ ...extraFunding, source: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Amount (₦) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={extraFunding.amount}
                    onChange={(e) => setExtraFunding({ ...extraFunding, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={extraFunding.category}
                    onChange={(e) => setExtraFunding({ ...extraFunding, category: e.target.value as IncomeCategory })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Bonus">Bonus</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Business">Business</option>
                    <option value="Gift">Gift</option>
                    <option value="Commission">Commission</option>
                    <option value="Investment">Investment</option>
                    <option value="Refund">Refund</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={extraFunding.date}
                  onChange={(e) => setExtraFunding({ ...extraFunding, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExtraFundingOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold shadow-md"
                >
                  Add to Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
