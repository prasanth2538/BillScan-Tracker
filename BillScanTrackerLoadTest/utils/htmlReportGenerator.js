const fs = require('fs');
const path = require('path');

function generateHtmlReport(summary, testResults) {
  const reportDir = path.join(__dirname, '..', 'Test_Results');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const htmlPath = path.join(reportDir, 'load-testing-report.html');
  const rootHtmlPath = path.join(__dirname, '..', 'load-testing-report.html');

  const rowsHtml = testResults.map(t => `
    <tr class="${t.status === 'Passed' ? 'pass-row' : 'fail-row'}">
      <td><code>${t.testCaseId}</code></td>
      <td>${t.category}</td>
      <td>${t.name}</td>
      <td><span class="badge ${t.status === 'Passed' ? 'badge-pass' : 'badge-fail'}">${t.status}</span></td>
      <td>${t.duration} ms</td>
      <td>${t.error ? `<span class="err">${t.error}</span>` : 'N/A'}</td>
    </tr>
  `).join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BillScan Tracker - Load Testing Report (400 Tests)</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #38bdf8; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-top: 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
    .card { background: #1e293b; padding: 20px; border-radius: 8px; border: 1px solid #334155; text-align: center; }
    .card .number { font-size: 32px; font-weight: bold; margin-top: 8px; }
    .pass { color: #4ade80; }
    .fail { color: #f87171; }
    .info { color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; margin-top: 24px; }
    th { background: #334155; color: #f8fafc; text-align: left; padding: 12px 16px; font-size: 14px; }
    td { padding: 10px 16px; border-bottom: 1px solid #334155; font-size: 13px; }
    .badge { padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 11px; text-transform: uppercase; }
    .badge-pass { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
    .badge-fail { background: rgba(248, 113, 113, 0.2); color: #f87171; }
    .err { color: #f87171; font-family: monospace; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>BillScan Tracker — Backend Load Testing Execution (400 Test Cases)</h1>
    <div class="summary-grid">
      <div class="card"><div>Total Tests</div><div class="number info">${summary.total}</div></div>
      <div class="card"><div>Passed</div><div class="number pass">${summary.passed}</div></div>
      <div class="card"><div>Failed</div><div class="number fail">${summary.failed}</div></div>
      <div class="card"><div>Pass Rate</div><div class="number pass">${((summary.passed / summary.total) * 100).toFixed(1)}%</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Test Case ID</th>
          <th>Load Scenario Category</th>
          <th>Test Assertion / Check</th>
          <th>Status</th>
          <th>Latency (ms)</th>
          <th>Error Details</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  fs.writeFileSync(rootHtmlPath, htmlContent, 'utf8');
  console.log(`[HTML Report Generator] Saved load-testing-report.html successfully.`);
}

module.exports = { generateHtmlReport };
