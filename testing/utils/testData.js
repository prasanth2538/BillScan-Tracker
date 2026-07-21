require('dotenv').config();

module.exports = {
  webUrl: 'http://localhost:5173',
  users: {
    valid: {
      email: process.env.TEST_USER_EMAIL || 'testuser@example.com',
      password: process.env.TEST_USER_PASSWORD || 'Password123!'
    },
    invalid: {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    },
    newUser: {
      email: `newuser_${Date.now()}@example.com`,
      password: 'Password123!'
    }
  },
  expenses: {
    valid: {
      amount: '50.00',
      description: 'Test Groceries',
      category: 'Food'
    }
  }
};
