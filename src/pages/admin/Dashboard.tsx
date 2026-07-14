import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { IconUsers, IconCreditCard, IconBook, IconTrendingUp } from '@tabler/icons-react';
import { StatCard } from '../../components/ui/StatCard';
import { useStudentStore } from '../../store/studentStore';
import { usePaymentStore } from '../../store/paymentStore';
import { useGroupStore } from '../../store/groupStore';

export const AdminDashboard = () => {
  const { students, fetchStudents } = useStudentStore();
  const { payments, fetchPayments } = usePaymentStore();
  const { groups, fetchGroups } = useGroupStore();
  
  useEffect(() => {
    fetchStudents();
    fetchPayments();
    fetchGroups();
  }, [fetchStudents, fetchPayments, fetchGroups]);

  const activeStudents = students.filter(s => s.status === 'active').length;
  
  // Calculate trends
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Revenue calculation
  const revenueThisMonth = payments
    .filter(p => {
      const d = new Date(p.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const revenueLastMonth = payments
    .filter(p => {
      const d = new Date(p.date);
      return d.getMonth() === previousMonth && d.getFullYear() === previousYear;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  let revenueTrend = 0;
  if (revenueLastMonth > 0) {
    revenueTrend = ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
  } else if (revenueThisMonth > 0) {
    revenueTrend = 100;
  }

  // Active students trend (new students this month vs last month)
  const newStudentsThisMonth = students.filter(s => {
    const d = new Date(s.createdAt);
    return s.status === 'active' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const newStudentsLastMonth = students.filter(s => {
    const d = new Date(s.createdAt);
    return s.status === 'active' && d.getMonth() === previousMonth && d.getFullYear() === previousYear;
  }).length;

  let studentTrend = 0;
  if (newStudentsLastMonth > 0) {
    studentTrend = ((newStudentsThisMonth - newStudentsLastMonth) / newStudentsLastMonth) * 100;
  } else if (newStudentsThisMonth > 0) {
    studentTrend = 100;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-1">Xush kelibsiz, Admin!</h2>
        <p className="text-text-muted">Maktabingizning umumiy holati va statistikasi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <StatCard
            title="Faol o'quvchilar"
            value={activeStudents}
            icon={IconUsers}
            trend={{ value: Number(studentTrend.toFixed(1)), isPositive: studentTrend >= 0 }}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <StatCard
            title="Umumiy guruhlar"
            value={groups.length}
            icon={IconBook}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <StatCard
            title="Oylik tushum"
            value={`${revenueThisMonth.toLocaleString()} so'm`}
            icon={IconCreditCard}
            trend={{ value: Number(revenueTrend.toFixed(1)), isPositive: revenueTrend >= 0 }}
          />
        </motion.div>
      </div>
      
      {/* Additional dashboard components would go here (charts, recent students, etc.) */}
    </motion.div>
  );
};

export default AdminDashboard;
