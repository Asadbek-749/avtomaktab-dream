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
  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}>
          <StatCard
            title="Faol o'quvchilar"
            value={activeStudents}
            icon={IconUsers}
            trend={{ value: 12, isPositive: true }}
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
            value={`${totalRevenue.toLocaleString()} so'm`}
            icon={IconCreditCard}
            trend={{ value: 8.5, isPositive: true }}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <StatCard
            title="O'zlashtirish"
            value="89%"
            icon={IconTrendingUp}
          />
        </motion.div>
      </div>
      
      {/* Additional dashboard components would go here (charts, recent students, etc.) */}
    </motion.div>
  );
};

export default AdminDashboard;
