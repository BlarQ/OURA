import { Notification, NotificationPreferences } from '@/types';
import { localStore, saveLocalStore } from '../supabase/client';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const todayStr = new Date().toISOString().split('T')[0];
    const generated: Notification[] = [];

    // Check for missed / overdue tasks
    localStore.tasks.forEach((t) => {
      if (t.status !== 'Completed' && t.due_date && t.due_date < todayStr) {
        generated.push({
          id: `missed_task_${t.id}`,
          user_id: localStore.profile.id,
          title: `Missed Task: ${t.title}`,
          message: `Scheduled task was due on ${t.due_date} ${t.due_time || ''}.`,
          type: 'TASK_OVERDUE',
          status: 'Sent',
          scheduled_for: t.due_date,
          created_at: t.due_date,
        });
      }
    });

    // Check for missed / overdue bills
    localStore.bills.forEach((b) => {
      if (!b.is_paid && b.due_date && b.due_date < todayStr) {
        generated.push({
          id: `missed_bill_${b.id}`,
          user_id: localStore.profile.id,
          title: `Missed Bill Payment: ${b.name}`,
          message: `Bill of ₦${b.amount.toLocaleString()} was due on ${b.due_date}.`,
          type: 'BILL_REMINDER',
          status: 'Sent',
          scheduled_for: b.due_date,
          created_at: b.due_date,
        });
      }
    });

    const all = [...generated, ...localStore.notifications];

    // Deduplicate by ID
    const seen = new Set<string>();
    return all.filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  },

  async getUnreadCount(): Promise<number> {
    const list = await this.getNotifications();
    return list.filter((n) => n.status !== 'Read').length;
  },

  async markAsRead(id: string): Promise<boolean> {
    const notif = localStore.notifications.find((n) => n.id === id);
    if (notif) {
      notif.status = 'Read';
      notif.read_at = new Date().toISOString();
      saveLocalStore();
    }
    return true;
  },

  async markAllAsRead(): Promise<boolean> {
    localStore.notifications.forEach((n) => {
      n.status = 'Read';
      n.read_at = new Date().toISOString();
    });
    saveLocalStore();
    return true;
  },

  async getPreferences(): Promise<NotificationPreferences> {
    return { ...localStore.notificationPreferences };
  },

  async updatePreferences(updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    localStore.notificationPreferences = {
      ...localStore.notificationPreferences,
      ...updates,
    };
    saveLocalStore();
    return { ...localStore.notificationPreferences };
  },
};
