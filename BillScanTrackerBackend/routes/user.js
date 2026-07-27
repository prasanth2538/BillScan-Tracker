const express = require('express');
const router = express.Router();

// GET /api/v1/users/profile
router.get('/profile', (req, res) => {
  res.json({ id: 1, name: 'John Doe', email: 'user@example.com', role: 'user' });
});

// PUT /api/v1/users/profile
router.put('/profile', (req, res) => {
  res.json({ message: 'Profile updated' });
});

module.exports = router;
