'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, BarChart3, Activity, CheckSquare, Layers } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { moneyService } from '@/lib/services/money';
import { taskService } from '@/lib/services/tasks';
import { activityService } from '@/lib/services/activities';

const CATEGORY_COLORS: { [key: string]: string } = {
  Housing: '#6366f1',
  Food: '#10b981',
  Transport: '#f59e0b',
  Internet: '#ef4444',
  Subscriptions: '#8b5cf6',
  Entertainment: '#ec4899',
  Health: '#14b8a6',
  Shopping: '#f97316',
  General: '#64748b',
};

export function InsightsView() {
  const [financialData, setFinancialData] = useState<{ month: string; income: number; expense: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [productivityData, setProductivityData] = useState<{ day: string; tasks: number; workHours: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInsightsData() {
      setIsLoading(true);

      const incomeRecords = await moneyService.getIncomeRecords();
      const expenseRecords = await moneyService.getExpenseRecords();
      const tasks = await taskService.getTasks();
      const activities = await activityService.getActivities();

      // 1. Calculate Monthly Income vs Expenses (Last 6 months)
      const monthlyMap: { [monthKey: string]: { month: string; income: number; expense: number } } = {};

      incomeRecords.forEach((inc) => {
        if (!inc.date) return;
        const monthKey = inc.date.substring(0, 7); // YYYY-MM
        const monthLabel = new Date(inc.date).toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { month: monthLabel, income: 0, expense: 0 };
        }
        monthlyMap[monthKey].income += inc.amount || 0;
      });

      expenseRecords.forEach((exp) => {
        if (!exp.date) return;
        const monthKey = exp.date.substring(0, 7);
        const monthLabel = new Date(exp.date).toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { month: monthLabel, income: 0, expense: 0 };
        }
        monthlyMap[monthKey].expense += exp.amount || 0;
      });

      const sortedMonths = Object.keys(monthlyMap)
        .sort()
        .slice(-6)
        .map((k) => monthlyMap[k]);

      setFinancialData(sortedMonths);

      // 2. Calculate Spending by Category
      const catMap: { [cat: string]: number } = {};
      expenseRecords.forEach((exp) => {
        const cat = exp.category || 'General';
        catMap[cat] = (catMap[cat] || 0) + (exp.amount || 0);
      });

      const colorPalette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
      const formattedCategoryData = Object.keys(catMap).map((cat, idx) => ({
        name: cat,
        value: catMap[cat],
        color: CATEGORY_COLORS[cat] || colorPalette[idx % colorPalette.length],
      }));

      setCategoryData(formattedCategoryData);

      // 3. Calculate Daily Tasks Completed & Work Hours (Last 7 days)
      const last7Days: { [dateStr: string]: { day: string; tasks: number; workHours: number } } = {};
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleString('default', { weekday: 'short' });
        last7Days[dateStr] = { day: dayLabel, tasks: 0, workHours: 0 };
      }

      tasks.forEach((t) => {
        if (t.status === 'Completed' && t.due_date && last7Days[t.due_date]) {
          last7Days[t.due_date].tasks += 1;
        }
      });

      activities.forEach((a) => {
        if (a.activity_date && last7Days[a.activity_date]) {
          const hours = Number(((a.duration_minutes || 0) / 60).toFixed(1));
          last7Days[a.activity_date].workHours += hours;
        }
      });

      setProductivityData(Object.values(last7Days));
      setIsLoading(false);
    }

    loadInsightsData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <PieChart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Productivity & Financial Insights
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Real-time analytical breakdowns calculated from your database records
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income vs Expenses Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Monthly Income vs Expenses</h2>
          
          {financialData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <p>No income or expense records found yet.</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} name="Income (₦)" />
                  <Bar dataKey="expense" fill="#f43f5e" radius={[8, 8, 0, 0]} name="Expenses (₦)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Spending by Category Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Spending by Category</h2>
          
          {categoryData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <PieChart className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <p>No expense categories logged yet.</p>
            </div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Daily Tasks Completed & Focus Work Hours */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-2">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Daily Tasks Completed & Focus Work Hours (Last 7 Days)</h2>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productivityData}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="tasks" stroke="#6366f1" strokeWidth={3} name="Tasks Completed" />
                <Line type="monotone" dataKey="workHours" stroke="#3b82f6" strokeWidth={3} name="Work Hours" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
