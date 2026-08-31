'use client';

import React, { useState } from 'react';
import { Settings, Download, Trash2, ShieldAlert, User, DollarSign, FileText, Sparkles } from 'lucide-react';
import { localStore } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/calculations/money';
import { generateTransactionsPDF, generateFullExecutivePDF } from '@/lib/utils/pdfExport';
import { showConfirmModal, showToast } from '@/components/layout/ConfirmModal';

export function SettingsView() {
  const [name, setName] = useState(localStore.profile.full_name);
  const [email, setEmail] = useState(localStore.profile.email);
  const [minBalance, setMinBalance] = useState(localStore.profile.minimum_safe_balance.toString());

  const handleStartTour = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oura_start_app_tour'));
    }
  };

  const handleExportCSV = () => {
    // Generate CSV for transactions
    const headers = ['Date', 'Type', 'Amount', 'Category', 'Description'];
    const rows = localStore.transactions.map((tx) => [
      tx.transaction_date,
      tx.type,
      tx.amount,
      tx.category,
      `"${tx.description.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OURA_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMin = parseFloat(minBalance) || 100000;
    localStore.profile.full_name = name;
    localStore.profile.email = email;
    localStore.profile.minimum_safe_balance = parsedMin;

    const { supabase } = await import('@/lib/supabase/client');
    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user?.id) {
          await supabase
            .from('profiles')
            .upsert({
              id: userData.user.id,
              full_name: name,
              email: email,
              minimum_safe_balance: parsedMin,
              updated_at: new Date().toISOString(),
            });
        }
      } catch (err) {}
    }

    showToast('Settings & Minimum Safe Balance updated successfully!', 'success');
  };

  const handleDeleteAccount = () => {
    showConfirmModal({
      title: 'Permanently Delete OURA Account?',
      message: 'Are you sure you want to permanently delete your OURA account? This action will erase stored tasks, activities, and financial ledgers. This action cannot be undone.',
      isDanger: true,
      confirmText: 'Delete Account',
      onConfirm: () => {
        localStore.transactions = [];
        localStore.tasks = [];
        localStore.projects = [];
        showToast('Account data cleared successfully.', 'info');
      },
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Settings & Account Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Profile details, currency options, minimum safe balance, and data export
          </p>
        </div>

        <button
          onClick={handleStartTour}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Restart App Tour</span>
        </button>
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-500" />
          User Profile & Minimum Safe Balance
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Primary Currency</label>
              <select
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-500 font-bold"
              >
                <option value="NGN">NGN (Nigerian Naira - ₦)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Minimum Safe Balance (₦)</label>
              <input
                type="number"
                required
                min="0"
                value={minBalance}
                onChange={(e) => setMinBalance(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all"
          >
            Save Settings
          </button>
        </form>
      </div>

      {/* Data Export Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-500" />
          Data Export
        </h2>
        <p className="text-xs text-slate-500">
          Download your transaction ledger and executive performance summaries in CSV or PDF formats
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExportCSV}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Transactions CSV</span>
          </button>

          <button
            onClick={() => generateTransactionsPDF()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Export Transactions PDF</span>
          </button>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="bg-rose-50 dark:bg-rose-950/40 p-6 rounded-3xl border border-rose-200 dark:border-rose-900 space-y-4">
        <h2 className="text-base font-extrabold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-xs text-rose-600 dark:text-rose-400">
          Permanently delete your OURA account and erase stored tasks, activities, and financial ledgers.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Account</span>
        </button>
      </div>
    </div>
  );
}
