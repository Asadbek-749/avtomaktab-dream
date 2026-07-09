import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useBranchStore } from '../../store/branchStore';
import { usePaymentStore } from '../../store/paymentStore';
import { useStudentStore } from '../../store/studentStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

export const AnalyticsPage = () => {
  const { branches, fetchBranches } = useBranchStore();
  const { payments, fetchPayments } = usePaymentStore();
  const { students, fetchStudents } = useStudentStore();

  useEffect(() => {
    fetchBranches();
    fetchPayments();
    fetchStudents();
  }, [fetchBranches, fetchPayments, fetchStudents]);

  // Data for BarChart: Income per branch
  const incomeData = useMemo(() => {
    return branches.map(branch => {
      const branchPayments = payments.filter(p => p.branchId === branch.id);
      const totalIncome = branchPayments.reduce((sum, p) => sum + p.amount, 0);
      return {
        name: branch.name,
        'Umumiy daromad': totalIncome
      };
    });
  }, [branches, payments]);

  // Data for LineChart: Enrollments per month
  const enrollmentData = useMemo(() => {
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const count = students.filter(s => {
        const d = new Date(s.createdAt);
        return d.getFullYear() === currentYear && d.getMonth() === index;
      }).length;
      
      return {
        name: month,
        "O'quvchilar": count
      };
    });
  }, [students]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Analitika</h2>
        <p className="text-text-muted">Umumiy tizim bo'yicha batafsil hisobotlar va grafiklar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Filiallar bo'yicha daromad</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  formatter={(value: number) => `${value.toLocaleString()} so'm`}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
                />
                <Legend />
                <Bar dataKey="Umumiy daromad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Oylik qabullar dinamikasi ({new Date().getFullYear()})</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
                />
                <Legend />
                <Line type="monotone" dataKey="O'quvchilar" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;
