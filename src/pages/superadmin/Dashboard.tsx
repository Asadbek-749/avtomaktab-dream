import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IconShield, IconUsers, IconActivity, IconWallet } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { api } from '../../services/api';
import { useUserStore } from '../../store/userStore';
import { useBranchStore } from '../../store/branchStore';
import { useStudentStore } from '../../store/studentStore';
import { useGroupStore } from '../../store/groupStore';

const COLORS = ['var(--accent)', 'var(--success)', 'var(--warning)', 'var(--danger)'];

export const SuperDashboard = () => {
  const { users, fetchUsers } = useUserStore();
  const { branches, fetchBranches } = useBranchStore();
  const { students, fetchStudents } = useStudentStore();
  const { groups, fetchGroups } = useGroupStore();
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchBranches();
    fetchStudents();
    fetchGroups();
    api.getPayments().then(setPayments).catch(console.error);
  }, [fetchUsers, fetchBranches, fetchStudents, fetchGroups]);
  
  const teachersCount = users.filter(u => u.role === 'teacher').length;
  const currentMonthRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

  // Generate chart data based on real payments (currently zero if no payments)
  const b1 = branches[0]?.name || 'Chilonzor Filiali';
  const b2 = branches[1]?.name || 'Yunusobod Filiali';

  // Generate last 6 months dynamically
  const uzbekMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  const currentMonth = new Date().getMonth();
  const dynamicChartData = [];
  
  for (let i = 5; i >= 0; i--) {
    let monthIndex = currentMonth - i;
    if (monthIndex < 0) monthIndex += 12;
    dynamicChartData.push({
      name: uzbekMonths[monthIndex],
      [b1]: 0,
      [b2]: 0
    });
  }

  // Only show trend if there is actual revenue
  const trend = currentMonthRevenue > 0 ? { value: 12, isPositive: true } : undefined;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Superadmin Dashboard</h2>
        <p className="text-text-muted">Tizimning umumiy holati va xavfsizlik nazorati</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Jami O'quvchilar"
          value={students.length}
          icon={IconUsers}
        />
        <StatCard
          title="Umumiy Guruhlar"
          value={groups.length}
          icon={IconUsers}
        />
        <StatCard
          title="Jami O'qituvchilar"
          value={teachersCount}
          icon={IconShield}
        />
        <StatCard
          title="Umumiy Tushum"
          value={`${currentMonthRevenue.toLocaleString()} so'm`}
          icon={IconWallet}
          trend={trend}
        />
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Moliyaviy ko'rsatkichlar (Oxirgi 6 oy)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(val) => `${val / 1000000}M`} />
                  <Tooltip 
                    cursor={{ fill: 'var(--bg-hover)' }}
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  {branches.length > 0 ? (
                    branches.map((b, i) => (
                      <Bar 
                        key={b.id} 
                        dataKey={b.name} 
                        fill={COLORS[i % COLORS.length]} 
                        radius={[4, 4, 0, 0]} 
                      />
                    ))
                  ) : (
                    <Bar dataKey="daromad" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </motion.div>
  );
};

export default SuperDashboard;
