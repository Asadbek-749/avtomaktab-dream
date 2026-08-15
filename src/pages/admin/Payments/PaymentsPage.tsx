import React, { useEffect } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { usePaymentStore } from '../../../store/paymentStore';
import { useStudentStore } from '../../../store/studentStore';
import { useGroupStore } from '../../../store/groupStore';
import { useCashStore } from '../../../store/cashStore';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { IconCheck } from '@tabler/icons-react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../../../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { exportToExcel } from '../../../utils/exportExcel';
import { IconDownload } from '@tabler/icons-react';

export const PaymentsPage = () => {
  const { payments, fetchPayments } = usePaymentStore();
  const { students, fetchStudents } = useStudentStore();
  const { groups, fetchGroups } = useGroupStore();
  const { addReport, reports, fetchReports } = useCashStore();
  const user = useAuthStore(state => state.user);
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [addPaymentModalOpen, setAddPaymentModalOpen] = React.useState(false);
  const [selectedGroupId, setSelectedGroupId] = React.useState('');
  const [selectedStudentId, setSelectedStudentId] = React.useState('');
  const [paymentAmount, setPaymentAmount] = React.useState<number | ''>('');

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchReports();
    fetchGroups();
  }, [fetchPayments, fetchStudents, fetchReports, fetchGroups]);

  const getStudentName = (id: string) => {
    const student = students.find(s => s.id === id);
    return student ? `${student.firstName} ${student.lastName}` : 'Noma\'lum';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate today's total payments added by this admin that are not yet reported
  const today = new Date().toISOString().split('T')[0];
  const pendingPayments = payments.filter(p => p.addedBy === user?.id && !p.cashReportId);
  const todayTotal = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Check if already closed today
  const hasClosedToday = reports.some(r => r.date.startsWith(today) && r.addedBy === user?.id) && pendingPayments.length === 0;

  const handleCloseCash = () => {
    if (user) {
      addReport(todayTotal, user.id, user.branchId || '');
      setIsModalOpen(false);
    }
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !paymentAmount || !user) return;
    
    const amount = Number(paymentAmount);
    const student = students.find(s => s.id === selectedStudentId);
    
    if (student) {
      const debt = student.coursePrice - student.paidAmount;
      if (amount > debt) {
        alert(`Kiritilgan summa qarz miqdoridan (${debt.toLocaleString()} so'm) oshmasligi kerak!`);
        return;
      }
      
      usePaymentStore.getState().addPayment({
        studentId: student.id,
        amount: amount,
        date: new Date().toISOString(),
        note: 'Dars uchun to\'lov',
        branchId: student.branchId,
        addedBy: user.id
      }, user.name);
      
      setAddPaymentModalOpen(false);
      setSelectedStudentId('');
      setSelectedGroupId('');
      setPaymentAmount('');
    }
  };

  // Faqat shu admin filialiga tegishli o'quvchilarni olish
  const branchStudents = students.filter(s => s.branchId === user?.branchId && s.status !== 'completed');
  const branchGroups = groups.filter(g => g.branchId === user?.branchId && g.status === 'active');
  const filteredStudents = selectedGroupId ? branchStudents.filter(s => s.groupId === selectedGroupId && (s.coursePrice - s.paidAmount) > 0) : [];

  const handleExport = () => {
    exportToExcel({
      data: payments.map(p => ({
        ...p,
        studentName: getStudentName(p.studentId),
        dateFormatted: formatDate(p.date)
      })),
      columns: [
        { header: "O'quvchi", key: 'studentName' },
        { header: 'Summa', key: 'amount' },
        { header: 'Sana', key: 'dateFormatted' },
        { header: 'Izoh', key: 'note' }
      ],
      fileName: 'moliya_hisoboti',
      sheetName: 'To\'lovlar'
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">To'lovlar</h2>
          <p className="text-text-muted">Kiritilgan barcha to'lovlar tarixi</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <IconDownload size={18} /> Excel
          </Button>
          {hasClosedToday ? (
            <Button variant="outline" className="gap-2 bg-success/10 text-success border-success" disabled>
              <IconCheck size={18} />
              Kassa yopilgan
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>Kassani yopish</Button>
          )}
          <Button className="gap-2" onClick={() => setAddPaymentModalOpen(true)}>
            <IconPlus size={18} />To'lov kiritish</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Oxirgi to'lovlar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>O'quvchi</TableHead>
                <TableHead>Summa</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead>Izoh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-text-muted">
                    Hozircha yangi to'lovlar yo'q
                  </TableCell>
                </TableRow>
              ) : (
                pendingPayments.slice().reverse().map(payment => (
                  <TableRow key={payment.id} className="group">
                    <TableCell className="font-medium">{getStudentName(payment.studentId)}</TableCell>
                    <TableCell className="font-bold text-success">
                      + {payment.amount.toLocaleString()} so'm
                    </TableCell>
                    <TableCell className="text-text-secondary">{formatDate(payment.date)}</TableCell>
                    <TableCell className="text-text-secondary">{payment.note}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Kassani yopish">
        <div className="space-y-4">
          <p className="text-text-secondary">Siz tasdiqlanmagan quyidagi miqdorda to'lov qabul qildingiz:</p>
          <div className="text-center py-4">
            <span className="text-3xl font-bold text-success">{todayTotal.toLocaleString()} so'm</span>
          </div>
          <p className="text-sm text-text-muted bg-bg-hover p-4 rounded-lg">
            Diqqat! "Hisobotni yuborish" tugmasini bosgach, ushbu tushum Superadminga tasdiqlash uchun yuboriladi va bu to'lovlar ro'yxatdan o'chadi. Ushbu amalni bekor qilib bo'lmaydi.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleCloseCash} disabled={todayTotal === 0}>Hisobotni yuborish</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addPaymentModalOpen} onClose={() => setAddPaymentModalOpen(false)} title="To'lov kiritish">
        <form onSubmit={handleAddPaymentSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Guruhni tanlang</label>
            <select 
              className="w-full bg-bg-base border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent transition-colors"
              value={selectedGroupId}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                setSelectedStudentId(''); // Reset student when group changes
              }}
              required
            >
              <option value="">Guruhni tanlang</option>
              {branchGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">O'quvchini tanlang</label>
            <select 
              className="w-full bg-bg-base border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent transition-colors"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              disabled={!selectedGroupId}
            >
              <option value="">O'quvchini tanlang</option>
              {filteredStudents.map(s => {
                const debt = s.coursePrice - s.paidAmount;
                return (
                  <option key={s.id} value={s.id} disabled={debt <= 0}>
                    {s.firstName} {s.lastName} {debt > 0 ? `(Qarzi: ${debt.toLocaleString()} so'm)` : `(Qarzi yo'q)`}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">To'lov summasi (so'm)</label>
            <input 
              type="number" 
              placeholder="Masalan: 500000"
              className="w-full bg-bg-base border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent transition-colors"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => setAddPaymentModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit" disabled={!selectedStudentId || !paymentAmount}>To'lovni tasdiqlash</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default PaymentsPage;
