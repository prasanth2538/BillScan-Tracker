require('dotenv').config();

module.exports = {
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
  logLevel: 'info',

  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',

    'appium:deviceName': '5dc95d4c',
    'appium:udid': '5dc95d4c',
    'appium:platformVersion': '15',

    'appium:appPackage': 'com.billscan.pdd',
    'appium:appActivity': '.MainActivity',

    'appium:autoGrantPermissions': true,
    'appium:noReset': true,
    'appium:fullReset': false,
  }
};