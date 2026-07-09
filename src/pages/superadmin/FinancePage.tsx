import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../../components/ui/Table';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useStudentStore } from '../../store/studentStore';
import { useGroupStore } from '../../store/groupStore';
import { useCashStore } from '../../store/cashStore';
import { useBranchStore } from '../../store/branchStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { IconAlertCircle, IconDownload, IconMessageCircle, IconCheck } from '@tabler/icons-react';
import { Button } from '../../components/ui/Button';
import { exportToCSV } from '../../utils/export';

const COLORS = ['var(--success)', 'var(--danger)'];

export const FinancePage = () => {
  const { students, fetchStudents } = useStudentStore();
  const { groups, fetchGroups } = useGroupStore();
  const { reports, fetchReports, updateReportStatus } = useCashStore();
  const { branches, fetchBranches, activeBranchId, setActiveBranch } = useBranchStore();
  const { users, fetchUsers } = useUserStore();
  const superadminId = useAuthStore(state => state.user?.id);
  const [simulatedSMS, setSimulatedSMS] = useState<Record<string, 'sending' | 'sent'>>({});

  useEffect(() => {
    fetchStudents();
    fetchGroups();
    fetchReports();
    fetchBranches();
    fetchUsers();
  }, [fetchStudents, fetchGroups, fetchReports, fetchBranches, fetchUsers]);

  const displayStudents = activeBranchId ? students.filter(s => s.branchId === activeBranchId) : students;
  const displayGroups = activeBranchId ? groups.filter(g => g.branchId === activeBranchId) : groups;
  const displayReports = activeBranchId ? reports.filter(r => r.branchId === activeBranchId) : reports;

  let totalPaid = 0;
  let totalDebt = 0;

  const debtors = displayStudents.filter(s => {
    const debt = s.coursePrice - s.paidAmount;
    totalPaid += s.paidAmount;
    if (debt > 0) {
      totalDebt += debt;
      return true;
    }
    return false;
  });

  const pieData = [
    { name: 'To\'langan summa', value: totalPaid || 1 },
    { name: 'Umumiy qarzdorlik', value: totalDebt },
  ];

  const debtsByGroup = displayGroups.map(group => {
    const groupDebtors = debtors.filter(d => d.groupId === group.id);
    const totalGroupDebt = groupDebtors.reduce((acc, curr) => acc + (curr.coursePrice - curr.paidAmount), 0);
    return {
      group,
      debtors: groupDebtors,
      totalGroupDebt
    };
  }).filter(g => g.totalGroupDebt > 0);

  const handleExport = () => {
    const exportData = debtors.map(s => ({
      'Ism Familiya': `${s.firstName} ${s.lastName}`,
      'Telefon': s.phone,
      'Guruh': groups.find(g => g.id === s.groupId)?.name || 'Noma\'lum',
      'Kurs Narxi': s.coursePrice,
      'To\'langan': s.paidAmount,
      'Qarzdorlik': s.coursePrice - s.paidAmount
    }));
    exportToCSV(exportData, `Qarzdorlar_${new Date().toISOString().split('T')[0]}`);
  };

  const handleSendSMS = (groupId: string) => {
    setSimulatedSMS(prev => ({ ...prev, [groupId]: 'sending' }));
    setTimeout(() => {
      setSimulatedSMS(prev => ({ ...prev, [groupId]: 'sent' }));
    }, 1500);
  };

  const getAdminName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user ? user.name : 'Noma\'lum';
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Moliya</h2>
          <p className="text-text-muted">Moliyaviy tahlil va qarzdorlar ro'yxati</p>
        </div>
        <div className="flex gap-4 items-center">
          <select 
            className="bg-bg-base border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
            value={activeBranchId || ''}
            onChange={(e) => setActiveBranch(e.target.value || null)}
          >
            <option value="">Barcha filiallar</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <IconDownload size={18} />
            Eksport (Excel)
          </Button>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Kunlik Kassa Hisobotlari (Yopish)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sana</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Topshirilgan summa</TableHead>
                <TableHead>Holati</TableHead>
                <TableHead className="text-right">Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-text-muted py-4">Hozircha hisobotlar yo'q</TableCell>
                </TableRow>
              ) : (
                displayReports.slice().reverse().map(report => (
                  <TableRow key={report.id}>
                    <TableCell>{formatDate(report.createdAt)}</TableCell>
                    <TableCell className="font-medium">{getAdminName(report.addedBy)}</TableCell>
                    <TableCell className="font-bold text-success">{report.totalAmount.toLocaleString()} so'm</TableCell>
                    <TableCell>
                      {report.status === 'pending' && <span className="bg-warning/10 text-warning px-2 py-1 rounded-md text-xs">Kutilyapti</span>}
                      {report.status === 'approved' && <span className="bg-success/10 text-success px-2 py-1 rounded-md text-xs">Tasdiqlangan</span>}
                      {report.status === 'rejected' && <span className="bg-danger/10 text-danger px-2 py-1 rounded-md text-xs">Rad etilgan</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {report.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => superadminId && updateReportStatus(report.id, 'approved', superadminId)}>Tasdiqlash</Button>
                          <Button size="sm" variant="danger" onClick={() => superadminId && updateReportStatus(report.id, 'rejected', superadminId)}>Rad etish</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="md:col-span-1 border-border">
          <CardHeader>
            <CardTitle>Umumiy Moliyaviy Holat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} so'm`} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">To'langan:</span>
                <span className="font-bold text-success">{totalPaid.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Qarzdorlik:</span>
                <span className="font-bold text-danger">{totalDebt.toLocaleString()} so'm</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertCircle className="text-danger" size={20} />
              Qarzdorlar Ro'yxati (Guruhlar bo'yicha)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {debtsByGroup.length === 0 ? (
                <p className="text-center text-text-muted py-8">Ayni vaqtda qarzdorlar mavjud emas.</p>
              ) : (
                debtsByGroup.map(groupData => (
                  <div key={groupData.group.id} className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bg-hover p-3 rounded-lg border border-border gap-2">
                      <div>
                        <h3 className="font-bold text-text-primary text-base">{groupData.group.name}</h3>
                        <span className="text-sm font-semibold text-danger">Guruhning qarzi: {groupData.totalGroupDebt.toLocaleString()} so'm</span>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant={simulatedSMS[groupData.group.id] === 'sent' ? 'primary' : 'outline'}
                        className="gap-2"
                        onClick={() => handleSendSMS(groupData.group.id)}
                        disabled={simulatedSMS[groupData.group.id] === 'sending'}
                      >
                        {simulatedSMS[groupData.group.id] === 'sending' ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full" />
                        ) : simulatedSMS[groupData.group.id] === 'sent' ? (
                          <><IconCheck size={16} className="text-success" /> Yuborildi</>
                        ) : (
                          <><IconMessageCircle size={16} /> Qarzdorlarga SMS yuborish</>
                        )}
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>O'quvchi</TableHead>
                          <TableHead>Telefon</TableHead>
                          <TableHead>Kurs narxi</TableHead>
                          <TableHead className="text-right text-danger">Qarzi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupData.debtors.map((student, i) => (
                          <TableRow key={student.id} transition={{ delay: i * 0.05 }}>
                            <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                            <TableCell>{student.phone}</TableCell>
                            <TableCell className="text-text-secondary">{student.coursePrice.toLocaleString()} so'm</TableCell>
                            <TableCell className="text-right font-bold text-danger">{(student.coursePrice - student.paidAmount).toLocaleString()} so'm</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default FinancePage;
