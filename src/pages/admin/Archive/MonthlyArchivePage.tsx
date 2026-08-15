import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudentStore } from '../../../store/studentStore';
import { useGroupStore } from '../../../store/groupStore';
import { usePaymentStore } from '../../../store/paymentStore';
import { useExpenseStore } from '../../../store/expenseStore';
import { useUserStore } from '../../../store/userStore';
import { useBranchStore } from '../../../store/branchStore';
import { useAuthStore } from '../../../store/authStore';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { IconArrowLeft, IconDownload } from '@tabler/icons-react';
import { exportToExcel } from '../../../utils/exportExcel';

export const MonthlyArchivePage = () => {
  const { monthId } = useParams<{ monthId: string }>(); // e.g., "2026-08"
  const navigate = useNavigate();

  const { students, fetchStudents } = useStudentStore();
  const { groups, fetchGroups } = useGroupStore();
  const { payments, fetchPayments } = usePaymentStore();
  const { expenses, fetchExpenses } = useExpenseStore();
  const { users, fetchUsers } = useUserStore();
  const { activeBranchId } = useBranchStore();
  const user = useAuthStore(state => state.user);

  const [activeTab, setActiveTab] = useState<'finance' | 'groups' | 'instructors'>('finance');
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchGroups();
    fetchPayments();
    fetchExpenses();
    fetchUsers();
  }, [fetchStudents, fetchGroups, fetchPayments, fetchExpenses, fetchUsers]);

  const displayBranchId = user?.role === 'superadmin' ? activeBranchId : user?.branchId;

  const monthData = useMemo(() => {
    if (!monthId) return null;
    const [yearStr, monthStr] = monthId.split('-');
    const y = parseInt(yearStr);
    const m = parseInt(monthStr) - 1;

    const dt = new Date(y, m);
    const uzbekMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    const title = `${uzbekMonths[dt.getMonth()]} ${dt.getFullYear()}`;

    // Groups (Only those COMPLETED in this month)
    const mGroups = groups.filter(g => {
      if (displayBranchId && g.branchId !== displayBranchId) return false;
      if (g.status !== 'completed' || !g.completedAt) return false;
      
      const end = new Date(g.completedAt);
      return end.getFullYear() === y && end.getMonth() === m;
    });

    // Instructors
    const mInstructors = users.filter(u => {
      if (displayBranchId && u.branchId !== displayBranchId) return false;
      return u.role === 'instructor' || u.role === 'teacher';
    }).map(u => {
      const instStudents = students.filter(s => s.instructorId === u.id || s.groupId === mGroups.find(g => g.teacherId === u.id)?.id);
      return { ...u, studentCount: instStudents.length };
    });

    // Finance (Payments and Expenses)
    const mPayments = payments.filter(p => {
      if (displayBranchId && p.branchId !== displayBranchId) return false;
      const d = new Date(p.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });

    const mExpenses = expenses.filter(e => {
      if (displayBranchId && e.branchId !== displayBranchId) return false;
      const d = new Date(e.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });

    const totalIncome = mPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalExpense = mExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const netProfit = totalIncome - totalExpense;

    return {
      id: monthId,
      title,
      groups: mGroups,
      instructors: mInstructors,
      payments: mPayments,
      expenses: mExpenses,
      totalIncome,
      totalExpense,
      netProfit
    };
  }, [monthId, groups, payments, expenses, users, students, displayBranchId]);

  const handleExport = () => {
    if (!monthData) return;

    if (activeTab === 'finance') {
      exportToExcel({
        data: [
          ...monthData.payments.map(p => ({
            Sana: new Date(p.date).toLocaleDateString('uz-UZ'),
            Turi: 'Tushum',
            Maqsad: students.find(s => s.id === p.studentId)?.firstName || 'Noma\'lum',
            Summa: Number(p.amount)
          })),
          ...monthData.expenses.map(e => ({
            Sana: new Date(e.date).toLocaleDateString('uz-UZ'),
            Turi: 'Xarajat',
            Maqsad: e.note || e.category,
            Summa: Number(e.amount)
          }))
        ],
        columns: [
          { header: 'Sana', key: 'Sana' },
          { header: 'Turi', key: 'Turi' },
          { header: 'Maqsad', key: 'Maqsad' },
          { header: 'Summa', key: 'Summa' }
        ],
        fileName: `${monthData.title}_Arxiv_Moliya`
      });
    } else if (activeTab === 'groups') {
      exportToExcel({
        data: monthData.groups.map(g => ({
          'Guruh': g.name,
          'Holati': g.status === 'completed' ? 'Tugatilgan' : 'Faol',
          'O\'quvchilar soni': students.filter(s => s.groupId === g.id).length
        })),
        columns: [
          { header: 'Guruh', key: 'Guruh' },
          { header: 'Holati', key: 'Holati' },
          { header: 'O\'quvchilar soni', key: 'O\'quvchilar soni' }
        ],
        fileName: `${monthData.title}_Arxiv_Guruhlar`
      });
    } else {
      exportToExcel({
        data: monthData.instructors.map(u => ({
          'Ism Familiya': u.name,
          'Lavozim': u.role,
          'O\'quvchilar soni': u.studentCount
        })),
        columns: [
          { header: 'Ism Familiya', key: 'Ism Familiya' },
          { header: 'Lavozim', key: 'Lavozim' },
          { header: 'O\'quvchilar soni', key: 'O\'quvchilar soni' }
        ],
        fileName: `${monthData.title}_Arxiv_Instruktorlar`
      });
    }
  };

  const handleExportGroupStudents = () => {
    if (!selectedGroup) return;
    const groupStudents = students.filter(s => s.groupId === selectedGroup.id);
    exportToExcel({
      data: groupStudents.map(s => ({
        'Ism Familiya': `${s.firstName} ${s.lastName}`,
        'Telefon': s.phone,
        'To\'langan summa (UZS)': Number(s.paidAmount),
        'Qarz (UZS)': s.coursePrice - s.paidAmount
      })),
      columns: [
        { header: 'Ism Familiya', key: 'Ism Familiya' },
        { header: 'Telefon', key: 'Telefon' },
        { header: 'To\'langan summa (UZS)', key: 'To\'langan summa (UZS)' },
        { header: 'Qarz (UZS)', key: 'Qarz (UZS)' }
      ],
      fileName: `${selectedGroup.name}_Oquvchilari_Arxiv`
    });
  };

  if (!monthData) return <div className="p-6">Yuklanmoqda...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl mx-auto p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" className="p-2" onClick={() => navigate(-1)}>
          <IconArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-text-primary capitalize">{monthData.title} Arxivi</h2>
          <p className="text-text-muted">Oy bo'yicha moliya, guruhlar va instruktorlar tafsiloti</p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-bg-card p-4 rounded-xl border border-border">
        <div className="flex gap-2 bg-bg-base p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'finance' ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Moliya
          </button>
          <button 
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'groups' ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Guruhlar
          </button>
          <button 
            onClick={() => setActiveTab('instructors')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'instructors' ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Instruktorlar
          </button>
        </div>
        
        <Button onClick={handleExport} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <IconDownload size={18} />
          Excel yuklab olish
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          {activeTab === 'finance' && (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <p className="text-sm font-medium text-emerald-600">Umumiy Tushum</p>
                  <p className="text-2xl font-bold text-emerald-700">{monthData.totalIncome.toLocaleString()} UZS</p>
                </div>
                <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/20">
                  <p className="text-sm font-medium text-rose-600">Umumiy Xarajat</p>
                  <p className="text-2xl font-bold text-rose-700">{monthData.totalExpense.toLocaleString()} UZS</p>
                </div>
                <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
                  <p className="text-sm font-medium text-indigo-600">Sof Foyda</p>
                  <p className="text-2xl font-bold text-indigo-700">{monthData.netProfit.toLocaleString()} UZS</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Turi</TableHead>
                    <TableHead>Maqsad / Izoh</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthData.payments.length === 0 && monthData.expenses.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-text-muted py-8">Moliya tarixi topilmadi</TableCell></TableRow>
                  ) : (
                    [
                      ...monthData.payments.map(p => ({ ...p, _type: 'income', _date: new Date(p.date) })),
                      ...monthData.expenses.map(e => ({ ...e, _type: 'expense', _date: new Date(e.date) }))
                    ].sort((a, b) => b._date.getTime() - a._date.getTime()).map((item: any) => (
                      <TableRow key={`${item._type}-${item.id}`}>
                        <TableCell>{item._date.toLocaleDateString('uz-UZ')}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item._type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                            {item._type === 'income' ? 'Tushum' : 'Xarajat'}
                          </span>
                        </TableCell>
                        <TableCell>{item.note || item.category || 'To\'lov'}</TableCell>
                        <TableCell className={`text-right font-bold ${item._type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item._type === 'income' ? '+' : '-'}{Number(item.amount).toLocaleString()} UZS
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guruh</TableHead>
                    <TableHead>Ochilgan sana</TableHead>
                    <TableHead>Holati</TableHead>
                    <TableHead>O'quvchilar soni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthData.groups.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-text-muted py-8">Bu oyda guruhlar yo'q</TableCell></TableRow>
                  ) : (
                    monthData.groups.map((g: any) => (
                      <TableRow key={g.id} className="hover:bg-bg-hover cursor-pointer" onClick={() => { setSelectedGroup(g); setStudentsModalOpen(true); }}>
                        <TableCell className="font-medium text-text-primary">{g.name}</TableCell>
                        <TableCell>{new Date(g.createdAt).toLocaleDateString('uz-UZ')}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${g.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}>
                            {g.status === 'completed' ? 'Tugatilgan' : 'Faol'}
                          </span>
                        </TableCell>
                        <TableCell>{students.filter(s => s.groupId === g.id).length} kishi</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === 'instructors' && (
            <div className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ism Familiya</TableHead>
                    <TableHead>Lavozim</TableHead>
                    <TableHead>Biriktirilgan o'quvchilar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthData.instructors.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-text-muted py-8">Bu oyda instruktorlar yo'q</TableCell></TableRow>
                  ) : (
                    monthData.instructors.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-text-primary">{u.name}</TableCell>
                        <TableCell className="capitalize">{u.role}</TableCell>
                        <TableCell>{u.studentCount} kishi</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal size="4xl" isOpen={studentsModalOpen} onClose={() => setStudentsModalOpen(false)} title={`${selectedGroup?.name || ''} o'quvchilari (Arxiv)`}>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {selectedGroup && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ism Familiya</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">To'langan summa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.filter(s => s.groupId === selectedGroup.id).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-text-muted">Bu guruhda o'quvchilar yo'q</TableCell>
                  </TableRow>
                ) : (
                  students.filter(s => s.groupId === selectedGroup.id).map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {student.paidAmount.toLocaleString()} UZS
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-between mt-6">
            <Button variant="outline" className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={handleExportGroupStudents}>
              <IconDownload size={18} /> Excel yuklab olish
            </Button>
            <Button variant="outline" onClick={() => setStudentsModalOpen(false)}>Yopish</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default MonthlyArchivePage;
