const express = require('express');
const router = express.Router();

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required credentials' });
  }
  res.json({ token: 'jwt-token-placeholder', user: { id: 1, email } });
});

// POST /api/v1/auth/signup
router.post('/signup', (req, res) => {
  const { email, password, name } = req.body;
  res.status(201).json({ message: 'User registered successfully', user: { id: 2, email, name } });
});

// POST /api/v1/auth/refresh
router.post('/refresh', (req, res) => {
  res.json({ token: 'new-jwt-token-placeholder' });
});

module.exports = router;
