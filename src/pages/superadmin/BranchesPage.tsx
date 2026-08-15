import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IconPlus, IconBuildingCommunity, IconUsers, IconSchool, IconAlertCircle, IconArrowRight } from '@tabler/icons-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useBranchStore } from '../../store/branchStore';
import { useStudentStore } from '../../store/studentStore';
import { useGroupStore } from '../../store/groupStore';
import { useUserStore } from '../../store/userStore';
import { api } from '../../services/api';
import { useForm as useRHForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const branchSchema = z.object({
  name: z.string().min(3, "Filial nomi kiritilishi shart"),
  address: z.string().min(5, "Manzil kiritilishi shart")
});

type BranchForm = z.infer<typeof branchSchema>;

export const BranchesPage = () => {
  const { branches, fetchBranches, addBranch, deleteBranch } = useBranchStore();
  const { students, fetchStudents } = useStudentStore();
  const { groups, fetchGroups } = useGroupStore();
  const { users, fetchUsers } = useUserStore();
  const [isModalOpen, React_setIsModalOpen] = React.useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, reset, formState: { errors } } = useRHForm<BranchForm>({
    resolver: zodResolver(branchSchema)
  });

  React.useEffect(() => {
    fetchBranches();
    fetchStudents();
    fetchGroups();
    fetchUsers();
  }, [fetchBranches, fetchStudents, fetchGroups, fetchUsers]);

  const onSubmit = (data: BranchForm) => {
    addBranch({ name: data.name, address: data.address });
    React_setIsModalOpen(false);
    reset();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Filiallar</h2>
          <p className="text-text-muted">Maktab filiallari ro'yxati</p>
        </div>
        <Button className="gap-2" onClick={() => React_setIsModalOpen(true)}>
          <IconPlus size={18} />Filial qo'shish</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => {
          const branchStudents = students.filter(s => s.branchId === branch.id);
          const branchGroups = groups.filter(g => g.branchId === branch.id);
          const branchDebtors = branchStudents.filter(s => s.coursePrice - s.paidAmount > 0).length;
          const branchUsers = users.filter(u => u.branchId === branch.id).length;

          return (
            <div 
              key={branch.id}
              onClick={() => navigate('/superadmin/branches/' + branch.id)}
              className="group glass-panel luxury-shadow relative rounded-[20px] p-5 cursor-pointer hover:-translate-y-1.5 hover:shadow-xl hover:shadow-accent/20 transition-all duration-500 overflow-hidden"
            >
              {/* Premium Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-br from-accent/30 via-transparent to-purple-500/30 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-accent to-purple-600 text-white flex items-center justify-center shadow-md shadow-accent/30 group-hover:scale-105 transition-transform duration-500">
                          <IconBuildingCommunity size={24} stroke={1.5} />
                        </div>
                        {/* Status Dot */}
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-bg-card rounded-full flex items-center justify-center">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-bold text-text-primary group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent group-hover:to-purple-500 transition-all duration-300 leading-tight">{branch.name}</h3>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{branch.address}</p>
                      </div>
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-bg-base/50 border border-border/50 backdrop-blur-md flex items-center justify-center text-text-muted group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all duration-300 shrink-0 transform group-hover:rotate-[-45deg]">
                      <IconArrowRight size={16} stroke={1.5} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-white/5 dark:bg-black/20 border border-border/40 backdrop-blur-sm rounded-xl p-2.5 flex flex-col justify-center group-hover:bg-accent/5 transition-colors duration-300">
                      <span className="text-[11px] font-medium text-text-muted flex items-center gap-1 mb-1">
                        <IconSchool size={14} className="text-indigo-500" /> Guruhlar
                      </span>
                      <strong className="text-lg font-bold text-text-primary leading-none">{branchGroups.length}</strong>
                    </div>
                    
                    <div className="bg-white/5 dark:bg-black/20 border border-border/40 backdrop-blur-sm rounded-xl p-2.5 flex flex-col justify-center group-hover:bg-accent/5 transition-colors duration-300">
                      <span className="text-[11px] font-medium text-text-muted flex items-center gap-1 mb-1">
                        <IconUsers size={14} className="text-blue-500" /> O'quvchilar
                      </span>
                      <strong className="text-lg font-bold text-text-primary leading-none">{branchStudents.length}</strong>
                    </div>

                    <div className="bg-white/5 dark:bg-black/20 border border-border/40 backdrop-blur-sm rounded-xl p-2.5 flex flex-col justify-center group-hover:bg-accent/5 transition-colors duration-300">
                      <span className="text-[11px] font-medium text-text-muted flex items-center gap-1 mb-1">
                        <IconUsers size={14} className="text-purple-500" /> Xodimlar
                      </span>
                      <strong className="text-lg font-bold text-text-primary leading-none">{branchUsers}</strong>
                    </div>

                    <div className="bg-red-500/5 border border-red-500/10 backdrop-blur-sm rounded-xl p-2.5 flex flex-col justify-center group-hover:bg-red-500/10 transition-colors duration-300">
                      <span className="text-[11px] font-medium text-red-500/80 flex items-center gap-1 mb-1">
                        <IconAlertCircle size={14} /> Qarzdorlar
                      </span>
                      <strong className="text-lg font-bold text-red-500 leading-none">{branchDebtors}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => React_setIsModalOpen(false)} title="Yangi filial qo'shish">
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
            <Button variant="outline" type="button" onClick={() => React_setIsModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit">Qo'shish</Button>
          </div>
        </form>
      </Modal>

      
    </motion.div>
  );
};

export default BranchesPage;
