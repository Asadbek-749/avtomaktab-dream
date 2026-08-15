import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IconArrowLeft, IconPhone, IconCar, IconCash, IconIdBadge, IconUser } from '@tabler/icons-react';
import { useStudentStore } from '../../../store/studentStore';
import { useGroupStore } from '../../../store/groupStore';
import { usePaymentStore } from '../../../store/paymentStore';
import { useUserStore } from '../../../store/userStore';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { useConfirm } from '../../../hooks/useConfirm';

export const StudentDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ConfirmDialog, confirm] = useConfirm();
  
  const { students, fetchStudents } = useStudentStore();
  const { groups, fetchGroups } = useGroupStore();
  const { payments, fetchPayments, deletePayment } = usePaymentStore();
  const { users, fetchUsers } = useUserStore();

  useEffect(() => {
    fetchStudents();
    fetchGroups();
    fetchPayments();
    fetchUsers();
  }, [fetchStudents, fetchGroups, fetchPayments, fetchUsers]);

  const student = students.find(s => s.id === id);
  const group = groups.find(g => g.id === student?.groupId);
  const studentPayments = payments.filter(p => p.studentId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const instructor = users.find(u => u.id === student?.instructorId);

  if (!student) {
    return <div className="p-6 text-center text-text-muted">Yuklanmoqda yoki o'quvchi topilmadi...</div>;
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (await confirm("Rostdan ham ushbu to'lovni o'chirmoqchimisiz?")) {
      await deletePayment(paymentId);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="p-2">
          <IconArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{student.firstName} {student.lastName}</h2>
          <p className="text-text-muted">Guruh: {group?.name || 'Noma\'lum'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shaxsiy Ma'lumotlar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUser className="text-primary" /> Shaxsiy Ma'lumotlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-text-secondary flex items-center gap-2"><IconPhone size={18}/> Telefon:</span>
              <span className="font-medium">{student.phone}</span>
            </div>
            {student.additionalPhone && (
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-text-secondary flex items-center gap-2"><IconPhone size={18}/> Qo'shimcha telefon:</span>
                <span className="font-medium">{student.additionalPhone}</span>
              </div>
            )}
            {student.passport && (
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-text-secondary flex items-center gap-2"><IconIdBadge size={18}/> Pasport:</span>
                <span className="font-medium">{student.passport}</span>
              </div>
            )}
            {student.pinfl && (
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-text-secondary flex items-center gap-2"><IconIdBadge size={18}/> JSHSHR:</span>
                <span className="font-medium">{student.pinfl}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-text-secondary flex items-center gap-2"><IconCar size={18}/> Instruktor:</span>
              <span className="font-medium">{instructor ? instructor.name : 'Biriktirilmagan'}</span>
            </div>
          </CardContent>
        </Card>

        {/* To'lov Ma'lumotlari */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCash className="text-success" /> To'lov Ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-text-secondary">Jami kurs narxi:</span>
              <span className="font-bold text-lg">{student.coursePrice.toLocaleString()} so'm</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-text-secondary">To'langan:</span>
              <span className="font-bold text-success text-lg">{student.paidAmount.toLocaleString()} so'm</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-text-secondary">Qarzdorlik:</span>
              <span className="font-bold text-danger text-lg">{(student.coursePrice - student.paidAmount).toLocaleString()} so'm</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* To'lov Tarixi */}
      <Card>
        <CardHeader>
          <CardTitle>To'lov Tarixi</CardTitle>
        </CardHeader>
        <CardContent>
          {studentPayments.length === 0 ? (
            <p className="text-text-muted text-center py-4">To'lovlar tarixi yo'q</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-3 px-4 text-text-muted font-medium text-sm">Sana</th>
                    <th className="py-3 px-4 text-text-muted font-medium text-sm">Summa</th>
                    <th className="py-3 px-4 text-text-muted font-medium text-sm">Tur</th>
                    <th className="py-3 px-4 text-text-muted font-medium text-sm">Izoh</th>
                    <th className="py-3 px-4 text-right text-text-muted font-medium text-sm">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {studentPayments.map(payment => (
                    <tr key={payment.id} className="border-b border-border hover:bg-bg-hover transition-colors">
                      <td className="py-3 px-4 text-text-primary">
                        {new Date(payment.date).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3 px-4 font-medium text-success">
                        {payment.amount.toLocaleString()} so'm
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.method === 'karta' ? 'bg-primary/10 text-primary' :
                          payment.method === 'hisob' ? 'bg-warning/10 text-warning' :
                          'bg-success/10 text-success'
                        }`}>
                          {payment.method === 'karta' ? 'Karta' : payment.method === 'hisob' ? 'Hisob raqam' : 'Naqd'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {payment.note || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => handleDeletePayment(payment.id)} className="text-danger border-danger/20 hover:bg-danger hover:text-white">
                          O'chirish
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog />
    </motion.div>
  );
};
