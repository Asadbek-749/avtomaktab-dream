import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Branch } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { IconPlus, IconEdit, IconTrash, IconCar } from '@tabler/icons-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

export const InstructorsPage = () => {
  const { user: currentUser } = useAuthStore();
  const [instructors, setInstructors] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    login: '',
    password: '',
    phone: '',
    branchId: currentUser?.role === 'admin' ? currentUser.branchId || '' : '',
    carModel: '',
    carNumber: '',
    transmission: 'manual'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const users = await api.getUsers();
      let instructorList = users.filter((u: any) => u.role === 'instructor');
      if (currentUser?.role === 'admin') {
        instructorList = instructorList.filter((u: any) => u.branchId === currentUser.branchId);
      }
      setInstructors(instructorList);

      if (currentUser?.role === 'superadmin') {
        const branchList = await api.getBranches();
        setBranches(branchList);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenModal = (instructor?: User) => {
    if (instructor) {
      setEditingInstructor(instructor);
      setFormData({
        name: instructor.name,
        login: instructor.login,
        password: '',
        phone: instructor.phone,
        branchId: instructor.branchId || '',
        carModel: instructor.carModel || '',
        carNumber: instructor.carNumber || '',
        transmission: instructor.transmission || 'manual'
      });
    } else {
      setEditingInstructor(null);
      setFormData({
        name: '',
        login: '',
        password: '',
        phone: '',
        branchId: currentUser?.role === 'admin' ? currentUser.branchId || '' : '',
        carModel: '',
        carNumber: '',
        transmission: 'manual'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: formData.name,
        login: formData.login,
        phone: formData.phone,
        role: 'instructor',
        branchId: formData.branchId,
        carModel: formData.carModel,
        carNumber: formData.carNumber,
        transmission: formData.transmission
      };
      if (formData.password) payload.password = formData.password;

      if (editingInstructor) {
        await api.updateUser(editingInstructor.id, payload);
      } else {
        await api.addUser(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Xatolik yuz berdi. Login band bo'lishi mumkin.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Rostdan ham o'chirmoqchimisiz?")) {
      await api.deleteUser(id);
      fetchData();
    }
  };

  const getBranchName = (id: string) => branches.find(b => b.id === id)?.name || '-';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">Instruktorlar (Amaliyot)</h1>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <IconPlus size={20} />
          Yangi qo'shish
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {instructors.map(instructor => (
          <div key={instructor.id} className="glass-panel p-5 rounded-2xl relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenModal(instructor)} className="text-accent hover:text-accent-hover p-1 bg-accent/10 rounded-lg">
                <IconEdit size={18} />
              </button>
              <button onClick={() => handleDelete(instructor.id)} className="text-red-500 hover:text-red-600 p-1 bg-red-500/10 rounded-lg">
                <IconTrash size={18} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                <IconCar size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-primary">{instructor.name}</h3>
                <p className="text-sm text-text-secondary">{instructor.phone}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-border/50 pb-1">
                <span className="text-text-secondary">Login:</span>
                <span className="font-medium text-text-primary">{instructor.login}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1">
                <span className="text-text-secondary">Mashina:</span>
                <span className="font-medium text-text-primary">{instructor.carModel} ({instructor.carNumber})</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1">
                <span className="text-text-secondary">Korobka:</span>
                <span className="font-medium text-text-primary">{instructor.transmission === 'auto' ? 'Avtomat' : 'Mexanika'}</span>
              </div>
              {currentUser?.role === 'superadmin' && (
                <div className="flex justify-between pb-1">
                  <span className="text-text-secondary">Filial:</span>
                  <span className="font-medium text-text-primary">{getBranchName(instructor.branchId || '')}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingInstructor ? 'Tahrirlash' : 'Yangi Instruktor'}>
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <Input 
            label="Ism Familiya" 
            required 
            type="text" 
            placeholder="Asadbek Shodiyev"
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Login" 
              required 
              type="text" 
              placeholder="asadbek001"
              value={formData.login} 
              onChange={e => setFormData({...formData, login: e.target.value})} 
            />
            <Input 
              label={`Parol ${editingInstructor ? '(ixtiyoriy)' : ''}`}
              required={!editingInstructor} 
              type="text" 
              placeholder={editingInstructor ? 'O\'zgartirish uchun yozing' : '********'}
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
          </div>
          
          <Input 
            label="Telefon raqam" 
            required 
            type="text" 
            placeholder="+998901234567"
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value})} 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Mashina rusumi" 
              required 
              type="text" 
              placeholder="Cobalt"
              value={formData.carModel} 
              onChange={e => setFormData({...formData, carModel: e.target.value})} 
            />
            <Input 
              label="Davlat raqami" 
              required 
              type="text" 
              placeholder="01 A 777 AA"
              value={formData.carNumber} 
              onChange={e => setFormData({...formData, carNumber: e.target.value})} 
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-text-primary ml-1">Korobka turi</label>
            <select 
              className="w-full bg-white dark:bg-gray-900 border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/50 transition-all shadow-sm"
              value={formData.transmission} 
              onChange={e => setFormData({...formData, transmission: e.target.value})}
            >
              <option value="manual">Mexanika</option>
              <option value="auto">Avtomat</option>
            </select>
          </div>

          {currentUser?.role === 'superadmin' && (
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-text-primary ml-1">Filial</label>
              <select 
                required 
                className="w-full bg-white dark:bg-gray-900 border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/50 transition-all shadow-sm"
                value={formData.branchId} 
                onChange={e => setFormData({...formData, branchId: e.target.value})}
              >
                <option value="">Filialni tanlang</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit">Saqlash</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
