'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { Bill } from '@/types';
import { moneyService } from '@/lib/services/money';
import { formatCurrency } from '@/lib/calculations/money';

export function BillsView() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const loadBills = async () => {
    const list = await moneyService.getBills();
    setBills(list);
  };

  useEffect(() => {
    loadBills();
  }, []);

  const handleMarkPaid = async (id: string) => {
    await moneyService.markBillPaid(id);
    await loadBills();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const bAmt = parseFloat(amount);
    if (!name || isNaN(bAmt) || bAmt <= 0) return;

    await moneyService.createBill({
      name,
      amount: bAmt,
      category: 'Subscriptions',
      due_date: dueDate,
      frequency: 'Monthly',
      reminder_enabled: true,
    });

    setName('');
    setAmount('');
    setIsModalOpen(false);
    await loadBills();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Bills & Recurring Expenses</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track upcoming bills and record automated payment debits
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bill</span>
        </button>
      </div>

      <div className="space-y-3">
        {bills.map((bill) => (
          <div
            key={bill.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{bill.name}</h3>
                {bill.is_paid && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                    Paid
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Due: {bill.due_date} • Frequency: {bill.frequency}</p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                {formatCurrency(bill.amount)}
              </span>

              {!bill.is_paid && (
                <button
                  onClick={() => handleMarkPaid(bill.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Mark as Paid</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Add Recurring Bill</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Bill Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Internet, Electricity"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Amount (₦) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="25000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
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
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
