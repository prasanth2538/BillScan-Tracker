const fs = require('fs');
const path = require('path');

function generateMobileHtmlReport(testResults, outputDir = null) {
  const targetDir = outputDir || path.join(__dirname, '..', 'Test_Results');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const outputPath = path.join(targetDir, 'execution-report.html');

  const total = testResults.length;
  const passed = testResults.filter(t => t.status === 'Passed').length;
  const failed = testResults.filter(t => t.status === 'Failed').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  const totalDurationMs = testResults.reduce((acc, t) => acc + (t.duration || 0), 0);
  const durationSec = (totalDurationMs / 1000).toFixed(2);

  const categories = {};
  testResults.forEach(t => {
    const cat = t.category || 'Mobile General';
    if (!categories[cat]) categories[cat] = { total: 0, passed: 0, failed: 0 };
    categories[cat].total++;
    if (t.status === 'Passed') categories[cat].passed++;
    else categories[cat].failed++;
  });

  const catRows = Object.keys(categories).map(cat => {
    const c = categories[cat];
    const rate = c.total > 0 ? ((c.passed / c.total) * 100).toFixed(1) : 0;
    return `
      <tr>
        <td><strong>${cat}</strong></td>
        <td>${c.total}</td>
        <td style="color:#22c55e;">${c.passed}</td>
        <td style="color:#ef4444;">${c.failed}</td>
        <td><span class="badge ${rate == 100 ? 'badge-pass' : 'badge-fail'}">${rate}%</span></td>
      </tr>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BillScan Tracker — Android Appium E2E Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1rem; text-align: center; }
    .stat-val { font-size: 2rem; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 0.75rem; border-bottom: 1px solid #334155; }
    th { background: #0f172a; color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; }
    .badge { padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.8rem; font-weight: bold; }
    .badge-pass { background: rgba(34,197,94,0.2); color: #22c55e; border: 1px solid #22c55e; }
    .badge-fail { background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid #ef4444; }
  </style>
</head>
<body>
  <h1>📱 BillScan Tracker — Android Appium E2E Execution Report</h1>
  <p style="color:#94a3b8; margin-bottom: 1.5rem;">Automated Android Appium Test Run • ${new Date().toISOString()}</p>

  <div class="grid">
    <div class="stat"><div style="color:#94a3b8;">TOTAL TESTS</div><div class="stat-val" style="color:#3b82f6;">${total}</div></div>
    <div class="stat"><div style="color:#94a3b8;">PASSED</div><div class="stat-val" style="color:#22c55e;">${passed}</div></div>
    <div class="stat"><div style="color:#94a3b8;">FAILED</div><div class="stat-val" style="color:#ef4444;">${failed}</div></div>
    <div class="stat"><div style="color:#94a3b8;">PASS RATE</div><div class="stat-val" style="color:#8b5cf6;">${passRate}%</div></div>
  </div>

  <div class="card">
    <h2>Mobile Category Breakdown (11 Categories)</h2>
    <table>
      <thead>
        <tr><th>Category</th><th>Total</th><th>Passed</th><th>Failed</th><th>Pass Rate</th></tr>
      </thead>
      <tbody>${catRows}</tbody>
    </table>
  </div>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`[Appium HTML Report] Saved HTML report to ${outputPath}`);
  return outputPath;
}

module.exports = { generateMobileHtmlReport };
