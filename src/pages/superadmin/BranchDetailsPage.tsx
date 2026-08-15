import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBranchStore } from '../../store/branchStore';
import { useStudentStore } from '../../store/studentStore';
import { useGroupStore } from '../../store/groupStore';
import { useUserStore } from '../../store/userStore';
import { useCashStore } from '../../store/cashStore';
import { IconUsers, IconSchool, IconWallet, IconIdBadge2, IconTrash, IconArrowLeft, IconEdit } from '@tabler/icons-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useForm as useRHForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Card, CardContent } from '../../components/ui/Card';
import { cn } from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { useConfirm } from '../../hooks/useConfirm';


const branchSchema = z.object({
  name: z.string().min(1, "Filial nomi kiritilishi shart"),
  address: z.string().min(1, "Manzil kiritilishi shart")
});
type BranchForm = z.infer<typeof branchSchema>;

export const BranchDetailsPage = () => {
  const { id: branchId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'employees' | 'groups' | 'students' | 'finance'>('employees');
  const [ConfirmDialog, confirm] = useConfirm();
  
  const { branches, deleteBranch, updateBranch, fetchBranches } = useBranchStore();
  const { students, fetchStudents } = useStudentStore();
  const { groups, fetchGroups } = useGroupStore();
  const { users, fetchUsers } = useUserStore();
  const { reports: cashReports, fetchReports } = useCashStore();

  useEffect(() => {
    if (branches.length === 0) fetchBranches();
    if (students.length === 0) fetchStudents();
    if (groups.length === 0) fetchGroups();
    if (users.length === 0) fetchUsers();
    if (cashReports.length === 0) fetchReports();
  }, []);

  const branch = branches.find(b => b.id === branchId);

  const [isEditModalOpen, React_setIsEditModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useRHForm<BranchForm>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: branch?.name || '',
      address: branch?.address || ''
    }
  });

  if (!branchId) return <div className="p-6 text-center mt-10 text-text-secondary">Branch ID topilmadi</div>;
  
  if (branches.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-secondary">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  if (!branch) return <div className="p-6 text-center mt-10 text-text-secondary">Filial topilmadi</div>;

  const onSubmit = async (data: BranchForm) => {
    await updateBranch(branch.id, data);
    React_setIsEditModalOpen(false);
  };

  const branchStudents = students.filter(s => s.branchId === branchId);
  const branchGroups = groups.filter(g => g.branchId === branchId);
  const branchUsers = users.filter(u => u.branchId === branchId);
  const branchReports = cashReports.filter(r => r.branchId === branchId && r.status === 'approved');

  const totalPaid = branchStudents.reduce((acc, curr) => acc + Number(curr.paidAmount || 0), 0);
  const totalDebt = branchStudents.reduce((acc, curr) => acc + Math.max(0, Number(curr.coursePrice || 0) - Number(curr.paidAmount || 0)), 0);
  const totalCashReported = branchReports.reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);

  const tabs = [
    { id: 'employees', label: 'Xodimlar', icon: IconIdBadge2, count: branchUsers.length },
    { id: 'groups', label: 'Guruhlar', icon: IconSchool, count: branchGroups.length },
    { id: 'students', label: "O'quvchilar", icon: IconUsers, count: branchStudents.length },
    { id: 'finance', label: 'Moliya', icon: IconWallet, count: undefined },
  ] as const;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-card border border-border hover:bg-bg-hover transition-colors text-text-secondary"
          >
            <IconArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{branch.name} - Batafsil ma'lumot</h1>
            <p className="text-sm text-text-muted">{branch.address}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => React_setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors font-medium text-sm"
          >
            <IconEdit size={18} />
            Tahrirlash
          </button>
          <button
            onClick={async () => {
              if(await confirm("Rostdan ham ushbu filialni o'chirmoqchimisiz? Barcha tegishli ma'lumotlar o'chib ketishi mumkin.")) {
                deleteBranch(branch.id);
                navigate('/superadmin/branches');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-lg transition-colors font-medium text-sm"
          >
            <IconTrash size={18} />
            Filialni o'chirish
          </button>
        </div>
      </div>

      <Card className="p-0 border-border bg-bg-card shadow-sm rounded-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex gap-2 p-4 bg-bg-base/50 border-b border-border overflow-x-auto whitespace-nowrap scrollbar-hide w-full">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex-shrink-0",
                  isActive 
                    ? "bg-white dark:bg-bg-card shadow-sm text-accent ring-1 ring-border" 
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                )}
              >
                <Icon size={18} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn(
                    "ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold",
                    isActive ? "bg-accent/10" : "bg-bg-hover text-text-muted"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 min-h-[400px]">
          {activeTab === 'employees' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>F.I.SH</TableHead>
                    <TableHead>Lavozimi</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-text-muted">Xodimlar topilmadi</TableCell></TableRow>
                  ) : (
                    branchUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded-md text-xs",
                            user.role === 'admin' ? "bg-accent/10 text-accent" : "bg-success/10 text-success"
                          )}>
                            {user.role === 'admin' ? 'Admin' : "O'qituvchi"}
                          </span>
                        </TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell className="text-text-muted">{user.login}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </motion.div>
          )}

          {activeTab === 'groups' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guruh nomi</TableHead>
                    <TableHead>O'qituvchi</TableHead>
                    <TableHead>O'quvchilar soni</TableHead>
                    <TableHead>Holati</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchGroups.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-text-muted">Guruhlar topilmadi</TableCell></TableRow>
                  ) : (
                    branchGroups.map(group => {
                      const teacher = branchUsers.find(u => u.id === group.teacherId);
                      const studentCount = branchStudents.filter(s => s.groupId === group.id).length;
                      return (
                        <TableRow key={group.id}>
                          <TableCell className="font-bold text-accent">{group.name}</TableCell>
                          <TableCell>{teacher?.name || "Noma'lum"}</TableCell>
                          <TableCell>{studentCount} ta</TableCell>
                          <TableCell>
                            <span className={cn(
                              "px-2 py-1 rounded-md text-xs",
                              group.status === 'active' ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                            )}>
                              {group.status === 'active' ? 'Faol' : 'Tugatilgan'}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>F.I.SH</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Guruh</TableHead>
                    <TableHead className="text-right">Qarzdorlik</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchStudents.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-text-muted">O'quvchilar topilmadi</TableCell></TableRow>
                  ) : (
                    branchStudents.map(student => {
                      const group = branchGroups.find(g => g.id === student.groupId);
                      const debt = Math.max(0, student.coursePrice - student.paidAmount);
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                          <TableCell>{student.phone}</TableCell>
                          <TableCell className="text-text-muted">{group?.name || "Noma'lum"}</TableCell>
                          <TableCell className={cn("text-right font-semibold", debt > 0 ? "text-danger" : "text-success")}>
                            {debt > 0 ? `${debt.toLocaleString()} so'm` : "Qarzi yo'q"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </motion.div>
          )}

          {activeTab === 'finance' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Umumiy to'langan summa</h4>
                  <p className="text-3xl font-extrabold text-success">{totalPaid.toLocaleString()} so'm</p>
                </CardContent>
              </Card>
              <Card className="bg-danger/5 border-danger/20">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Umumiy qarzdorlik</h4>
                  <p className="text-3xl font-extrabold text-danger">{totalDebt.toLocaleString()} so'm</p>
                </CardContent>
              </Card>
              <Card className="bg-accent/5 border-accent/20">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Kassaga topshirilgan summa</h4>
                  <p className="text-3xl font-extrabold text-accent">{totalCashReported.toLocaleString()} so'm</p>
                  <p className="text-xs text-text-muted mt-2">(Tasdiqlangan hisobotlar bo'yicha)</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </Card>

      <Modal isOpen={isEditModalOpen} onClose={() => React_setIsEditModalOpen(false)} title="Filialni tahrirlash">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Filial nomi" 
            placeholder="Masalan: Yunusobod filiali" 
            error={errors.name?.message} 
            {...register('name')} 
          />
          <Input 
            label="Manzil" 
            placeholder="Masalan: Toshkent sh. Yunusobod tumani" 
            error={errors.address?.message} 
            {...register('address')} 
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => React_setIsEditModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit">Saqlash</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog />
    </div>
  );
};
