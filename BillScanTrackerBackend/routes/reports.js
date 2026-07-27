const express = require('express');
const router = express.Router();

// GET /api/v1/reports/summary
router.get('/summary', (req, res) => {
  res.json({ totalExpenses: 1250.50, categoriesCount: 5, pendingApproval: 2 });
});

// GET /api/v1/reports/export
router.get('/export', (req, res) => {
  res.json({ downloadUrl: 'https://example.com/reports/export.pdf' });
});

module.exports = router;
