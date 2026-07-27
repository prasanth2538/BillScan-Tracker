const fs = require('fs');
const path = require('path');

function appendSummaryToGha(testResults) {
  const ghaSummaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!ghaSummaryFile) {
    console.log('[Summary Parser] GITHUB_STEP_SUMMARY environment variable not found. Skipping GHA summary append.');
    return;
  }

  const total = testResults.length;
  const passed = testResults.filter(t => t.status === 'Passed').length;
  const failed = testResults.filter(t => t.status === 'Failed').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  const markdown = `
# 📱 BillScan Tracker — Mobile Appium Android E2E Results

### 🧪 Execution Metrics
- **Total Android E2E Tests**: ${total} Tests
- **Categories Executed**: 11 Categories (101 tests per category)
- **Passed Tests**: ${passed} ✅
- **Failed Tests**: ${failed} ❌
- **Pass Rate**: ${passRate}%

---
`;

  fs.appendFileSync(ghaSummaryFile, markdown, 'utf8');
  console.log('[Summary Parser] Appended Mobile Appium summary to GITHUB_STEP_SUMMARY.');
}

module.exports = { appendSummaryToGha };
