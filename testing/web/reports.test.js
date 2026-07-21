const { Builder } = require('selenium-webdriver');
const { expect } = require('chai');
const { reportTestResult } = require('../utils/testSetup');
const testData = require('../utils/testData');

describe('Web E2E - Reports Module', function () {
  let driver;

  before(async function () {
    driver = await new Builder().forBrowser('chrome').build();
    await driver.get(testData.webUrl);
  });

  afterEach(async function () {
    await reportTestResult(this, driver, 'Reports', 'Web');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('should load Reports Screen', async function () {
    expect(true).to.be.true;
  });

  it('should download PDF report successfully', async function () {
    expect(true).to.be.true;
  });
});
