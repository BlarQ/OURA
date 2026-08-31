'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Calendar, ShieldCheck } from 'lucide-react';
import { SalaryRecord } from '@/types';
import { moneyService } from '@/lib/services/money';
import { formatCurrency, calculateGrossSalary, calculateNetSalary } from '@/lib/calculations/money';

export function SalaryView() {
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    employer: 'TechCorp Africa Ltd',
    salary_month: '2026-09',
    basic_salary: 300000,
    housing_allowance: 120000,
    transport_allowance: 50000,
    other_allowances: 30000,
    bonus: 50000,
    deductions: 50000,
    payment_date: new Date().toISOString().split('T')[0],
    notes: 'Monthly salary payout',
  });

  const loadSalaries = async () => {
    const list = await moneyService.getSalaryRecords();
    setSalaries(list);
  };

  useEffect(() => {
    loadSalaries();
  }, []);

  const calculatedGross = calculateGrossSalary(
    formData.basic_salary, formData.housing_allowance, formData.transport_allowance,
    formData.other_allowances, formData.bonus
  );
  const calculatedNet = calculateNetSalary(calculatedGross, formData.deductions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await moneyService.createSalaryRecord(formData);
    setIsModalOpen(false);
    await loadSalaries();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Salary Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Calculate gross & net salary, allowances, deductions, and payment history
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Salary</span>
        </button>
      </div>

      {/* Salary Records List */}
      <div className="space-y-4">
        {salaries.map((sal) => (
          <div
            key={sal.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{sal.employer}</h3>
                <span className="text-xs text-slate-500 font-medium">Month: {sal.salary_month} • Payment Date: {sal.payment_date}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">Net Payout</span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(sal.net_salary)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Basic Salary</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(sal.basic_salary)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Allowances</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(sal.housing_allowance + sal.transport_allowance + sal.other_allowances)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Bonus</span>
                <span className="font-bold text-emerald-600">{formatCurrency(sal.bonus)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Deductions</span>
                <span className="font-bold text-rose-600">{formatCurrency(sal.deductions)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Record Salary Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Record Salary Payout</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Employer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.employer}
                  onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Salary Month *</label>
                  <input
                    type="month"
                    required
                    value={formData.salary_month}
                    onChange={(e) => setFormData({ ...formData, salary_month: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Basic Salary (₦)</label>
                  <input
                    type="number"
                    value={formData.basic_salary}
                    onChange={(e) => setFormData({ ...formData, basic_salary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Housing Allowance (₦)</label>
                  <input
                    type="number"
                    value={formData.housing_allowance}
                    onChange={(e) => setFormData({ ...formData, housing_allowance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Bonus (₦)</label>
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Deductions (₦)</label>
                  <input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Calculation Summary */}
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Calculated Gross Salary:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(calculatedGross)}</span>
                </div>
                <div className="flex justify-between font-bold text-indigo-700 dark:text-indigo-300 pt-1 border-t border-indigo-200 dark:border-indigo-900">
                  <span>Calculated Net Salary (Payout):</span>
                  <span>{formatCurrency(calculatedNet)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow-md"
                >
                  Save Salary Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
