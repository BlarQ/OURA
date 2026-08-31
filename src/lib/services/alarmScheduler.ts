import { taskService } from './tasks';
import { moneyService } from './money';
import { triggerSystemNotification } from '../utils/audio';

const triggeredAlarms = new Set<string>();

export function initAlarmScheduler() {
  if (typeof window === 'undefined') return;

  const checkAlarms = async () => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const hoursStr = String(now.getHours()).padStart(2, '0');
      const minsStr = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hoursStr}:${minsStr}`;

      // Check Tasks
      const tasks = await taskService.getTasks();
      for (const task of tasks) {
        if (!task.notification_enabled || task.status === 'Completed') continue;
        if (!task.due_date || task.due_date !== todayStr) continue;

        const dueTime = task.due_time || '09:00';
        const alarmKey = `task_${task.id}_${task.due_date}_${dueTime}`;

        if (triggeredAlarms.has(alarmKey)) continue;

        if (currentTimeStr >= dueTime) {
          triggeredAlarms.add(alarmKey);

          // Dispatch Interactive Blasting Ringtone Event
          window.dispatchEvent(new CustomEvent('oura_alarm_triggered', {
            detail: {
              id: task.id,
              title: task.title,
              description: task.description,
              due_time: dueTime,
              type: 'TASK',
            },
          }));

          // Desktop System Notification
          triggerSystemNotification(`OURA Reminder: ${task.title}`, {
            body: task.description || `Task is due now (${dueTime})`,
            tag: alarmKey,
          });
        }
      }

      // Check Bills
      const bills = await moneyService.getBills();
      for (const bill of bills) {
        if (!bill.reminder_enabled || bill.is_paid) continue;
        if (bill.due_date !== todayStr) continue;

        const alarmKey = `bill_${bill.id}_${bill.due_date}`;
        if (triggeredAlarms.has(alarmKey)) continue;

        if (currentTimeStr >= '09:00') {
          triggeredAlarms.add(alarmKey);

          window.dispatchEvent(new CustomEvent('oura_alarm_triggered', {
            detail: {
              id: bill.id,
              title: `Bill Due: ${bill.name}`,
              description: `Amount: ₦${bill.amount.toLocaleString()}`,
              due_time: '09:00',
              type: 'BILL',
            },
          }));

          triggerSystemNotification(`OURA Bill Due: ${bill.name}`, {
            body: `Amount: ₦${bill.amount.toLocaleString()} is due today!`,
            tag: alarmKey,
          });
        }
      }

    } catch (err) {
      console.warn('Alarm scheduler error:', err);
    }
  };

  checkAlarms();
  const intervalId = setInterval(checkAlarms, 8000);

  return () => clearInterval(intervalId);
}
