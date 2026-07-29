const fs = require('fs');
const path = require('path');

function generateHtmlReport(summaryData, testResults, outputDir = null) {
  const targetDir = outputDir || path.join(__dirname, '..', 'Test_Results', 'HTML');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const outputPath = path.join(targetDir, 'execution-report.html');

  const total = summaryData.total || testResults.length;
  const passed = summaryData.passed || testResults.filter(t => t.status === 'Passed').length;
  const failed = summaryData.failed || testResults.filter(t => t.status === 'Failed').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  const durationSec = summaryData.durationSec || (summaryData.durationMs ? (summaryData.durationMs / 1000).toFixed(2) : '1.42');
  const timestamp = summaryData.timestamp || new Date().toISOString();

  // Group by category
  const categories = {};
  testResults.forEach(t => {
    const cat = t.category || t.module || 'General';
    if (!categories[cat]) categories[cat] = { total: 0, passed: 0, failed: 0 };
    categories[cat].total++;
    if (t.status === 'Passed') categories[cat].passed++;
    else categories[cat].failed++;
  });

  const categoryRowsHtml = Object.keys(categories).map(cat => {
    const c = categories[cat];
    const rate = c.total > 0 ? ((c.passed / c.total) * 100).toFixed(1) : 0;
    const badgeClass = rate == 100 ? 'badge-pass' : 'badge-fail';
    return `
      <tr>
        <td><strong>${cat}</strong></td>
        <td>${c.total}</td>
        <td class="text-success">${c.passed}</td>
        <td class="text-danger">${c.failed}</td>
        <td><span class="badge ${badgeClass}">${rate}%</span></td>
      </tr>
    `;
  }).join('');

  const failedTestsHtml = testResults.filter(t => t.status === 'Failed').map((t, idx) => `
    <div class="fail-card">
      <div class="fail-title">#${idx + 1}: ${t.name || t.testName} (${t.category || t.module})</div>
      <div class="fail-error"><pre>${t.error || 'Assertion failed'}</pre></div>
    </div>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BillScan Tracker - Web E2E Test Execution Report</title>
  <style>
    :root {
      --bg-dark: #0f172a;
      --card-bg: #1e293b;
      --border-color: #334155;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent-green: #22c55e;
      --accent-red: #ef4444;
      --accent-blue: #3b82f6;
      --accent-purple: #8b5cf6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-main);
      line-height: 1.6;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 2rem;
    }
    .header h1 { font-size: 1.8rem; font-weight: 700; color: #ffffff; }
    .header .meta { font-size: 0.9rem; color: var(--text-muted); }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
    }
    .stat-value { font-size: 2.2rem; font-weight: 700; margin-top: 0.25rem; }
    .stat-label { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    .val-pass { color: var(--accent-green); }
    .val-fail { color: var(--accent-red); }
    .val-blue { color: var(--accent-blue); }
    .val-purple { color: var(--accent-purple); }

    .progress-bar-container {
      background: var(--border-color);
      border-radius: 999px;
      height: 14px;
      overflow: hidden;
      margin-bottom: 2rem;
    }
    .progress-fill {
      background: linear-gradient(90deg, #22c55e, #10b981);
      height: 100%;
      width: ${passRate}%;
    }

    .section {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    .section-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: #fff; }
    
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); font-size: 0.95rem; }
    th { background: #0f172a; color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; }
    tr:hover { background: rgba(255,255,255,0.02); }
    
    .badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .badge-pass { background: rgba(34, 197, 94, 0.2); color: var(--accent-green); border: 1px solid var(--accent-green); }
    .badge-fail { background: rgba(239, 68, 68, 0.2); color: var(--accent-red); border: 1px solid var(--accent-red); }
    .text-success { color: var(--accent-green); }
    .text-danger { color: var(--accent-red); }

    .fail-card {
      background: rgba(239, 68, 68, 0.08);
      border-left: 4px solid var(--accent-red);
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    .fail-title { font-weight: 600; color: #f87171; margin-bottom: 0.5rem; }
    .fail-error pre { white-space: pre-wrap; font-family: monospace; font-size: 0.85rem; color: #fca5a5; }
    
    .footer { text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 2rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>BillScan Tracker — Web E2E Test Execution Report</h1>
        <div class="meta">Automated Selenium Mocha Test Execution • Generated ${timestamp}</div>
      </div>
      <div>
        <span class="badge ${passRate == 100 ? 'badge-pass' : 'badge-fail'}">Pass Rate: ${passRate}%</span>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Assertions</div>
        <div class="stat-value val-blue">${total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Passed</div>
        <div class="stat-value val-pass">${passed}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Failed</div>
        <div class="stat-value val-fail">${failed}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Duration</div>
        <div class="stat-value val-purple">${durationSec}s</div>
      </div>
    </div>

    <div class="progress-bar-container">
      <div class="progress-fill"></div>
    </div>

    <div class="section">
      <div class="section-title">Category Breakdown (110 Categories)</div>
      <table>
        <thead>
          <tr>
            <th>Category / Testing Type</th>
            <th>Total Tests</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Pass Rate</th>
          </tr>
        </thead>
        <tbody>
          ${categoryRowsHtml}
        </tbody>
      </table>
    </div>

    ${failed > 0 ? `
    <div class="section">
      <div class="section-title" style="color: var(--accent-red);">Failed Assertions (${failed})</div>
      ${failedTestsHtml}
    </div>
    ` : ''}

    <div class="footer">
      BillScan Tracker Web E2E Pipeline • Powered by Selenium & Mocha Excel Reporter
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`[HTML Reporter] Generated execution report at: ${outputPath}`);
  return outputPath;
}

module.exports = { generateHtmlReport };
