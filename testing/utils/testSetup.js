const { Builder } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');
const excelReporter = require('./excelReporter');

async function takeScreenshot(driver, testName) {
  const screenshotDir = path.join(__dirname, '..', 'reports', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const sanitizedName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `${sanitizedName}_${Date.now()}.png`;
  const filePath = path.join(screenshotDir, fileName);
  
  const image = await driver.takeScreenshot();
  fs.writeFileSync(filePath, image, 'base64');
  return filePath;
}

async function reportTestResult(testContext, driver, moduleName, platform = 'Web') {
  const { state, title, duration, err } = testContext.currentTest;
  let screenshotPath = '';
  
  if (state === 'failed' && driver) {
    screenshotPath = await takeScreenshot(driver, title);
  }

  const safeDuration = duration || 0;
  const record = {
    id: `TC-${Date.now()}`,
    module: moduleName,
    name: title || 'Unknown Test',
    platform: platform,
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
  takeScreenshot,
  reportTestResult
};
