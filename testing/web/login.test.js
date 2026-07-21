const { Builder } = require('selenium-webdriver');
const { expect } = require('chai');
const LoginPage = require('./pageObjects/LoginPage');
const { reportTestResult } = require('../utils/testSetup');
const testData = require('../utils/testData');

describe('Web E2E - Login Module', function () {
  let driver;
  let loginPage;

  before(async function () {
    driver = await new Builder().forBrowser('chrome').build();
    loginPage = new LoginPage(driver);
  });

  beforeEach(async function () {
    await loginPage.navigateTo(testData.webUrl);
  });

  afterEach(async function () {
    await reportTestResult(this, driver, 'Login', 'Web');
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('should not login with invalid credentials', async function () {
    await loginPage.login(testData.users.invalid.email, testData.users.invalid.password);
    // Add wait/assertion for error message. This selector will need to match the actual app.
    // e.g. const errorText = await loginPage.getErrorMessage();
    // expect(errorText).to.include('Invalid login');
  });

  it('should login with valid credentials', async function () {
    await loginPage.login(testData.users.valid.email, testData.users.valid.password);
    // Add assertion to verify user is redirected to Dashboard
    // const currentUrl = await driver.getCurrentUrl();
    // expect(currentUrl).to.include('/dashboard');
  });
});
