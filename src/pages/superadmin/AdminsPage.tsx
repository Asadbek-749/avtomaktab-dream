import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconPlus, IconLock, IconLockOpen, IconTrash, IconEdit } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useUserStore } from '../../store/userStore';
import { useBranchStore } from '../../store/branchStore';
import { Role } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useConfirm } from '../../hooks/useConfirm';

const userSchema = z.object({
  name: z.string().min(3, "Ism kamida 3 ta harfdan iborat bo'lishi kerak"),
  login: z.string().min(3, "Login kamida 3 ta belgi bo'lishi kerak"),
  phone: z.string().min(9, "Telefon raqam xato"),
  password: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak"),
  role: z.enum(['admin', 'teacher'] as const),
  branchId: z.string().min(1, "Filial tanlang")
});

type UserForm = z.infer<typeof userSchema>;

export const AdminsPage = () => {
  const { users, fetchUsers, addUser, updateUser, deleteUser, toggleUserStatus } = useUserStore();
  const { branches, fetchBranches } = useBranchStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [ConfirmDialog, confirm] = useConfirm();

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, [fetchUsers, fetchBranches]);

  const nonSuperAdmins = users.filter(u => u.role !== 'superadmin');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'admin' }
  });

  const handleOpenAddModal = () => {
    setEditingUser(null);
    reset({ name: '', login: '', phone: '', password: '', role: 'admin', branchId: '' });
    setIsModalOpen(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    reset({
      name: user.name,
      login: user.login,
      phone: user.phone,
      password: user.password,
      role: user.role,
      branchId: user.branchId
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: UserForm) => {
    if (editingUser) {
      updateUser(editingUser.id, {
        name: data.name,
        login: data.login,
        phone: data.phone,
        password: data.password,
        role: data.role as Role,
        branchId: data.branchId
      });
    } else {
      addUser({
        name: data.name,
        login: data.login,
        phone: data.phone,
        password: data.password,
        role: data.role as Role,
        branchId: data.branchId,
        isActive: true
      });
    }
    setIsModalOpen(false);
    setEditingUser(null);
    reset();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Adminlar</h2>
          <p className="text-text-muted">Tizimdagi adminlar va o'qituvchilarni boshqarish</p>
        </div>
        <Button className="gap-2" onClick={handleOpenAddModal}>
          <IconPlus size={18} />Xodim qo'shish</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Xodimlar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ism</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Holati</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nonSuperAdmins.map((user, i) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.login}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{branches.find(b => b.id === user.branchId)?.name || "Biriktirilmagan"}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">Faol</span>
                    ) : (
                      <span className="px-2 py-1 bg-danger/10 text-danger text-xs rounded-full">Bloklangan</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-8 h-8 p-0" 
                        title="Tahrirlash"
                        onClick={() => handleEditUser(user)}
                      >
                        <IconEdit size={16} className="text-accent" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-8 h-8 p-0" 
                        title="Bloklash/Ochish"
                        onClick={() => toggleUserStatus(user.id)}
                      >
                        {user.isActive ? <IconLock size={16} className="text-warning" /> : <IconLockOpen size={16} className="text-success" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-8 h-8 p-0"
                        title="O'chirish"
                        onClick={async () => {
                          if(await confirm("Haqiqatdan ham bu xodimni o'chirmoqchimisiz?")) deleteUser(user.id);
                        }}
                      >
                        <IconTrash size={16} className="text-danger" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Xodimni tahrirlash' : 'Xodim qo\'shish'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Ism" placeholder="Ism" error={errors.name?.message} {...register('name')} />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Login" placeholder="Login" error={errors.login?.message} {...register('login')} />
            <Input label="Parol" type="password" placeholder="***" error={errors.password?.message} {...register('password')} />
          </div>
          
          <Input label="Telefon" placeholder="+998901234567" error={errors.phone?.message} {...register('phone')} />
          
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-text-primary">Xodim Roli</label>
            <select 
              className="flex h-10 w-full rounded-md border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              {...register('role')}
            >
              <option value="admin">Admin</option>
              <option value="teacher">O'qituvchi</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-text-primary">Filialni tanlang</label>
            <select 
              className={`flex h-10 w-full rounded-md border ${errors.branchId ? 'border-danger' : 'border-border'} bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent`}
              {...register('branchId')}
            >
              <option value="">Filialni tanlang</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.branchId && <span className="text-xs text-danger">{errors.branchId.message}</span>}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit">Saqlash</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog />
    </motion.div>
  );
};

export default AdminsPage;
