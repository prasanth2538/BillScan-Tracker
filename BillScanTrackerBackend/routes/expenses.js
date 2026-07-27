const express = require('express');
const router = express.Router();

// GET /api/v1/expenses
router.get('/', (req, res) => {
  res.json({ expenses: [{ id: 1, amount: 45.99, merchant: 'Supermarket', category: 'Groceries' }] });
});

// POST /api/v1/expenses
router.post('/', (req, res) => {
  const { amount, merchant, category } = req.body;
  res.status(201).json({ id: 2, amount, merchant, category });
});

// GET /api/v1/expenses/:id
router.get('/:id', (req, res) => {
  res.json({ id: req.params.id, amount: 100, merchant: 'Gas Station' });
});

module.exports = router;
