import React, { useEffect, useState } from 'react';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconDownload, IconCash, IconFileCheck, IconUser } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStudentStore } from '../../../store/studentStore';
import { useGroupStore } from '../../../store/groupStore';
import { useBranchStore } from '../../../store/branchStore';
import { usePaymentStore } from '../../../store/paymentStore';
import { api } from '../../../services/api';
import { User } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../../../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { exportToExcel } from '../../../utils/exportExcel';
import { Modal } from '../../../components/ui/Modal';
import { IconMessageCircle, IconCheck, IconCar } from '@tabler/icons-react';
import { useForm as useRHForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../../store/authStore';

const studentSchema = z.object({
  firstName: z.string().min(2, "Ism kiritilishi shart"),
  lastName: z.string().min(2, "Familiya kiritilishi shart"),
  phone: z.string().min(9, "Telefon kiritilishi shart"),
  branchId: z.string().optional(),
  groupId: z.string().min(1, "Guruh tanlang"),
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

export const StudentsPage = () => {
  const { students, fetchStudents, addStudent, updateStudent } = useStudentStore();
  const { groups, fetchGroups } = useGroupStore();
  const { branches, fetchBranches, activeBranchId } = useBranchStore();
  const { addPayment } = usePaymentStore();
  const user = useAuthStore(state => state.user);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'naqd' | 'karta' | 'hisob'>('naqd');
  const [instructors, setInstructors] = useState<User[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudentForAssign, setSelectedStudentForAssign] = useState<any>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [practiceGroupId, setPracticeGroupId] = useState('');
  const [instructorGroups, setInstructorGroups] = useState<any[]>([]);
  
  const navigate = useNavigate();

  const { register, handleSubmit, reset, control, formState: { errors } } = useRHForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      coursePrice: 1500000, // Default narx
      branchId: user?.role === 'superadmin' ? '' : user?.branchId
    }
  });

  const selectedFormBranch = useWatch({
    control,
    name: 'branchId',
    defaultValue: user?.role === 'superadmin' ? '' : user?.branchId
  });

  const availableGroups = groups.filter(g => 
    user?.role === 'superadmin' ? g.branchId === selectedFormBranch : g.branchId === user?.branchId
  );

  useEffect(() => {
    fetchStudents();
    fetchGroups();
    fetchBranches();
    // Fetch instructors
    api.getUsers().then(users => {
      setInstructors(users.filter(u => u.role === 'instructor'));
    }).catch(console.error);
  }, [fetchStudents, fetchGroups, fetchBranches]);

  const onSubmit = async (data: StudentForm) => {
    if (user) {
      const selectedGroup = groups.find(g => g.id === data.groupId);

      try {
        if (editingStudent) {
          await updateStudent(editingStudent.id, {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            groupId: data.groupId,
            branchId: selectedGroup?.branchId || user.branchId || '',
            coursePrice: data.coursePrice,
            pinfl: data.pinfl,
            passport: data.passport,
            additionalPhone: data.additionalPhone,
            providedDocuments: data.providedDocuments || { photo: false, form083: false, passport: false },
          });
          alert('O\'quvchi muvaffaqiyatli tahrirlandi!');
        } else {
          await addStudent({
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            groupId: data.groupId,
            branchId: selectedGroup?.branchId || user.branchId || '',
            coursePrice: data.coursePrice,
            paidAmount: 0,
            status: 'active' as 'active',
            drivingHoursRequired: 20,
            drivingHoursDone: 0,
            pinfl: data.pinfl,
            passport: data.passport,
            additionalPhone: data.additionalPhone,
            providedDocuments: data.providedDocuments || { photo: false, form083: false, passport: false },
            documents: [],
            examResults: [],
            createdBy: user.id
          });
          alert('O\'quvchi muvaffaqiyatli qo\'shildi!');
        }

        setIsModalOpen(false);
        setEditingStudent(null);
        reset();
      } catch (error) {
        console.error('Submit error:', error);
        alert('Xatolik yuz berdi! Iltimos, konsolni tekshiring.');
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    reset({
      firstName: '',
      lastName: '',
      phone: '',
      groupId: '',
      coursePrice: 1500000,
      branchId: user?.role === 'superadmin' ? '' : user?.branchId,
      providedDocuments: { photo: false, form083: false, passport: false }
    });
    setIsModalOpen(false);
    setTimeout(() => setIsModalOpen(true), 0);
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    reset({
      firstName: student.firstName,
      lastName: student.lastName,
      phone: student.phone,
      groupId: student.groupId,
      coursePrice: student.coursePrice,
      branchId: student.branchId,
      pinfl: student.pinfl || '',
      passport: student.passport || '',
      additionalPhone: student.additionalPhone || '',
      providedDocuments: student.providedDocuments || { photo: false, form083: false, passport: false }
    });
    setIsModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    
    if (selectedStudentForPayment && amount > 0 && user) {
      const currentDebt = selectedStudentForPayment.coursePrice - selectedStudentForPayment.paidAmount;
      
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
      setPaymentMethod('naqd');
      setSelectedStudentForPayment(null);
    }
  };

  useEffect(() => {
    if (selectedInstructorId) {
      api.getPracticeGroups(selectedInstructorId).then(groups => {
        setInstructorGroups(groups.filter((g: any) => g.status === 'active'));
      });
    } else {
      setInstructorGroups([]);
    }
  }, [selectedInstructorId]);

  const handleAssignInstructorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentForAssign && selectedInstructorId) {
      await updateStudent(selectedStudentForAssign.id, {
        instructorId: selectedInstructorId,
        practiceGroupId: practiceGroupId || undefined
      });
      alert("Instruktorga muvaffaqiyatli biriktirildi!");
      setIsAssignModalOpen(false);
      setSelectedStudentForAssign(null);
      setSelectedInstructorId('');
      setPracticeGroupId('');
    }
  };

  const displayBranchId = user?.role === 'superadmin' ? activeBranchId : user?.branchId;

  const filteredStudents = students.filter(student => {
    const matchSearch = student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        student.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBranch = displayBranchId ? student.branchId === displayBranchId : true;
    const matchStatus = student.status !== 'completed';
    return matchSearch && matchBranch && matchStatus;
  });

  const getGroupName = (id: string) => {
    const group = groups.find(g => g.id === id);
    return group ? group.name : 'Noma\'lum';
  };

  const handleExport = () => {
    exportToExcel({
      data: filteredStudents.map(s => ({
        ...s,
        groupName: getGroupName(s.groupId),
        debt: s.coursePrice - s.paidAmount
      })),
      columns: [
        { header: 'Ism', key: 'firstName' },
        { header: 'Familiya', key: 'lastName' },
        { header: 'Telefon', key: 'phone' },
        { header: 'Guruh', key: 'groupName' },
        { header: 'Kurs Narxi', key: 'coursePrice' },
        { header: "To'langan", key: 'paidAmount' },
        { header: 'Qarzdorlik', key: 'debt' },
        { header: 'Holati', key: 'status' }
      ],
      fileName: 'oquvchilar_hisoboti',
      sheetName: 'Oquvchilar'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">Faol</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">Tugatgan</span>;
      case 'stopped':
        return <span className="px-2 py-1 bg-danger/10 text-danger text-xs rounded-full">To'xtatilgan</span>;
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">O'quvchilar</h2>
          <p className="text-text-muted">Barcha o'quvchilarni boshqarish</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <IconDownload size={18} />
            Eksport (Excel)
          </Button>
          <Button className="gap-2" onClick={handleOpenAddModal}>
            <IconPlus size={18} />
            O'quvchi qo'shish
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle>Ro'yxat</CardTitle>
            <div className="relative w-64">
              <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Qidiruv..."
                className="pl-10 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ism va familiya</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Guruh</TableHead>
                <TableHead>Qarzdorlik</TableHead>
                <TableHead>Holati</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-text-muted">
                    Ma'lumot topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, i) => (
                  <TableRow key={student.id} transition={{ delay: i * 0.05 }}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {student.firstName} {student.lastName}
                        {student.providedDocuments && student.providedDocuments.photo && student.providedDocuments.form083 && student.providedDocuments.passport && (
                          <span title="Barcha hujjatlar topshirilgan" className="text-success"><IconFileCheck size={16}/></span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>{getGroupName(student.groupId)}</TableCell>
                    <TableCell className="font-medium text-danger">
                      {(student.coursePrice - student.paidAmount).toLocaleString()} so'm
                    </TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {student.coursePrice - student.paidAmount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 border-success/20 text-success hover:bg-success hover:text-white"
                            title="To'lov kiritish"
                            onClick={() => {
                              setSelectedStudentForPayment(student);
                              setPaymentModalOpen(true);
                            }}
                          >
                            <IconCash size={16} />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-8 h-8 p-0"
                          onClick={() => handleEditStudent(student)}
                        >
                          <IconEdit size={16} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-8 h-8 p-0"
                          title="Profilni ko'rish"
                          onClick={() => navigate(`/admin/students/${student.id}`)}
                        >
                          <IconUser size={16} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-8 h-8 p-0 border-danger/20 text-danger hover:bg-danger hover:text-white"
                        >
                          <IconTrash size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingStudent(null); }} title={editingStudent ? "O'quvchi ma'lumotlarini tahrirlash" : "Yangi o'quvchi qo'shish"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ism" placeholder="O'quvchi ismi" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Familiya" placeholder="O'quvchi familiyasi" error={errors.lastName?.message} {...register('lastName')} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Telefon" placeholder="+998901234567" error={errors.phone?.message} {...register('phone')} />
            <Input label="Qo'shimcha telefon (ixtiyoriy)" placeholder="+998..." error={errors.additionalPhone?.message} {...register('additionalPhone')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="JSHSHR (ixtiyoriy)" placeholder="14 talik raqam" error={errors.pinfl?.message} {...register('pinfl')} />
            <Input label="Pasport seriya va raqam (ixtiyoriy)" placeholder="AA1234567" error={errors.passport?.message} {...register('passport')} />
          </div>
          
          {user?.role === 'superadmin' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Filialni tanlang</label>
              <select 
                className={`w-full bg-bg-base border ${errors.branchId ? 'border-danger' : 'border-border'} rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent transition-colors`}
                {...register('branchId')}
              >
                <option value="">Filialni tanlang</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Guruhni tanlang</label>
            <select 
              className={`w-full bg-bg-base border ${errors.groupId ? 'border-danger' : 'border-border'} rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent transition-colors`}
              {...register('groupId')}
              disabled={!selectedFormBranch && user?.role === 'superadmin'}
            >
              <option value="">Guruhni tanlang</option>
              {availableGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            {errors.groupId && <span className="text-xs text-danger mt-1">{errors.groupId.message}</span>}
          </div>

          <Input 
            label="Jami kurs narxi (so'm)" 
            type="number" 
            placeholder="1500000" 
            error={errors.coursePrice?.message} 
            {...register('coursePrice', { valueAsNumber: true })} 
          />

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-sm font-medium text-text-primary">Topshirilgan hujjatlar</label>
            <div className="flex flex-wrap gap-4 mt-1">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input 
                  type="checkbox" 
                  {...register('providedDocuments.photo')} 
                  className="w-4 h-4 text-accent border-border rounded focus:ring-accent"
                />
                3x4 rasm
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input 
                  type="checkbox" 
                  {...register('providedDocuments.form083')} 
                  className="w-4 h-4 text-accent border-border rounded focus:ring-accent"
                />
                083-shakl
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input 
                  type="checkbox" 
                  {...register('providedDocuments.passport')} 
                  className="w-4 h-4 text-accent border-border rounded focus:ring-accent"
                />
                Pasport nusxasi
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => { setIsModalOpen(false); setEditingStudent(null); }}>Bekor qilish</Button>
            <Button type="submit">{editingStudent ? "Saqlash" : "Qo'shish"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="To'lov kiritish">
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          {selectedStudentForPayment && (
            <div className="mb-4 p-4 rounded-lg bg-bg-hover">
              <p className="font-medium text-text-primary">{selectedStudentForPayment.firstName} {selectedStudentForPayment.lastName}</p>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-text-secondary">Qarzdorlik:</span>
                <span className="font-bold text-danger">{(selectedStudentForPayment.coursePrice - selectedStudentForPayment.paidAmount).toLocaleString()} so'm</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">To'lov summasi (so'm)</label>
            <Input 
              type="number" 
              placeholder="Masalan: 500000" 
              value={paymentAmount}
              max={selectedStudentForPayment ? selectedStudentForPayment.coursePrice - selectedStudentForPayment.paidAmount : undefined}
              onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
              required
            />
            {selectedStudentForPayment && Number(paymentAmount) > (selectedStudentForPayment.coursePrice - selectedStudentForPayment.paidAmount) && (
              <span className="text-xs text-danger">Summa qarz miqdoridan oshmasligi kerak!</span>
            )}
          </div>
          
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-sm font-medium text-text-primary">To'lov turi</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="method" value="naqd" checked={paymentMethod === 'naqd'} onChange={() => setPaymentMethod('naqd')} className="text-accent" />
                <span>Naqd</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="method" value="karta" checked={paymentMethod === 'karta'} onChange={() => setPaymentMethod('karta')} className="text-accent" />
                <span>Karta</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="method" value="hisob" checked={paymentMethod === 'hisob'} onChange={() => setPaymentMethod('hisob')} className="text-accent" />
                <span>Hisob raqam</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => setPaymentModalOpen(false)}>Bekor qilish</Button>
            <Button 
              type="submit" 
              disabled={
                !paymentAmount || 
                Number(paymentAmount) <= 0 || 
                (selectedStudentForPayment && Number(paymentAmount) > (selectedStudentForPayment.coursePrice - selectedStudentForPayment.paidAmount))
              }
            >
              To'lovni tasdiqlash
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAssignModalOpen} onClose={() => { setIsAssignModalOpen(false); setSelectedStudentForAssign(null); setPracticeGroupId(''); }} title="Amaliyotga biriktirish">
        <form onSubmit={handleAssignInstructorSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Instruktorni tanlang</label>
            <select 
              required
              className="w-full bg-bg-base border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent transition-colors"
              value={selectedInstructorId}
              onChange={(e) => setSelectedInstructorId(e.target.value)}
            >
              <option value="">Instruktorni tanlang</option>
              {instructors
                .filter(i => {
                  if (user?.role === 'superadmin' && selectedStudentForAssign) {
                    return i.branchId === selectedStudentForAssign.branchId;
                  }
                  return true;
                })
                .map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.carModel} - {i.transmission === 'auto' ? 'Avtomat' : 'Mexanika'})</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-sm font-medium text-text-primary">Amaliyot guruhi (Ixtiyoriy)</label>
            <select
              className="w-full bg-bg-base border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent transition-colors"
              value={practiceGroupId}
              onChange={(e) => setPracticeGroupId(e.target.value)}
              disabled={!selectedInstructorId}
            >
              <option value="">Guruhsiz</option>
              {instructorGroups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit" disabled={!selectedInstructorId}>Biriktirish</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default StudentsPage;
