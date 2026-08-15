import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudentStore } from '../../../store/studentStore';
import { useGroupStore } from '../../../store/groupStore';
import { usePaymentStore } from '../../../store/paymentStore';
import { useExpenseStore } from '../../../store/expenseStore';
import { useUserStore } from '../../../store/userStore';
import { useBranchStore } from '../../../store/branchStore';
import { useAuthStore } from '../../../store/authStore';
import { Card, CardContent } from '../../../components/ui/Card';
import { IconArchive, IconChevronRight } from '@tabler/icons-react';

export const ArchivePage = () => {
  const navigate = useNavigate();
  const { students, fetchStudents } = useStudentStore();
  const { groups, fetchGroups } = useGroupStore();
  const { payments, fetchPayments } = usePaymentStore();
  const { expenses, fetchExpenses } = useExpenseStore();
  const { users, fetchUsers } = useUserStore();
  const { activeBranchId } = useBranchStore();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchStudents();
    fetchGroups();
    fetchPayments();
    fetchExpenses();
    fetchUsers();
  }, [fetchStudents, fetchGroups, fetchPayments, fetchExpenses, fetchUsers]);

  const displayBranchId = user?.role === 'superadmin' ? activeBranchId : user?.branchId;

  // Guruhlash mantiqi: Yil-Oy bo'yicha
  const monthlyData = useMemo(() => {
    const dataMap = new Map<string, {
      id: string,
      title: string,
      totalIncome: number,
      totalExpense: number
    }>();

    // Generate months from COMPLETED groups, payments, expenses
    const dates = [
      ...groups.filter(g => g.status === 'completed' && g.completedAt).map(g => g.completedAt),
      ...payments.map(p => p.date),
      ...expenses.map(e => e.date)
    ];

    dates.forEach(d => {
      if (!d) return;
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      
      const uzbekMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
      const title = `${uzbekMonths[dt.getMonth()]} ${dt.getFullYear()}`;
      
      if (!dataMap.has(key)) {
        dataMap.set(key, { id: key, title, totalIncome: 0, totalExpense: 0 });
      }
    });

    const months = Array.from(dataMap.values()).sort((a, b) => b.id.localeCompare(a.id));

    months.forEach(month => {
      const [yearStr, monthStr] = month.id.split('-');
      const y = parseInt(yearStr);
      const m = parseInt(monthStr) - 1;

      month.totalIncome = payments.filter(p => {
        if (displayBranchId && p.branchId !== displayBranchId) return false;
        const d = new Date(p.date);
        return d.getFullYear() === y && d.getMonth() === m;
      }).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      month.totalExpense = expenses.filter(e => {
        if (displayBranchId && e.branchId !== displayBranchId) return false;
        const d = new Date(e.date);
        return d.getFullYear() === y && d.getMonth() === m;
      }).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    });

    return months;
  }, [groups, payments, expenses, users, students, displayBranchId]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Oylik Arxiv</h2>
          <p className="text-text-muted">Oyma-oy moliya va boshqaruv tarixi</p>
        </div>
      </div>

      <div className="space-y-4">
        {monthlyData.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-text-muted">
              <IconArchive size={48} className="opacity-20 mb-2" />
              <p>Arxiv ma'lumotlari topilmadi</p>
            </CardContent>
          </Card>
        ) : (
          monthlyData.map(month => (
            <Card key={month.id} className="overflow-hidden border-border bg-bg-card hover:border-accent/50 transition-colors">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-hover/50 transition-colors group"
                onClick={() => navigate(`/${user?.role}/archive/${month.id}`)}
              >
                <div className="flex items-center gap-3">
                  <IconChevronRight size={20} className="text-text-muted group-hover:text-accent transition-colors" />
                  <h3 className="text-lg font-semibold text-text-primary capitalize">{month.title}</h3>
                </div>
                <div className="flex gap-6 text-sm font-medium">
                  <span className="text-emerald-600">Tushum: {month.totalIncome.toLocaleString()} UZS</span>
                  <span className="text-rose-600">Xarajat: {month.totalExpense.toLocaleString()} UZS</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default ArchivePage;
