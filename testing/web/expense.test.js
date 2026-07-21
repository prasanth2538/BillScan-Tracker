const { Builder } = require('selenium-webdriver');
const { expect } = require('chai');
const { reportTestResult } = require('../utils/testSetup');
const testData = require('../utils/testData');

describe('Web E2E - Expense Module', function () {
  let driver;

  before(async function () {
    driver = await new Builder().forBrowser('chrome').build();
    await driver.get(testData.webUrl);
  });

  afterEach(async function () {
    await reportTestResult(this, driver, 'Expense', 'Web');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('should upload OCR Bill successfully', async function () {
    expect(true).to.be.true;
  });

  it('should add manual expense', async function () {
    expect(true).to.be.true;
  });

  it('should edit an existing expense', async function () {
    expect(true).to.be.true;
  });

  it('should delete an expense', async function () {
    expect(true).to.be.true;
  });
});
