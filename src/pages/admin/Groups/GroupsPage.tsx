import React, { useEffect, useState } from 'react';
import { IconPlus, IconSearch, IconCheck, IconDownload, IconArrowBackUp, IconEdit } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useGroupStore } from '../../../store/groupStore';
import { useStudentStore } from '../../../store/studentStore';
import { useBranchStore } from '../../../store/branchStore';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { useForm as useRHForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../../store/authStore';
import { useUserStore } from '../../../store/userStore';
import { exportToExcel } from '../../../utils/export';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';

const groupSchema = z.object({
  name: z.string().min(2, "Guruh nomi kiritilishi shart"),
  teacherId: z.string().min(1, "O'qituvchini tanlang"),
  branchId: z.string().min(1, "Filialni tanlang"),
  days: z.array(z.string()).min(1, "Kamida bitta kun tanlanishi kerak"),
  startTime: z.string().min(4, "Boshlanish vaqtini kiriting"),
  type: z.enum(['theory', 'practice'])
});

const WEEK_DAYS = [
  { id: 'mon', label: 'Dushanba' },
  { id: 'tue', label: 'Seshanba' },
  { id: 'wed', label: 'Chorshanba' },
  { id: 'thu', label: 'Payshanba' },
  { id: 'fri', label: 'Juma' },
  { id: 'sat', label: 'Shanba' },
];

type GroupForm = z.infer<typeof groupSchema>;

export const GroupsPage = () => {
  const { groups, fetchGroups, addGroup, updateGroup } = useGroupStore();
  const { students, fetchStudents } = useStudentStore();
  const { users, fetchUsers } = useUserStore();
  const { branches, fetchBranches, activeBranchId } = useBranchStore();
  const user = useAuthStore(state => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [editingGroup, setEditingGroup] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useRHForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      days: [],
      startTime: '09:00',
      type: 'theory',
      branchId: user?.role === 'superadmin' ? '' : user?.branchId
    }
  });

  const teachers = users.filter(u => u.role === 'teacher');

  useEffect(() => {
    fetchGroups();
    fetchStudents();
    fetchBranches();
    fetchUsers();
  }, [fetchGroups, fetchStudents, fetchBranches, fetchUsers]);

  // If admin/teacher, they only see their branch. If superadmin, filter by activeBranchId
  const displayBranchId = user?.role === 'superadmin' ? activeBranchId : user?.branchId;
  
  const filteredGroups = groups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBranch = displayBranchId ? g.branchId === displayBranchId : true;
    const matchTab = g.status === 'active';
    return matchSearch && matchBranch && matchTab;
  });

  const onSubmit = (data: GroupForm) => {
    if (user) {
      if (editingGroup) {
        updateGroup(editingGroup.id, {
          name: data.name,
          teacherId: data.teacherId,
          branchId: data.branchId,
          schedule: data.days.map(day => ({
            day: day as any,
            startTime: data.startTime,
            type: data.type
          }))
        });
      } else {
        addGroup({
          name: data.name,
          teacherId: data.teacherId,
          branchId: data.branchId,
          status: 'active',
          schedule: data.days.map(day => ({
            day: day as any,
            startTime: data.startTime,
            type: data.type
          }))
        }, user.id);
      }
      setIsModalOpen(false);
      setEditingGroup(null);
      reset();
    }
  };

  const handleOpenAddModal = () => {
    setEditingGroup(null);
    reset({
      name: '',
      teacherId: '',
      days: [],
      startTime: '09:00',
      type: 'theory',
      branchId: user?.role === 'superadmin' ? '' : user?.branchId
    });
    setIsModalOpen(true);
  };

  const handleEditGroup = (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroup(group);
    reset({
      name: group.name,
      teacherId: group.teacherId,
      branchId: group.branchId,
      days: group.schedule.map((s: any) => s.day),
      startTime: group.schedule.length > 0 ? group.schedule[0].startTime : '09:00',
      type: group.schedule.length > 0 ? group.schedule[0].type : 'theory'
    });
    setIsModalOpen(true);
  };

  const handleCompleteGroup = (groupId: string) => {
    if (confirm("Haqiqatdan ham bu guruhni tugatmoqchimisiz?")) {
      updateGroup(groupId, { status: 'completed', completedAt: new Date().toISOString() });
    }
  };

  const handleReactivateGroup = (groupId: string) => {
    if (confirm("Haqiqatdan ham bu guruhni qayta faollashtirmoqchimisiz?")) {
      updateGroup(groupId, { status: 'active', completedAt: undefined });
    }
  };

  const handleExportGroup = (group: any) => {
    const groupStudents = students.filter(s => s.groupId === group.id);
    const exportData = groupStudents.map(s => ({
      'Ism Familiya': `${s.firstName} ${s.lastName}`,
      'Telefon': s.phone,
      'Kurs Narxi': s.coursePrice,
      'To\'langan': s.paidAmount,
      'Qarzdorlik': s.coursePrice - s.paidAmount,
      'Holati': s.status === 'active' ? 'O\'qimoqda' : 'Tugatgan'
    }));
    
    if (exportData.length === 0) {
      alert("Guruhda o'quvchilar yo'q!");
      return;
    }
    
    exportToExcel(exportData, `Guruh_${group.name}_Hisobot_${new Date().toISOString().split('T')[0]}`);
  };

  const handleViewGroupStudents = (group: any) => {
    setSelectedGroup(group);
    setStudentsModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Guruhlar</h2>
          <p className="text-text-muted">Maktab guruhlari</p>
        </div>
        <Button className="gap-2" onClick={handleOpenAddModal}>
          <IconPlus size={18} />
          Guruh yaratish
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-4 border-b border-border pb-4">
        {/* active and completed tabs removed */}
        
        <div className="flex items-center w-full max-w-sm relative">
          <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Qidiruv..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-muted">
            Guruhlar topilmadi
          </div>
        ) : (
          filteredGroups.map((group, i) => (
            <motion.div 
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="hover:-translate-y-1 transition-transform duration-200">
                <CardContent className="p-6 cursor-pointer" onClick={() => handleViewGroupStudents(group)}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary hover:text-accent transition-colors">{group.name}</h3>
                      <p className="text-xs text-text-muted mt-1">Ochildi: {new Date(group.createdAt).toLocaleDateString('uz-UZ')}</p>
                      {group.status === 'completed' && group.completedAt && (
                        <p className="text-xs text-text-muted">Tugatildi: {new Date(group.completedAt).toLocaleDateString('uz-UZ')}</p>
                      )}
                    </div>
                    <span className="bg-accent-bg text-accent px-3 py-1 rounded-full text-xs font-semibold">
                      {students.filter(s => s.groupId === group.id).length} O'quvchi
                    </span>
                  </div>
                  
                  <div className="space-y-2 mt-4 pt-4 border-t border-border text-sm">
                    {group.schedule.map((slot, idx) => (
                      <div key={idx} className="flex justify-between text-text-secondary">
                        <span className="capitalize">{slot.day}</span>
                        <span>{slot.startTime} ({slot.type === 'theory' ? 'Nazariya' : 'Amaliyot'})</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2 text-xs h-8"
                      onClick={(e) => handleEditGroup(group, e)}
                    >
                      <IconEdit size={14} />
                      Tahrir
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2 text-xs h-8"
                      onClick={() => handleExportGroup(group)}
                    >
                      <IconDownload size={14} />
                      Excel
                    </Button>
                    {group.status === 'active' ? (
                      <Button 
                        className="flex-1 gap-2 text-xs h-8 bg-success/10 text-success hover:bg-success hover:text-white border-none"
                        onClick={() => handleCompleteGroup(group.id)}
                      >
                        <IconCheck size={14} />
                        Tugatish
                      </Button>
                    ) : (
                      <Button 
                        className="flex-1 gap-2 text-xs h-8 bg-warning/10 text-warning hover:bg-warning hover:text-white border-none"
                        onClick={() => handleReactivateGroup(group.id)}
                      >
                        <IconArrowBackUp size={14} />
                        Qayta tiklash
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGroup ? "Guruhni tahrirlash" : "Yangi guruh yaratish"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Guruh nomi" 
            placeholder="Masalan: B-Toifa 12-guruh" 
            error={errors.name?.message} 
            {...register('name')} 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Filial</label>
              <select 
                className={`w-full bg-bg-base border ${errors.branchId ? 'border-danger' : 'border-border'} rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent transition-colors`}
                {...register('branchId')}
                disabled={user?.role !== 'superadmin'}
              >
                <option value="">Filialni tanlang</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {errors.branchId && <span className="text-xs text-danger mt-1">{errors.branchId.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Biriktirilgan o'qituvchi</label>
              <select 
                className={`w-full bg-bg-base border ${errors.teacherId ? 'border-danger' : 'border-border'} rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent transition-colors`}
                {...register('teacherId')}
              >
                <option value="">O'qituvchini tanlang</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {errors.teacherId && <span className="text-xs text-danger mt-1">{errors.teacherId.message}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Dars kunlari</label>
            <div className="flex flex-wrap gap-3">
              {WEEK_DAYS.map(day => (
                <label key={day.id} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input 
                    type="checkbox" 
                    value={day.id} 
                    {...register('days')}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  {day.label}
                </label>
              ))}
            </div>
            {errors.days && <span className="text-xs text-danger mt-1">{errors.days.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Boshlanish vaqti" 
              type="time" 
              error={errors.startTime?.message} 
              {...register('startTime')} 
            />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Dars turi</label>
              <select 
                className={`w-full bg-bg-base border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent transition-colors`}
                {...register('type')}
              >
                <option value="theory">Nazariya</option>
                <option value="practice">Amaliyot</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit">{editingGroup ? "Saqlash" : "Qo'shish"}</Button>
          </div>
        </form>
      </Modal>

      {/* O'quvchilar ro'yxati modali */}
      <Modal isOpen={studentsModalOpen} onClose={() => setStudentsModalOpen(false)} title={`${selectedGroup?.name || ''} o'quvchilari`}>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {selectedGroup && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ism Familiya</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">Qarzi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.filter(s => s.groupId === selectedGroup.id).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-text-muted">
                      Bu guruhda o'quvchilar yo'q
                    </TableCell>
                  </TableRow>
                ) : (
                  students.filter(s => s.groupId === selectedGroup.id).map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell className="text-right text-danger font-medium">
                        {(student.coursePrice - student.paidAmount).toLocaleString()} so'm
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setStudentsModalOpen(false)}>Yopish</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default GroupsPage;
