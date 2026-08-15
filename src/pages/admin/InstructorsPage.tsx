import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { User, Branch } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { IconPlus, IconEdit, IconTrash, IconCar, IconChevronDown } from '@tabler/icons-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { exportToExcel } from '../../utils/exportExcel';
import { IconDownload, IconWallet, IconCashBanknote } from '@tabler/icons-react';
import { useConfirm } from '../../hooks/useConfirm';
import { useInstructorPaymentStore } from '../../store/instructorPaymentStore';
import { formatCurrency } from '../../utils/formatCurrency';

export const InstructorsPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [instructors, setInstructors] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<User | null>(null);
  const [ConfirmDialog, confirm] = useConfirm();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  
  const { summary, fetchSummary } = useInstructorPaymentStore();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    login: '',
    password: '',
    phone: '',
    branchId: currentUser?.role === 'admin' ? currentUser.branchId || '' : '',
    carModel: '',
    carNumber: '',
    transmission: 'manual',
    studentPrice: 200000
  });

  useEffect(() => {
    fetchData();
    fetchSummary();
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
        transmission: instructor.transmission || 'manual',
        studentPrice: instructor.studentPrice || 200000
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
        transmission: 'manual',
        studentPrice: 200000
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
        transmission: formData.transmission,
        studentPrice: formData.studentPrice
      };
      if (formData.password) payload.password = formData.password;

      if (editingInstructor) {
        await api.updateUser(editingInstructor.id, payload);
      } else {
        await api.addUser(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Xatolik yuz berdi. Login band bo'lishi mumkin.";
      alert(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm("Rostdan ham o'chirmoqchimisiz?")) {
      await api.deleteUser(id);
      fetchData();
    }
  };

  const getBranchName = (id: string) => branches.find(b => b.id === id)?.name || '-';

  const handleExport = () => {
    exportToExcel({
      data: instructors.map(instructor => ({
        ...instructor,
        branchName: getBranchName(instructor.branchId || ''),
        transmissionFormatted: instructor.transmission === 'auto' ? 'Avtomat' : 'Mexanika'
      })),
      columns: [
        { header: 'Ism F.O', key: 'name' },
        { header: 'Telefon', key: 'phone' },
        { header: 'Login', key: 'login' },
        { header: 'Mashina Modeli', key: 'carModel' },
        { header: 'Mashina Raqami', key: 'carNumber' },
        { header: 'Uzatmalar qutisi', key: 'transmissionFormatted' },
        { header: 'Filial', key: 'branchName' }
      ],
      fileName: 'instruktorlar_royxati',
      sheetName: 'Instruktorlar'
    });
  };

  const handleExportFinance = () => {
    exportToExcel({
      data: summary.map(s => ({
        ...s,
        branchName: getBranchName(s.branchId || ''),
        priceFormatted: formatCurrency(s.pricePerStudent),
        earnedFormatted: formatCurrency(s.totalEarned),
        advancesFormatted: formatCurrency(s.totalAdvances),
        balanceFormatted: formatCurrency(s.balance)
      })),
      columns: [
        { header: 'Ism F.O', key: 'name' },
        { header: 'O\'quvchilar', key: 'studentCount' },
        { header: 'Narx (har biri)', key: 'priceFormatted' },
        { header: 'Jami ishlagan', key: 'earnedFormatted' },
        { header: 'Olingan avanslar', key: 'advancesFormatted' },
        { header: 'Qoldiq (Balans)', key: 'balanceFormatted' },
        { header: 'Filial', key: 'branchName' }
      ],
      fileName: 'instruktorlar_moliyasi',
      sheetName: 'Moliya'
    });
  };

  const filteredInstructors = instructors.filter(i => {
    if (currentUser?.role === 'superadmin' && selectedBranchId !== 'all') {
      return i.branchId === selectedBranchId;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Instruktorlar (Amaliyot)</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {currentUser?.role === 'superadmin' && (
            <div className="relative">
              <select
                className="appearance-none bg-white dark:bg-bg-card border border-border/50 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-bg-base shadow-sm h-[42px] min-w-[200px]"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                <option value="all">Barcha filiallar</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <IconChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExportFinance}>
              <IconDownload size={18} /> Moliya hisoboti
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <IconDownload size={18} /> Excel
            </Button>
            <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
              <IconPlus size={20} />
              Yangi qo'shish
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredInstructors.map(instructor => (
          <div 
            key={instructor.id} 
            onClick={() => navigate(`/${currentUser?.role}/instructors/${instructor.id}`)}
            className="group glass-panel luxury-shadow relative rounded-[20px] p-5 cursor-pointer hover:-translate-y-1.5 hover:shadow-xl hover:shadow-accent/20 transition-all duration-500 overflow-hidden"
          >
            {/* Premium Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-accent/30 via-transparent to-blue-500/30 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-accent to-blue-600 text-white flex items-center justify-center shadow-md shadow-accent/30 group-hover:scale-105 transition-transform duration-500">
                      <IconCar size={24} stroke={1.5} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent group-hover:to-blue-500 transition-all duration-300 leading-tight">{instructor.name}</h3>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{instructor.phone}</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-bg-card/80 backdrop-blur-md rounded-lg p-1 border border-border/50">
                  <button onClick={(e) => { e.stopPropagation(); handleOpenModal(instructor); }} className="text-accent hover:text-white hover:bg-accent p-1.5 rounded-md transition-colors" title="Tahrirlash">
                    <IconEdit size={16} stroke={2} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(instructor.id); }} className="text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded-md transition-colors" title="O'chirish">
                    <IconTrash size={16} stroke={2} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 mb-3 bg-white/5 dark:bg-black/20 p-3 rounded-xl border border-border/40 backdrop-blur-sm">
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-muted">Login:</span>
                  <span className="font-medium text-text-primary">{instructor.login}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-muted">Mashina:</span>
                  <span className="font-medium text-text-primary">{instructor.carModel} <span className="text-text-secondary text-xs">({instructor.carNumber})</span></span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-muted">Korobka:</span>
                  <span className="font-medium text-text-primary">{instructor.transmission === 'auto' ? 'Avtomat' : 'Mexanika'}</span>
                </div>
                {currentUser?.role === 'superadmin' && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-text-muted">Filial:</span>
                    <span className="font-medium text-text-primary">{getBranchName(instructor.branchId || '')}</span>
                  </div>
                )}
              </div>
              
              {(() => {
                const fin = summary.find(s => s.instructorId === instructor.id);
                if (!fin) return null;
                return (
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2.5 flex flex-col justify-center transition-colors duration-300">
                      <span className="text-[11px] font-medium text-green-500/80 flex items-center gap-1 mb-1">
                        <IconWallet size={14} /> Ishlagan
                      </span>
                      <strong className="text-[13px] font-bold text-green-500 leading-none">{formatCurrency(fin.totalEarned)}</strong>
                    </div>
                    <div className="bg-accent/10 border border-accent/20 rounded-xl p-2.5 flex flex-col justify-center transition-colors duration-300">
                      <span className="text-[11px] font-medium text-accent/80 flex items-center gap-1 mb-1">
                        <IconCashBanknote size={14} /> Qoldiq
                      </span>
                      <strong className="text-[13px] font-bold text-accent leading-none">{formatCurrency(fin.balance)}</strong>
                    </div>
                  </div>
                );
              })()}
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

          <div className="flex flex-col gap-1.5 w-full mt-4">
            <label className="text-sm font-medium text-text-primary ml-1">O'quvchi uchun to'lov summasi (UZS)</label>
            <input 
              type="number"
              required 
              className="w-full bg-white dark:bg-gray-900 border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/50 transition-all shadow-sm"
              placeholder="Masalan: 200000"
              value={formData.studentPrice} 
              onChange={e => setFormData({...formData, studentPrice: Number(e.target.value)})}
            />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit">Saqlash</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog />
    </div>
  );
};
