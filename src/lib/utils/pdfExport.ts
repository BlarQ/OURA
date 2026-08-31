import { moneyService } from '../services/money';
import { taskService } from '../services/tasks';
import { projectService } from '../services/projects';
import { formatCurrency } from '../calculations/money';

export async function generateTransactionsPDF() {
  if (typeof window === 'undefined') return;

  const transactions = await moneyService.getTransactions();
  const overview = await moneyService.getFinancialOverview();

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const todayStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>OURA Financial Statement - ${todayStr}</title>
        <style>
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            color: #0f172a;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 900;
            color: #4f46e5;
            letter-spacing: -0.025em;
          }
          .tagline {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 16px;
            border-radius: 12px;
          }
          .card-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.05em;
          }
          .card-value {
            font-size: 18px;
            font-weight: 800;
            margin-top: 4px;
          }
          .credit { color: #10b981; }
          .debit { color: #ef4444; }
          .balance { color: #4f46e5; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background: #f1f5f9;
            text-align: left;
            padding: 10px 12px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: #475569;
            border-bottom: 2px solid #cbd5e1;
          }
          td {
            padding: 10px 12px;
            font-size: 11px;
            border-bottom: 1px solid #e2e8f0;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">OURA Financial Statement</div>
            <div class="tagline">Personal Life, Activity & Financial Operating System</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 700;">Date: ${todayStr}</div>
            <div style="font-size: 10px; color: #64748b;">Currency: NGN (₦)</div>
          </div>
        </div>

        <div class="summary-cards">
          <div class="card">
            <div class="card-title">Available Balance</div>
            <div class="card-value balance">${formatCurrency(overview.availableBalance)}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Credits (Income)</div>
            <div class="card-value credit">${formatCurrency(overview.totalCredits)}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Debits (Expenses)</div>
            <div class="card-value debit">${formatCurrency(overview.totalDebits)}</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 800; margin-bottom: 10px;">Transaction History Ledger (${transactions.length} Records)</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map((tx) => `
              <tr>
                <td>${tx.transaction_date}</td>
                <td><strong class="${tx.type === 'CREDIT' ? 'credit' : 'debit'}">${tx.type}</strong></td>
                <td>${tx.category}</td>
                <td>${tx.description || '-'}</td>
                <td style="text-align: right;" class="${tx.type === 'CREDIT' ? 'credit' : 'debit'}">
                  ${tx.type === 'CREDIT' ? '+' : '-'}${formatCurrency(tx.amount)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by OURA Personal Operating System • ${todayStr}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export async function generateFullExecutivePDF() {
  if (typeof window === 'undefined') return;

  const overview = await moneyService.getFinancialOverview();
  const tasks = await taskService.getTasks();
  const projects = await projectService.getProjects();
  const bills = await moneyService.getBills();

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const todayStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>OURA Executive Summary - ${todayStr}</title>
        <style>
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            color: #0f172a;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo { font-size: 26px; font-weight: 900; color: #4f46e5; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px; }
          .title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
          .val { font-size: 22px; font-weight: 900; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 30px; }
          th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 11px; color: #475569; border-bottom: 2px solid #cbd5e1; }
          td { padding: 10px; font-size: 11px; border-bottom: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">OURA Executive Report</div>
            <div style="font-size: 11px; color: #64748b;">Complete Life, Project & Financial Performance Summary</div>
          </div>
          <div style="font-size: 12px; font-weight: 700;">${todayStr}</div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="title">Net Available Balance</div>
            <div class="val" style="color: #4f46e5;">${formatCurrency(overview.availableBalance)}</div>
          </div>
          <div class="box">
            <div class="title">Tasks Completion Rate</div>
            <div class="val" style="color: #10b981;">${completedTasks} / ${tasks.length} Done</div>
          </div>
          <div class="box">
            <div class="title">Active Projects</div>
            <div class="val" style="color: #8b5cf6;">${projects.length} Active</div>
          </div>
          <div class="box">
            <div class="title">Upcoming Due Bills</div>
            <div class="val" style="color: #ef4444;">${bills.filter(b => !b.is_paid).length} Pending</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 800;">Projects Performance Overview</h3>
        <table>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map((p) => `
              <tr>
                <td><strong>${p.name}</strong></td>
                <td>${p.status}</td>
                <td>${p.priority}</td>
                <td><strong>${p.progress}%</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
