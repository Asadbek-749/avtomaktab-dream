import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupStore } from '../../../store/groupStore';
import { useStudentStore } from '../../../store/studentStore';
import { useBranchStore } from '../../../store/branchStore';
import { usePaymentStore } from '../../../store/paymentStore';
import { useUserStore } from '../../../store/userStore';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../services/api';
import { User, Student } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { useConfirm } from '../../../hooks/useConfirm';
import { Input } from '../../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { exportToExcel } from '../../../utils/exportExcel';
import { 
  IconPlus, IconSearch, IconEdit, IconTrash, 
  IconDownload, IconCash, IconArrowLeft, IconUser, IconCar, IconEye
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useForm as useRHForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const studentSchema = z.object({
  firstName: z.string().min(2, "Ism kiritilishi shart"),
  lastName: z.string().min(2, "Familiya kiritilishi shart"),
  phone: z.string().min(9, "Telefon kiritilishi shart"),
  coursePrice: z.number().min(100000, "Kurs narxi kiritilishi shart"),
  pinfl: z.string().optional(),
  passport: z.string().optional(),
  additionalPhone: z.string().optional(),
  providedDocuments: z.object({
    photo: z.boolean().default(false),
    form083: z.boolean().default(false),
    passport: z.boolean().default(false)
  }).optional()
});

type StudentForm = z.infer<typeof studentSchema>;

export const GroupDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { groups, fetchGroups } = useGroupStore();
  const { students, fetchStudents, addStudent, updateStudent, deleteStudent } = useStudentStore();
  const { addPayment, payments, fetchPayments } = usePaymentStore();
  const { users, fetchUsers } = useUserStore();
  const user = useAuthStore(state => state.user);
  const [ConfirmDialog, confirm] = useConfirm();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debt' | 'paid'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  // Payment state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'naqd' | 'karta' | 'hisob'>('naqd');

  // Payment history state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);

  // Instructor assignment state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudentForAssign, setSelectedStudentForAssign] = useState<Student | null>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');

  const group = groups.find(g => g.id === id);
  const groupStudents = students.filter(s => s.groupId === id);
  const instructors = users.filter(u => u.role === 'instructor');

  useEffect(() => {
    fetchGroups();
    fetchStudents();
    fetchUsers();
    fetchPayments();
  }, [fetchGroups, fetchStudents, fetchUsers, fetchPayments]);

  const { register, handleSubmit, reset, formState: { errors } } = useRHForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      coursePrice: 1500000,
    }
  });

  const onSubmit = async (data: StudentForm) => {
    if (user && group) {
      try {
        if (editingStudent) {
          await updateStudent(editingStudent.id, {
            ...data,
            groupId: group.id,
            branchId: group.branchId,
            providedDocuments: data.providedDocuments || { photo: false, form083: false, passport: false },
          });
        } else {
          await addStudent({
            ...data,
            groupId: group.id,
            branchId: group.branchId,
            paidAmount: 0,
            status: 'active',
            drivingHoursRequired: 20,
            drivingHoursDone: 0,
            providedDocuments: data.providedDocuments || { photo: false, form083: false, passport: false },
            documents: [],
            examResults: [],
            createdBy: user.id
          });
        }
        setIsModalOpen(false);
        setEditingStudent(null);
        reset();
      } catch (error) {
        console.error('Submit error:', error);
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    reset({
      firstName: '',
      lastName: '',
      phone: '',
      coursePrice: 1500000,
      providedDocuments: { photo: false, form083: false, passport: false }
    });
    setIsModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    reset({
      firstName: student.firstName,
      lastName: student.lastName,
      phone: student.phone,
      coursePrice: Number(student.coursePrice),
      pinfl: student.pinfl || '',
      passport: student.passport || '',
      additionalPhone: student.additionalPhone || '',
      providedDocuments: (student.providedDocuments as any) || { photo: false, form083: false, passport: false }
    });
    setIsModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    
    if (selectedStudentForPayment && amount > 0 && user) {
      const currentDebt = Number(selectedStudentForPayment.coursePrice) - Number(selectedStudentForPayment.paidAmount);
      
      if (amount > currentDebt) {
        alert(`Kiritilgan summa qarzdorlikdan (${currentDebt.toLocaleString()} so'm) oshib ketishi mumkin emas!`);
        return;
      }

      addPayment({
        studentId: selectedStudentForPayment.id,
        amount: amount,
        method: paymentMethod,
        date: new Date().toISOString(),
        note: 'Dars uchun to\'lov',
        branchId: selectedStudentForPayment.branchId,
        addedBy: user.id
      }, user.name);
      
      setPaymentModalOpen(false);
      setPaymentAmount('');
    }
  };

  const handleAssignInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentForAssign && selectedInstructorId) {
      await updateStudent(selectedStudentForAssign.id, { instructorId: selectedInstructorId });
      setIsAssignModalOpen(false);
    }
  };

  const getInstructorName = (instructorId?: string) => {
    if (!instructorId) return 'Biriktirilmagan';
    const ins = instructors.find(i => i.id === instructorId);
    return ins ? ins.name : 'Noma\'lum';
  };

  if (!group) return <div className="p-8 text-center text-text-muted">Yuklanmoqda yoki guruh topilmadi...</div>;

  const filteredStudents = groupStudents.filter(s => {
    const matchSearch = `${s.firstName} ${s.lastName} ${s.phone}`.toLowerCase().includes(searchTerm.toLowerCase());
    const debt = Number(s.coursePrice) - Number(s.paidAmount);
    
    let matchFilter = true;
    if (filterType === 'debt') matchFilter = debt > 0;
    if (filterType === 'paid') matchFilter = debt <= 0;
    
    return matchSearch && matchFilter;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" className="p-2 border-border" onClick={() => navigate('/admin/groups')}>
          <IconArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{group.name}</h2>
          <p className="text-text-muted">Guruh ma'lumotlari va o'quvchilari</p>
        </div>
      </div>

      {/* Group Stats & Schedule */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-text-muted mb-1">O'qituvchi</p>
              <p className="font-semibold text-text-primary">{users.find(u => u.id === group.teacherId)?.name || "Noma'lum"}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted mb-1">Dars kunlari</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(group.schedule) && group.schedule.map((s: any, idx: number) => (
                  <span key={idx} className={`text-xs px-2 py-1 rounded-full ${s.type === 'theory' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}`}>
                    <span className="capitalize">{s.day}</span> {s.startTime}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-text-muted mb-1">Holati</p>
              <span className={`text-xs px-2 py-1 rounded-full ${group.status === 'active' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                {group.status === 'active' ? 'Faol' : 'Tugatilgan'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-64">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <Input 
              placeholder="O'quvchi qidirish..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-bg-base border border-border rounded-lg p-1">
            <button 
              className={`px-3 py-1 text-sm rounded-md transition-colors ${filterType === 'all' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => setFilterType('all')}
            >Barchasi</button>
            <button 
              className={`px-3 py-1 text-sm rounded-md transition-colors ${filterType === 'debt' ? 'bg-danger text-white' : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => setFilterType('debt')}
            >Qarzdorlar</button>
            <button 
              className={`px-3 py-1 text-sm rounded-md transition-colors ${filterType === 'paid' ? 'bg-success text-white' : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => setFilterType('paid')}
            >To'laganlar</button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => exportToExcel({
            data: filteredStudents, 
            fileName: 'Oquvchilar',
            columns: [
              { header: 'Ism', key: 'firstName' },
              { header: 'Familiya', key: 'lastName' },
              { header: 'Telefon', key: 'phone' },
              { header: 'JSHSHR', key: 'pinfl' },
              { header: 'Pasport', key: 'passport' }
            ]
          })}>
            <IconDownload size={18} />
            Eksport
          </Button>
          <Button className="gap-2" onClick={handleOpenAddModal}>
            <IconPlus size={18} />
            O'quvchi qo'shish
          </Button>
        </div>
      </div>

      {/* Students Table */}
      <Card className="border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>F.I.O</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Instruktor</TableHead>
              <TableHead>To'lov holati</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-text-muted py-8">O'quvchilar topilmadi</TableCell>
              </TableRow>
            ) : (
              filteredStudents.map(student => {
                const paid = Number(student.paidAmount);
                const price = Number(student.coursePrice);
                const debt = price - paid;
                const percent = Math.min(100, Math.round((paid / price) * 100)) || 0;
                
                return (
                  <TableRow key={student.id} className="hover:bg-bg-hover transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold text-text-primary">{student.firstName} {student.lastName}</div>
                          {student.pinfl && <div className="text-xs text-text-muted">PINFL: {student.pinfl}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-text-secondary">{student.phone}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm bg-bg-hover px-2 py-1 rounded-md text-text-secondary border border-border">
                        {getInstructorName(student.instructorId)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="w-full max-w-[200px]">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-success font-medium">{paid.toLocaleString()} so'm</span>
                          {debt > 0 && <span className="text-danger font-medium">Qarz: {debt.toLocaleString()}</span>}
                        </div>
                        <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${percent === 100 ? 'bg-success' : percent > 50 ? 'bg-warning' : 'bg-danger'}`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 bg-bg-base/50 p-1 rounded-lg border border-border shadow-sm">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-success hover:bg-success hover:text-white transition-colors rounded-md"
                            title="To'lov qilish"
                            onClick={() => { setSelectedStudentForPayment(student); setPaymentModalOpen(true); }}
                          >
                            <IconCash size={18} />
                          </Button>

                          <div className="w-px h-4 bg-border mx-1"></div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-text-secondary hover:bg-text-secondary hover:text-white transition-colors rounded-md"
                            title="Tahrirlash"
                            onClick={() => handleEditStudent(student)}
                          >
                            <IconEdit size={18} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-text-secondary hover:bg-text-secondary hover:text-white transition-colors rounded-md"
                            title="To'lovlar tarixi"
                            onClick={() => {
                              setSelectedStudentForHistory(student);
                              setHistoryModalOpen(true);
                            }}
                          >
                            <IconEye size={18} />
                          </Button>
                          <div className="w-px h-4 bg-border mx-1"></div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-danger hover:bg-danger hover:text-white transition-colors rounded-md"
                            title="O'chirish"
                            onClick={async () => {
                              if (await confirm("Rostdan ham ushbu o'quvchini o'chirmoqchimisiz?")) {
                                try {
                                  await deleteStudent(student.id);
                                } catch (e) {
                                  alert("O'chirishda xatolik yuz berdi");
                                }
                              }
                            }}
                          >
                            <IconTrash size={18} />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? "O'quvchini tahrirlash" : "Yangi o'quvchi qo'shish"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ism" {...register('firstName')} error={errors.firstName?.message} />
            <Input label="Familiya" {...register('lastName')} error={errors.lastName?.message} />
            <Input label="Telefon" placeholder="998901234567" {...register('phone')} error={errors.phone?.message} />
            <Input label="Qo'shimcha telefon (Ixtiyoriy)" {...register('additionalPhone')} error={errors.additionalPhone?.message} />
            <Input label="PINFL (Ixtiyoriy)" {...register('pinfl')} error={errors.pinfl?.message} />
            <Input label="Pasport seriya (Ixtiyoriy)" placeholder="AA1234567" {...register('passport')} error={errors.passport?.message} />
            <Input label="Kurs narxi" type="number" {...register('coursePrice', { valueAsNumber: true })} error={errors.coursePrice?.message} />
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-sm font-semibold text-text-primary">Taqdim etilgan hujjatlar (Ixtiyoriy)</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('providedDocuments.photo')} className="rounded bg-bg-base border-border text-accent focus:ring-accent" />
                <span className="text-sm text-text-secondary">Rasm (3x4)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('providedDocuments.form083')} className="rounded bg-bg-base border-border text-accent focus:ring-accent" />
                <span className="text-sm text-text-secondary">083-shakl (Med spravka)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('providedDocuments.passport')} className="rounded bg-bg-base border-border text-accent focus:ring-accent" />
                <span className="text-sm text-text-secondary">Pasport nusxasi</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit">Saqlash</Button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal 
        isOpen={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)}
        title="To'lov qabul qilish"
      >
        {selectedStudentForPayment && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="bg-bg-hover p-4 rounded-lg space-y-2 border border-border">
              <div className="flex justify-between">
                <span className="text-text-secondary">O'quvchi:</span>
                <span className="font-bold">{selectedStudentForPayment.firstName} {selectedStudentForPayment.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Kurs narxi:</span>
                <span className="font-bold">{Number(selectedStudentForPayment.coursePrice).toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">To'langan:</span>
                <span className="font-bold text-success">{Number(selectedStudentForPayment.paidAmount).toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-text-secondary">Qarzdorlik:</span>
                <span className="font-bold text-danger">{(Number(selectedStudentForPayment.coursePrice) - Number(selectedStudentForPayment.paidAmount)).toLocaleString()} so'm</span>
              </div>
            </div>

            <Input 
              label="To'lov summasi (so'm)" 
              type="number" 
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
              required
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary block">To'lov usuli</label>
              <select 
                className="w-full bg-bg-base border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="naqd">Naqd pul</option>
                <option value="karta">Plastik karta</option>
                <option value="hisob">Hisob raqam</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)}>Bekor qilish</Button>
              <Button type="submit" disabled={!paymentAmount || Number(paymentAmount) <= 0}>To'lovni saqlash</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Instructor Assignment Modal */}
      <Modal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)}
        title="Instruktor biriktirish"
      >
        <form onSubmit={handleAssignInstructor} className="space-y-4">
          <p className="text-text-muted">
            <strong className="text-text-primary">{selectedStudentForAssign?.firstName} {selectedStudentForAssign?.lastName}</strong> uchun amaliyot instruktorini tanlang.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary block">Instruktor</label>
            <select 
              className="w-full bg-bg-base border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
              value={selectedInstructorId}
              onChange={(e) => setSelectedInstructorId(e.target.value)}
              required
            >
              <option value="">Tanlang...</option>
              {instructors.map(ins => (
                <option key={ins.id} value={ins.id}>{ins.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit" disabled={!selectedInstructorId}>Saqlash</Button>
          </div>
        </form>
      </Modal>
      {/* Payment History Modal */}
      <Modal 
        isOpen={historyModalOpen} 
        onClose={() => setHistoryModalOpen(false)}
        title="To'lovlar tarixi"
      >
        {selectedStudentForHistory && (
          <div className="space-y-4 max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center bg-bg-hover p-4 rounded-lg border border-border">
              <div>
                <p className="font-bold text-text-primary">{selectedStudentForHistory.firstName} {selectedStudentForHistory.lastName}</p>
                <p className="text-sm text-text-muted">
                  To'langan: <span className="text-success font-semibold">{Number(selectedStudentForHistory.paidAmount).toLocaleString()} so'm</span> / {Number(selectedStudentForHistory.coursePrice).toLocaleString()} so'm
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => {
                  const studentPayments = payments.filter(p => p.studentId === selectedStudentForHistory.id);
                  exportToExcel({
                    data: studentPayments.map(p => ({
                      amount: p.amount,
                      date: new Date(p.date).toLocaleString('uz-UZ'),
                      method: p.method === 'naqd' ? 'Naqd pul' : p.method === 'karta' ? 'Karta' : 'Hisob raqam',
                      note: p.note || ''
                    })),
                    fileName: `${selectedStudentForHistory.firstName}_${selectedStudentForHistory.lastName}_tolovlar`,
                    columns: [
                      { header: 'Summa', key: 'amount' },
                      { header: 'Sana va vaqt', key: 'date' },
                      { header: 'To\'lov usuli', key: 'method' },
                      { header: 'Izoh', key: 'note' }
                    ]
                  });
                }}
              >
                <IconDownload size={16} /> Excel
              </Button>
            </div>

            <div className="overflow-y-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Summa</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead>Usul</TableHead>
                    <TableHead>Izoh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.filter(p => p.studentId === selectedStudentForHistory.id).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-text-muted">To'lovlar topilmadi</TableCell>
                    </TableRow>
                  ) : (
                    payments
                      .filter(p => p.studentId === selectedStudentForHistory.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-bold text-success">
                            + {Number(payment.amount).toLocaleString()} so'm
                          </TableCell>
                          <TableCell className="text-sm">{new Date(payment.date).toLocaleString('uz-UZ')}</TableCell>
                          <TableCell className="text-sm">
                            {payment.method === 'naqd' ? 'Naqd' : payment.method === 'karta' ? 'Karta' : 'Hisob'}
                          </TableCell>
                          <TableCell className="text-sm text-text-muted">{payment.note}</TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setHistoryModalOpen(false)}>Yopish</Button>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog />
    </motion.div>
  );
};
