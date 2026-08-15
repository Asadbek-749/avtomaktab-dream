import express from 'express';

import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://avtodream.uz' 
    : function (origin, callback) {
        callback(null, true);
      },
  credentials: true
}));
app.use(express.json());



import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import branchRoutes from './routes/branches';
import groupRoutes from './routes/groups';
import studentRoutes from './routes/students';
import paymentRoutes from './routes/payments';
import logsRoutes from './routes/logs';
import drivingLessonRoutes from './routes/driving-lessons';
import expenseRoutes from './routes/expenses';
import cashReportsRoutes from './routes/cash-reports';
import instructorPaymentRoutes from './routes/instructorPayments';
import practiceGroupRoutes from './routes/practiceGroups';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/driving-lessons', drivingLessonRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/cash-reports', cashReportsRoutes);
app.use('/api/instructor-payments', instructorPaymentRoutes);
app.use('/api/practice-groups', practiceGroupRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('Avtomaktab API is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
