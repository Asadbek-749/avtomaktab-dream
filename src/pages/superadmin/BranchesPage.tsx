import React from 'react';
import { motion } from 'framer-motion';
import { IconPlus, IconBuildingCommunity, IconUsers, IconSchool, IconAlertCircle, IconTrash } from '@tabler/icons-react';
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
import { BranchDetailsModal } from './BranchDetailsModal';

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
  const [selectedBranchId, setSelectedBranchId] = React.useState<string | null>(null);

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
            <Card 
              key={branch.id} 
              className="hover:-translate-y-1 transition-transform duration-200 cursor-pointer"
              onClick={() => setSelectedBranchId(branch.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-bg rounded-lg flex items-center justify-center text-accent">
                      <IconBuildingCommunity size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary">{branch.name}</h3>
                      <p className="text-sm text-text-muted">{branch.address}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary flex items-center gap-1"><IconSchool size={16} /> Guruhlar:</span>
                    <strong className="text-text-primary">{branchGroups.length} ta</strong>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary flex items-center gap-1"><IconUsers size={16} /> O'quvchilar:</span>
                    <strong className="text-text-primary">{branchStudents.length} ta</strong>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary flex items-center gap-1"><IconUsers size={16} /> Xodimlar:</span>
                    <strong className="text-text-primary">{branchUsers} nafar</strong>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-danger flex items-center gap-1 font-medium"><IconAlertCircle size={16} /> Qarzdorlar:</span>
                    <strong className="text-danger">{branchDebtors} ta</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
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

      <BranchDetailsModal 
        isOpen={!!selectedBranchId}
        onClose={() => setSelectedBranchId(null)}
        branchId={selectedBranchId}
      />
    </motion.div>
  );
};

export default BranchesPage;
