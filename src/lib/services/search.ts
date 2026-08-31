import { GlobalSearchResult } from '@/types';
import { localStore } from '../supabase/client';
import { formatCurrency } from '../calculations/money';

export const searchService = {
  async searchAll(query: string): Promise<GlobalSearchResult[]> {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();
    const results: GlobalSearchResult[] = [];

    // Search Tasks
    for (const task of localStore.tasks) {
      if (task.title.toLowerCase().includes(q) || (task.description && task.description.toLowerCase().includes(q))) {
        results.push({
          id: task.id,
          type: 'TASK',
          title: task.title,
          subtitle: `Task • Priority: ${task.priority} • Due: ${task.due_date}`,
          url: `/tasks`,
          date: task.due_date,
        });
      }
    }

    // Search Activities
    for (const act of localStore.activities) {
      if (act.title.toLowerCase().includes(q) || (act.accomplishment && act.accomplishment.toLowerCase().includes(q))) {
        results.push({
          id: act.id,
          type: 'ACTIVITY',
          title: act.title,
          subtitle: `Activity • Duration: ${act.duration_minutes}m • Date: ${act.activity_date}`,
          url: `/activities`,
          date: act.activity_date,
        });
      }
    }

    // Search Projects
    for (const proj of localStore.projects) {
      if (proj.name.toLowerCase().includes(q) || (proj.description && proj.description.toLowerCase().includes(q))) {
        results.push({
          id: proj.id,
          type: 'PROJECT',
          title: proj.name,
          subtitle: `Project • Progress: ${proj.progress}% • Status: ${proj.status}`,
          url: `/projects`,
        });
      }
    }

    // Search Plans
    for (const plan of localStore.plans) {
      if (plan.name.toLowerCase().includes(q) || (plan.description && plan.description.toLowerCase().includes(q))) {
        results.push({
          id: plan.id,
          type: 'PLAN',
          title: plan.name,
          subtitle: `Plan • Target: ${plan.target_date || 'N/A'} • Budget: ${formatCurrency(plan.budget || 0)}`,
          url: `/plans`,
        });
      }

      if (plan.items) {
        for (const item of plan.items) {
          if (item.name.toLowerCase().includes(q)) {
            results.push({
              id: item.id,
              type: 'PLAN',
              title: item.name,
              subtitle: `Plan Item in "${plan.name}" • Est: ${formatCurrency(item.estimated_amount)}`,
              url: `/plans`,
            });
          }
        }
      }
    }

    // Search Expenses
    for (const exp of localStore.expenses) {
      if (exp.category.toLowerCase().includes(q) || (exp.description && exp.description.toLowerCase().includes(q))) {
        results.push({
          id: exp.id,
          type: 'EXPENSE',
          title: `${formatCurrency(exp.amount)} — ${exp.category}`,
          subtitle: `Expense • ${exp.description || exp.category} • Date: ${exp.date}`,
          url: `/money/expenses`,
          date: exp.date,
        });
      }
    }

    // Search Income
    for (const inc of localStore.income) {
      if (inc.source.toLowerCase().includes(q) || inc.category.toLowerCase().includes(q)) {
        results.push({
          id: inc.id,
          type: 'INCOME',
          title: `${formatCurrency(inc.amount)} — ${inc.source}`,
          subtitle: `Income • ${inc.category} • Date: ${inc.date}`,
          url: `/money/income`,
          date: inc.date,
        });
      }
    }

    // Search Goals
    for (const goal of localStore.goals) {
      if (goal.title.toLowerCase().includes(q) || (goal.description && goal.description.toLowerCase().includes(q))) {
        results.push({
          id: goal.id,
          type: 'GOAL',
          title: goal.title,
          subtitle: `Goal • Category: ${goal.category} • Progress: ${goal.progress}%`,
          url: `/goals`,
        });
      }
    }

    // Search Notes
    for (const note of localStore.notes) {
      if (note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)) {
        results.push({
          id: note.id,
          type: 'NOTE',
          title: note.title,
          subtitle: `Note • Attached: ${note.attached_type || 'General'}`,
          url: `/plans`,
        });
      }
    }

    return results;
  },
};
