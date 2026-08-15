import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconSearch, IconCheck, IconDownload, IconArrowBackUp, IconEdit, IconUsers, IconCar, IconClock, IconCalendarEvent, IconChevronRight } from '@tabler/icons-react';
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
import { exportToExcel } from '../../../utils/exportExcel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { useConfirm } from '../../../hooks/useConfirm';

const groupSchema = z.object({
  name: z.string().min(2, "Guruh nomi kiritilishi shart"),
  teacherId: z.string().min(1, "O'qituvchini tanlang"),
  branchId: z.string().optional(),
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
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [ConfirmDialog, confirm] = useConfirm();

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

  const navigate = useNavigate();

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
          branchId: data.branchId || user.branchId || '',
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
          branchId: data.branchId || user.branchId || '',
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

  const handleCompleteGroup = async (groupId: string) => {
    if (await confirm("Haqiqatdan ham bu guruhni tugatmoqchimisiz?")) {
      updateGroup(groupId, { status: 'completed', completedAt: new Date().toISOString() });
    }
  };

  const handleReactivateGroup = async (groupId: string) => {
    if (await confirm("Haqiqatdan ham bu guruhni qayta faollashtirmoqchimisiz?")) {
      updateGroup(groupId, { status: 'active', completedAt: undefined });
    }
  };

  const handleExportGroup = (group: any) => {
    const groupStudents = students.filter(s => s.groupId === group.id);
    exportToExcel({
      data: groupStudents.map(s => ({
        ...s,
        fullName: `${s.firstName} ${s.lastName}`,
        debt: s.coursePrice - s.paidAmount,
        statusFormatted: s.status === 'active' ? 'O\'qimoqda' : 'Tugatgan'
      })),
      columns: [
        { header: 'Ism Familiya', key: 'fullName' },
        { header: 'Telefon', key: 'phone' },
        { header: 'Kurs Narxi', key: 'coursePrice' },
        { header: 'To\'langan', key: 'paidAmount' },
        { header: 'Qarzdorlik', key: 'debt' },
        { header: 'Holati', key: 'statusFormatted' }
      ],
      fileName: `Guruh_${group.name}_Hisobot`,
      sheetName: 'Oquvchilar'
    });
  };

  const handleViewGroupStudents = (group: any) => {
    navigate(`/admin/groups/${group.id}`);
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
              <Card className="hover:-translate-y-2 transition-all duration-500 shadow-xl hover:shadow-2xl border-0 overflow-hidden group/card relative rounded-[20px] bg-bg-base dark:bg-bg-card flex flex-col">
                {/* Header (Dark Gradient) */}
                <div 
                  className="px-5 py-5 cursor-pointer relative bg-gradient-to-r from-slate-900 to-indigo-950 overflow-hidden"
                  onClick={() => handleViewGroupStudents(group)}
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px] group-hover/card:bg-indigo-400/30 transition-all duration-700 pointer-events-none"></div>

                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-3">
                      {/* Car Icon Box */}
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <IconCar size={26} stroke={1.5} />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-white tracking-tight">
                          {group.name}
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1 font-medium">
                          <IconCalendarEvent size={14} className="text-slate-400" />
                          {new Date(group.createdAt).toLocaleDateString('uz-UZ')}
                          {group.status === 'completed' && group.completedAt && (
                             <span className="text-emerald-400 ml-1">
                               (Tugatildi: {new Date(group.completedAt).toLocaleDateString('uz-UZ')})
                             </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Floating Student Badge */}
                    <div className="flex flex-col items-end">
                      <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <IconUsers size={16} />
                        {students.filter(s => s.groupId === group.id).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body (Schedule Rows) */}
                <div className="p-4 pb-2 flex-1 bg-white dark:bg-[#0B0F19] relative z-20 -mt-3 rounded-t-[20px]">
                  <div className="space-y-2">
                    {group.schedule.map((slot, idx) => {
                      const styles = [
                        { leftBorder: 'border-indigo-500', iconBg: 'bg-indigo-100 dark:bg-indigo-500/20', iconText: 'text-indigo-600 dark:text-indigo-400', timeBg: 'bg-indigo-50 dark:bg-indigo-500/10', timeText: 'text-indigo-700 dark:text-indigo-300' },
                        { leftBorder: 'border-sky-500', iconBg: 'bg-sky-100 dark:bg-sky-500/20', iconText: 'text-sky-600 dark:text-sky-400', timeBg: 'bg-sky-50 dark:bg-sky-500/10', timeText: 'text-sky-700 dark:text-sky-300' },
                        { leftBorder: 'border-emerald-500', iconBg: 'bg-emerald-100 dark:bg-emerald-500/20', iconText: 'text-emerald-600 dark:text-emerald-400', timeBg: 'bg-emerald-50 dark:bg-emerald-500/10', timeText: 'text-emerald-700 dark:text-emerald-300' }
                      ];
                      const style = styles[idx % 3];
                      
                      const uzbekDays: Record<string, string> = {
                        mon: 'Dush',
                        tue: 'Sesh',
                        wed: 'Chor',
                        thu: 'Pay',
                        fri: 'Juma',
                        sat: 'Shan',
                        sun: 'Yak'
                      };
                      const dayName = uzbekDays[slot.day.toLowerCase()] || slot.day.substring(0, 3);

                      return (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5 border-l-[3px] border-y border-r border-border/40 hover:shadow-md transition-shadow ${style.leftBorder}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style.iconBg} ${style.iconText}`}>
                              <IconClock size={16} stroke={1.5} />
                            </div>
                            <span className="font-bold text-text-primary text-sm w-9">{dayName}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-1 justify-center">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${style.timeBg} ${style.timeText}`}>
                              {slot.startTime}
                            </span>
                            <span className="text-xs font-medium text-text-muted">
                              ({slot.type === 'theory' ? 'Nazariya' : 'Amaliyot'})
                            </span>
                          </div>
                          <IconChevronRight size={16} className="text-text-muted/50" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer (Action Buttons) */}
                <div className="p-4 pt-3 bg-white dark:bg-[#0B0F19] grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                  <div 
                    className="flex flex-row items-center justify-center gap-2 py-2.5 rounded-xl border border-border/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer text-center group/btn"
                    onClick={(e) => handleEditGroup(group, e)}
                  >
                    <IconEdit size={18} stroke={2} className="text-indigo-500 group-hover/btn:scale-110 transition-transform" />
                    <span className="font-bold text-text-primary text-sm">Tahrir</span>
                  </div>

                  {group.status === 'active' ? (
                    <div 
                      className="flex flex-row items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer text-center group/btn"
                      onClick={() => handleCompleteGroup(group.id)}
                    >
                      <IconCheck size={18} stroke={2.5} className="group-hover/btn:scale-110 transition-transform" />
                      <span className="font-bold text-sm">Tugatish</span>
                    </div>
                  ) : (
                    <div 
                      className="flex flex-row items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md shadow-orange-500/20 transition-all cursor-pointer text-center group/btn"
                      onClick={() => handleReactivateGroup(group.id)}
                    >
                      <IconArrowBackUp size={18} stroke={2.5} className="group-hover/btn:scale-110 transition-transform" />
                      <span className="font-bold text-sm">Tiklash</span>
                    </div>
                  )}
                </div>
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

      <ConfirmDialog />
    </motion.div>
  );
};

export default GroupsPage;
