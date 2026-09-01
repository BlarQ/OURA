'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sun, Moon, CheckSquare, Clock, DollarSign, Plus, ArrowUpRight, ArrowDownRight,
  ChevronRight, Calendar, AlertCircle, Compass, Flag, ShieldCheck, Play
} from 'lucide-react';
import { Task, Activity, Plan, Goal, Bill } from '@/types';
import { taskService } from '@/lib/services/tasks';
import { activityService } from '@/lib/services/activities';
import { moneyService } from '@/lib/services/money';
import { planService } from '@/lib/services/plans';
import { goalService } from '@/lib/services/goals';
import { formatCurrency } from '@/lib/calculations/money';
import { localStore } from '@/lib/supabase/client';
import { profileService } from '@/lib/services/profile';

interface TodayDashboardProps {
  onOpenQuickCreate: () => void;
  onOpenTimer: () => void;
}

export function TodayDashboard({ onOpenQuickCreate, onOpenTimer }: TodayDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [userName, setUserName] = useState<string>('User');
  const [moneySummary, setMoneySummary] = useState({
    availableBalance: 0,
    monthIncome: 0,
    monthExpenses: 0,
    spentToday: 0,
  });

  const todayDate = new Date();
  const currentHour = todayDate.getHours();
  let greeting = 'Good Morning';
  let GreetingIcon = Sun;

  if (currentHour >= 12 && currentHour < 17) {
    greeting = 'Good Afternoon';
    GreetingIcon = Sun;
  } else if (currentHour >= 17 || currentHour < 5) {
    greeting = 'Good Evening';
    GreetingIcon = Moon;
  }

  const formattedDate = todayDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const [payWindowStatus, setPayWindowStatus] = useState<any>(null);

  const loadData = async () => {
    const profile = await profileService.getProfile();
    if (profile.full_name && profile.full_name.trim() !== '') {
      const firstName = profile.full_name.split(' ')[0];
      setUserName(firstName);
    }

    const todayTasks = await taskService.getTodayTasks();
    setTasks(todayTasks.length > 0 ? todayTasks : localStore.tasks);
    const todayActs = await activityService.getTodayActivities();
    setActivities(todayActs);
    const allPlans = await planService.getPlans();
    setPlans(allPlans);
    const allGoals = await goalService.getGoals();
    setGoals(allGoals);
    const allBills = await moneyService.getBills();
    setBills(allBills.filter((b) => !b.is_paid));
    const financial = await moneyService.getFinancialOverview();
    setMoneySummary(financial);
    const status = moneyService.getPayWindowStatus();
    setPayWindowStatus(status);
  };

  useEffect(() => {
    loadData();

    if (typeof window !== 'undefined') {
      window.addEventListener('oura_balance_updated', loadData);
      return () => window.removeEventListener('oura_balance_updated', loadData);
    }
  }, []);

  const handleClaimSalary = async () => {
    const record = await moneyService.claimMonthlySalary();
    if (record) {
      const status = moneyService.getPayWindowStatus();
      setPayWindowStatus(status);
      const financial = await moneyService.getFinancialOverview();
      setMoneySummary(financial);
    }
  };

  const completedTasksCount = tasks.filter((t) => t.status === 'Completed').length;
  const taskProgress = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  const handleToggleTask = async (id: string) => {
    await taskService.toggleTaskStatus(id);
    const updatedTasks = await taskService.getTasks();
    setTasks(updatedTasks);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12 select-none">
      {/* 1. Header & Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
            <GreetingIcon className="w-4 h-4 text-amber-300" />
            <span>{formattedDate}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
            {greeting}, {userName} 👋
          </h1>
          <p className="text-indigo-200 text-sm max-w-lg">
            Plan your life. Manage your day. Control your money. Achieve your goals.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={onOpenQuickCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-indigo-950 hover:bg-indigo-50 text-xs font-extrabold shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Create</span>
          </button>
        </div>
      </div>

      {/* Salary Payout Active Prompt Card */}
      {payWindowStatus && payWindowStatus.isActive && !payWindowStatus.isClaimed && (
        <div className="p-5 rounded-3xl bg-linear-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/40 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <DollarSign className="w-6 h-6 stroke-3" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Monthly Salary Available ({payWindowStatus.cycleMonth})</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Confirm salary received to credit <span className="font-extrabold text-emerald-400">{formatCurrency(payWindowStatus.netSalary)}</span> to your available balance.
              </p>
            </div>
          </div>

          <button
            onClick={handleClaimSalary}
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shrink-0 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <DollarSign className="w-4 h-4 stroke-3" />
            <span>Confirm Payout Received</span>
          </button>
        </div>
      )}

      {/* 2. Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Progress Gauge */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today's Tasks Progress
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {taskProgress}%
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {completedTasksCount} of {tasks.length} Done
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-indigo-600 to-indigo-500 transition-all duration-500 rounded-full"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Financial Balance Widget */}
        <Link href="/money/overview" className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Available Balance
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white block">
              {formatCurrency(moneySummary.availableBalance)}
            </span>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Spent Today:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(moneySummary.spentToday)}</span>
            </div>
          </div>
        </Link>

        {/* Monthly Income Widget */}
        <Link href="/money/income" className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Income This Month
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white block">
              {formatCurrency(moneySummary.monthIncome)}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Salary & Freelance
            </span>
          </div>
        </Link>

        {/* Monthly Expenses Widget */}
        <Link href="/money/expenses" className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Expenses This Month
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white block">
              {formatCurrency(moneySummary.monthExpenses)}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Debits & Purchases
            </span>
          </div>
        </Link>
      </div>

      {/* 3. Main Dashboard Layout (2 Columns on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Today's Tasks & Activities */}
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Tasks Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Today's Tasks
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    What do you need to accomplish today?
                  </p>
                </div>
              </div>
              <Link
                href="/tasks"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <span>View</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Task Items */}
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No tasks scheduled for today. Click Quick Create to add one.
                </div>
              ) : (
                tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between p-4 rounded-2xl border transition-all ${
                      task.status === 'Completed'
                        ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-75'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center transition-colors ${
                          task.status === 'Completed'
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                        }`}
                      >
                        {task.status === 'Completed' && <CheckSquare className="w-3.5 h-3.5 stroke-3" />}
                      </button>
                      <div className="space-y-1 flex-1 min-w-0">
                        <span
                          className={`text-sm font-bold block truncate ${
                            task.status === 'Completed'
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-1 text-[11px] font-medium text-slate-400">
                          {task.due_time && (
                            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                              <Clock className="w-3 h-3" />
                              {task.due_time}
                            </span>
                          )}
                          {task.project_name && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {task.project_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                        task.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : task.priority === 'High'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Plans & Apartment Setup Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Active Plans
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track multi-item goals and planned expenses
                  </p>
                </div>
              </div>
              <Link
                href="/plans"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <span>View</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {plans.map((plan) => (
                <Link
                  key={plan.id}
                  href="/plans"
                  className="block p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      {plan.progress}% Done
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Total Estimated</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(plan.total_estimated || 0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Actual Purchased</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(plan.total_actual || 0)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Upcoming Bills, Goals & Quick Reminders */}
        <div className="space-y-8">
          {/* Upcoming Bills Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Upcoming Bills
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Recurring payments due
                  </p>
                </div>
              </div>
              <Link href="/money/bills" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span>View</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {bills.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No unpaid bills due soon!</p>
              ) : (
                bills.slice(0, 3).map((bill) => (
                  <div
                    key={bill.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{bill.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Due: {bill.due_date}</p>
                    </div>
                    <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                      {formatCurrency(bill.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Goals Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Primary Goals
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Milestones & Targets
                  </p>
                </div>
              </div>
              <Link href="/goals" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span>View</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {goals.map((goal) => (
                <div key={goal.id} className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{goal.title}</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{goal.progress}%</span>
                  </div>
                  {goal.target_amount && goal.target_amount > 0 ? (
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatCurrency(goal.current_amount || 0)} saved
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {formatCurrency(Math.max(0, goal.target_amount - (goal.current_amount || 0)))} left
                      </span>
                    </div>
                  ) : null}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-linear-to-r from-emerald-500 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
