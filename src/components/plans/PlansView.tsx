'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Plus, CheckCircle, AlertTriangle, ShoppingBag, Clock } from 'lucide-react';
import { Plan, PlanItem } from '@/types';
import { planService } from '@/lib/services/plans';
import { formatCurrency } from '@/lib/calculations/money';
import { PurchasedModal } from './PurchasedModal';

export function PlansView() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [purchasingItem, setPurchasingItem] = useState<{ planId: string; item: PlanItem } | null>(null);
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  // Form states
  const [planName, setPlanName] = useState('');
  const [planBudget, setPlanBudget] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemEstAmount, setItemEstAmount] = useState('');

  const loadPlans = async () => {
    const list = await planService.getPlans();
    setPlans(list);
    if (list.length > 0 && !activePlanId) {
      setActivePlanId(list[0].id);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const activePlan = plans.find((p) => p.id === activePlanId) || plans[0];

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    await planService.createPlan({
      name: planName.trim(),
      budget: parseFloat(planBudget) || 0,
      status: 'Active',
      progress: 0,
    });

    setPlanName('');
    setPlanBudget('');
    setIsNewPlanModalOpen(false);
    await loadPlans();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlanId || !itemName.trim()) return;

    await planService.addPlanItem(activePlanId, {
      name: itemName.trim(),
      estimated_amount: parseFloat(itemEstAmount) || 0,
      quantity: 1,
      priority: 'Medium',
      status: 'Planned',
    });

    setItemName('');
    setItemEstAmount('');
    setIsNewItemModalOpen(false);
    await loadPlans();
  };

  const handleConfirmPurchase = async (actualAmount: number) => {
    if (!purchasingItem) return;
    await planService.markItemPurchased(purchasingItem.planId, purchasingItem.item.id, actualAmount);
    setPurchasingItem(null);
    await loadPlans();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            Plans & Planned Expenses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize apartment moves, major purchases, and multi-item project budgets
          </p>
        </div>

        <button
          onClick={() => setIsNewPlanModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Plan</span>
        </button>
      </div>

      {/* Plans Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setActivePlanId(plan.id)}
            className={`px-5 py-3 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 ${
              activePlanId === plan.id
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span>{plan.name}</span>
            <span className="px-2 py-0.5 rounded-full bg-black/10 text-[10px]">{plan.progress}%</span>
          </button>
        ))}
      </div>

      {activePlan && (
        <div className="space-y-6">
          {/* Plan Budget & Progress Summary Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{activePlan.name}</h2>
                <p className="text-xs text-slate-500">{activePlan.description || 'No description provided'}</p>
              </div>

              <button
                onClick={() => setIsNewItemModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Plan Item</span>
              </button>
            </div>

            {/* Financial Overview Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 block">Total Estimated Cost</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(activePlan.total_estimated || 0)}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900">
                <span className="text-emerald-700 dark:text-emerald-300 block">Actual Purchased Spent</span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(activePlan.total_actual || 0)}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900">
                <span className="text-amber-700 dark:text-amber-300 block">Remaining Budget</span>
                <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                  {formatCurrency((activePlan.budget || 0) - (activePlan.total_actual || 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Plan Items Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Plan Items List</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="p-3.5">Item Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Estimated Cost</th>
                    <th className="p-3.5 text-right">Actual Cost</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                  {activePlan.items && activePlan.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="p-3.5 text-slate-500">{item.category || 'General'}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.estimated_amount)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {item.actual_amount ? formatCurrency(item.actual_amount) : '—'}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                            item.status === 'Purchased'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {item.status !== 'Purchased' ? (
                          <button
                            onClick={() => setPurchasingItem({ planId: activePlan.id, item })}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all inline-flex items-center gap-1"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Mark as Purchased</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">Purchased on {item.purchased_date}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Purchased Modal */}
      {purchasingItem && (
        <PurchasedModal
          item={purchasingItem.item}
          onClose={() => setPurchasingItem(null)}
          onConfirmPurchase={handleConfirmPurchase}
        />
      )}

      {/* Add Plan Modal */}
      {isNewPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Create Plan</h2>
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Plan Name (e.g. Apartment Move)"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
              <input
                type="number"
                placeholder="Target Budget (₦)"
                value={planBudget}
                onChange={(e) => setPlanBudget(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-extrabold shadow-md"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Plan Item Modal */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Add Plan Item</h2>
            <form onSubmit={handleAddItem} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Item Name (e.g. Refrigerator, TV)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
              <input
                type="number"
                required
                min="1"
                placeholder="Estimated Amount (₦)"
                value={itemEstAmount}
                onChange={(e) => setItemEstAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow-md"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
