import type { WeeklyActivity } from '@/types/database.types';

interface WeekdayInfo {
  dateObj: Date;
  dateStr: string;
  dayName: string;
  shortDay: string;
  formattedDate: string;
}

/**
 * Export Weekly Tasks to an Excel-compatible CSV file (with UTF-8 BOM)
 */
export function exportScheduleToExcel(
  weekRangeTitle: string,
  weekDays: WeekdayInfo[],
  activitiesByDate: { [dateStr: string]: WeeklyActivity[] }
) {
  const headers = [
    'Weekday',
    'Date',
    'Time Slot',
    'Task Title',
    'Priority',
    'Status',
    'Linked Procedure Playbook',
    'Planned Notes / Description',
    'Execution / Completion Notes',
    'Completed Timestamp',
  ];

  const rows: string[][] = [];

  weekDays.forEach((day) => {
    const dayActs = activitiesByDate[day.dateStr] || [];
    if (dayActs.length === 0) {
      rows.push([
        day.dayName,
        day.dateStr,
        '—',
        'No activities scheduled',
        '—',
        '—',
        '—',
        '—',
        '—',
        '—',
      ]);
    } else {
      dayActs.forEach((act) => {
        rows.push([
          day.dayName,
          act.activity_date,
          act.time_slot || 'All Day',
          act.title,
          act.priority.toUpperCase(),
          act.is_completed ? 'COMPLETED' : 'PENDING',
          act.manual_title || 'None',
          act.description || '—',
          act.completion_notes || '—',
          act.completed_at ? new Date(act.completed_at).toLocaleString() : '—',
        ]);
      });
    }
  });

  // Escape CSV strings
  const escapeCsv = (str: string) => {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Excel
    `"AdeManual IT Operations Schedule - ${weekRangeTitle}"\n\n` +
    headers.map(escapeCsv).join(',') +
    '\n' +
    rows.map((row) => row.map(escapeCsv).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AdeManual_Schedule_${weekRangeTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Weekly Tasks to a styled Word Document (.doc format compatible with Microsoft Word / LibreOffice)
 */
export function exportScheduleToWord(
  weekRangeTitle: string,
  weekDays: WeekdayInfo[],
  activitiesByDate: { [dateStr: string]: WeeklyActivity[] }
) {
  let totalTasks = 0;
  let completedTasks = 0;

  Object.values(activitiesByDate).forEach((acts) => {
    acts.forEach((a) => {
      totalTasks++;
      if (a.is_completed) completedTasks++;
    });
  });

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>AdeManual IT Operations Schedule</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #040404; margin: 24px; line-height: 1.5; }
    .header-box { background: #040404; color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 24px; }
    .header-box h1 { margin: 0 0 6px 0; font-size: 24px; color: #98e58e; }
    .header-box p { margin: 0; font-size: 13px; color: #cbcece; }
    .summary-card { background: #f4f4f4; border: 1px solid #d9d9d9; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; }
    .day-section { margin-bottom: 28px; }
    .day-title { font-size: 18px; font-weight: bold; border-bottom: 2px solid #040404; padding-bottom: 4px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th { background: #f4f4f4; text-align: left; padding: 8px 10px; border: 1px solid #d9d9d9; font-weight: bold; }
    td { padding: 8px 10px; border: 1px solid #d9d9d9; vertical-align: top; }
    .badge-done { background: #98e58e; color: #040404; font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 10px; display: inline-block; }
    .badge-pending { background: #e2e8f0; color: #475569; font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 10px; display: inline-block; }
    .badge-critical { background: #fee2e2; color: #b91c1c; font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 10px; display: inline-block; }
    .exec-notes { background: #f0fdf4; border-left: 3px solid #16a34a; padding: 6px 10px; margin-top: 4px; font-style: italic; font-size: 11px; }
    .footer { font-size: 11px; color: #6e797a; text-align: center; border-top: 1px solid #d9d9d9; padding-top: 12px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="header-box">
    <h1>AdeManual • IT Operations Weekly Report</h1>
    <p>Weekly Procedure Schedule & Execution Log: <strong>${weekRangeTitle}</strong></p>
  </div>

  <div class="summary-card">
    <strong>Weekly Executive Summary:</strong> ${totalTasks} Total Scheduled Tasks • ${completedTasks} Completed (${completionRate}% Completion Rate) • Mon – Fri IT Operations.
  </div>
`;

  weekDays.forEach((day) => {
    const dayActs = activitiesByDate[day.dateStr] || [];
    docContent += `
  <div class="day-section">
    <div class="day-title">${day.dayName} (${day.formattedDate})</div>
`;

    if (dayActs.length === 0) {
      docContent += `<p style="color: #6e797a; font-size: 12px;">No operational activities scheduled for this day.</p>`;
    } else {
      docContent += `
    <table>
      <thead>
        <tr>
          <th style="width: 12%;">Time</th>
          <th style="width: 30%;">Task Title</th>
          <th style="width: 10%;">Priority</th>
          <th style="width: 12%;">Status</th>
          <th style="width: 36%;">Execution Notes & Details</th>
        </tr>
      </thead>
      <tbody>
`;

      dayActs.forEach((act) => {
        const statusBadge = act.is_completed
          ? `<span class="badge-done">COMPLETED</span>`
          : `<span class="badge-pending">PENDING</span>`;

        const priorityBadge =
          act.priority === 'critical'
            ? `<span class="badge-critical">CRITICAL</span>`
            : act.priority.toUpperCase();

        let detailsHtml = '';
        if (act.description) {
          detailsHtml += `<div><strong>Plan:</strong> ${act.description}</div>`;
        }
        if (act.manual_title) {
          detailsHtml += `<div><strong>Linked Playbook:</strong> 📖 ${act.manual_title}</div>`;
        }
        if (act.completion_notes) {
          detailsHtml += `<div class="exec-notes"><strong>Execution Log:</strong> "${act.completion_notes}"</div>`;
        }
        if (!detailsHtml) detailsHtml = '—';

        docContent += `
        <tr>
          <td><strong>${act.time_slot || 'All Day'}</strong></td>
          <td><strong>${act.title}</strong></td>
          <td>${priorityBadge}</td>
          <td>${statusBadge}</td>
          <td>${detailsHtml}</td>
        </tr>
`;
      });

      docContent += `
      </tbody>
    </table>
`;
    }

    docContent += `</div>`;
  });

  docContent += `
  <div class="footer">
    AdeManual IT Operating Procedures & Execution System • Confidential IT Operations Document • Generated on ${new Date().toLocaleDateString()}
  </div>
</body>
</html>
`;

  const blob = new Blob([docContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AdeManual_Operations_Report_${weekRangeTitle.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
