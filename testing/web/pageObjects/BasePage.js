const { By, until } = require('selenium-webdriver');

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async navigateTo(url) {
    await this.driver.get(url);
  }

  async waitForElement(locator, timeout = 10000) {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async click(locator) {
    const el = await this.waitForElement(locator);
    await this.driver.wait(until.elementIsVisible(el), 5000);
    await el.click();
  }

  async typeText(locator, text) {
    const el = await this.waitForElement(locator);
    await this.driver.wait(until.elementIsVisible(el), 5000);
    await el.clear();
    await el.sendKeys(text);
  }

  async getText(locator) {
    const el = await this.waitForElement(locator);
    await this.driver.wait(until.elementIsVisible(el), 5000);
    return await el.getText();
  }

  async isElementDisplayed(locator) {
    try {
      const el = await this.waitForElement(locator, 5000);
      return await el.isDisplayed();
    } catch (e) {
      return false;
    }
  }
}

module.exports = BasePage;
