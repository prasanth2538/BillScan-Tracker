const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.css('input[type="email"]');
    this.passwordInput = By.css('input[type="password"]');
    this.loginButton = By.xpath('//button[contains(text(), "Login")]');
    this.errorMessage = By.css('.text-red-700'); // it has text-red-700 class
    this.signupLink = By.xpath('//button[contains(text(), "Create an Account")]');
    this.forgotPasswordLink = By.xpath('//button[contains(text(), "Forgot password?")]');
  }

  async login(email, password) {
    await this.typeText(this.emailInput, email);
    await this.typeText(this.passwordInput, password);
    await this.click(this.loginButton);
  }

  async getErrorMessage() {
    return await this.getText(this.errorMessage);
  }

  async goToSignup() {
    await this.click(this.signupLink);
  }
}

module.exports = LoginPage;
