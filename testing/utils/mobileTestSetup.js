const fs = require('fs');
const path = require('path');
const excelReporter = require('./excelReporter');

async function takeMobileScreenshot(driver, testName) {
  const screenshotDir = path.join(__dirname, '..', 'reports', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const sanitizedName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `mobile_${sanitizedName}_${Date.now()}.png`;
  const filePath = path.join(screenshotDir, fileName);
  
  await driver.saveScreenshot(filePath);
  return filePath;
}

async function reportMobileTestResult(testContext, driver, moduleName) {
  const { state, title, duration, err } = testContext.currentTest;
  let screenshotPath = '';
  
  if (state === 'failed' && driver) {
    screenshotPath = await takeMobileScreenshot(driver, title);
  }

  const safeDuration = duration || 0;
  const record = {
    id: `TC-MOB-${Date.now()}`,
    module: moduleName,
    name: title || 'Unknown Test',
    platform: 'Mobile',
    status: state === 'passed' ? 'Passed' : 'Failed',
    startTime: new Date(Date.now() - safeDuration).toISOString(),
    endTime: new Date().toISOString(),
    duration: safeDuration,
    screenshot: screenshotPath,
    error: err ? err.message : ''
  };

  await excelReporter.addRecord(record);
}

module.exports = {
  takeMobileScreenshot,
  reportMobileTestResult
};
