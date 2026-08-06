const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/user');
const ocrRoutes = require('./routes/ocr');

app.use('/ocr', ocrRoutes);
app.use('/api/v1/ocr', ocrRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/users', userRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BillScan Tracker Backend listening on port ${PORT}`);
  });
}

module.exports = app;
