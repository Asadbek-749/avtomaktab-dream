import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { User, Student, InstructorPayment, PracticeGroup } from '../../../types';
import { useAuthStore } from '../../../store/authStore';
import { useInstructorPaymentStore } from '../../../store/instructorPaymentStore';
import { IconArrowLeft, IconWallet, IconUsers, IconCashBanknote, IconCar, IconEdit, IconChevronDown, IconChevronRight, IconUserPlus } from '@tabler/icons-react';
import { Button } from '../../../components/ui/Button';
import { AdvancePaymentModal } from '../../../components/modals/AdvancePaymentModal';
import { formatCurrency } from '../../../utils/formatCurrency';
import { useConfirm } from '../../../hooks/useConfirm';
import { exportToExcel } from '../../../utils/exportExcel';
import { IconDownload } from '@tabler/icons-react';

// Har bir o'quvchi uchun to'lanadigan qat'iy narx
const INSTRUCTOR_PRICE_PER_STUDENT = 200000;

export const InstructorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  
  const [instructor, setInstructor] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [practiceGroups, setPracticeGroups] = useState<PracticeGroup[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'finance' | 'archive'>('students');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const { payments, fetchPayments, addPayment, deletePayment, loading } = useInstructorPaymentStore();
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [ConfirmDialog, confirm] = useConfirm();

  useEffect(() => {
    if (id) {
      loadInstructorData();
      fetchPayments(id);
    }
  }, [id]);

  const loadInstructorData = async () => {
    try {
      const users = await api.getUsers();
      const inst = users.find(u => u.id === id);
      if (inst) setInstructor(inst);

      const all = await api.getStudents();
      setAllStudents(all);
      const instStudents = all.filter(s => s.instructorId === id && s.practiceGroupId != null);
      setStudents(instStudents);
      
      if (id) {
        const groups = await api.getPracticeGroups(id);
        setPracticeGroups(groups);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdvanceSubmit = async (data: { amount: number; note: string; date: string }) => {
    if (!instructor) return;
    try {
      await addPayment({
        instructorId: instructor.id,
        amount: data.amount,
        type: 'avans',
        date: data.date,
        note: data.note,
        branchId: instructor.branchId || currentUser?.branchId || '',
        addedBy: currentUser?.id || '',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const activeStudents = useMemo(() => students.filter(s => s.practiceStatus !== 'completed'), [students]);
  const archivedStudents = useMemo(() => students.filter(s => s.practiceStatus === 'completed'), [students]);

  const pricePerStudent = instructor ? Number(instructor.studentPrice) || 200000 : 200000;
  const totalEarned = students.length * pricePerStudent;
  const totalAdvances = payments.filter(p => p.type === 'avans').reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalEarned - totalAdvances;

  const markPracticeCompleted = async (studentId: string) => {
    if (await confirm("O'quvchining amaliyot darslari yakunlandimi?")) {
      try {
        await api.updateStudent(studentId, { practiceStatus: 'completed' });
        loadInstructorData();
      } catch (e) {
        console.error(e);
        alert("Xatolik yuz berdi");
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !instructor) return;
    try {
      await api.createPracticeGroup({
        name: newGroupName,
        instructorId: instructor.id,
        branchId: instructor.branchId || currentUser?.branchId || ''
      });
      setNewGroupName('');
      setIsNewGroupModalOpen(false);
      loadInstructorData();
    } catch (e: any) {
      console.error(e);
      alert(`Guruh yaratishda xatolik yuz berdi: ${e.response?.data?.error || e.message}`);
    }
  };

  const updatePrice = async (newPrice: number) => {
    if (!instructor) return;
    try {
      await api.updateUser(instructor.id, { 
        ...instructor,
        studentPrice: newPrice 
      });
      loadInstructorData();
    } catch (e) {
      console.error(e);
      alert("Narxni yangilashda xatolik yuz berdi");
    }
  };

  const handleExportGroups = () => {
    const data = practiceGroups.map(group => {
      const groupStudents = students.filter(s => s.practiceGroupId === group.id);
      return {
        groupName: group.name,
        status: group.status === 'active' ? 'Faol' : 'Tugallangan',
        studentCount: groupStudents.length,
        earned: formatCurrency(groupStudents.length * pricePerStudent)
      };
    });
    exportToExcel({
      data,
      columns: [
        { header: 'Guruh nomi', key: 'groupName' },
        { header: 'Holati', key: 'status' },
        { header: 'O\'quvchilar soni', key: 'studentCount' },
        { header: 'Daromad (Maosh)', key: 'earned' }
      ],
      fileName: `guruhlar_hisoboti_${instructor?.name}`,
      sheetName: 'Guruhlar'
    });
  };

  const handleExportAdvances = () => {
    const data = payments.map(p => ({
      date: new Date(p.date).toLocaleDateString(),
      amount: formatCurrency(Number(p.amount)),
      type: p.type === 'avans' ? 'Avans' : 'Oylik',
      note: p.note || '',
      adder: p.adder?.name || 'Noma\'lum'
    }));
    exportToExcel({
      data,
      columns: [
        { header: 'Sana', key: 'date' },
        { header: 'Summa', key: 'amount' },
        { header: 'Tur', key: 'type' },
        { header: 'Izoh', key: 'note' },
        { header: 'Kiritdi', key: 'adder' }
      ],
      fileName: `avanslar_hisoboti_${instructor?.name}`,
      sheetName: 'Avanslar'
    });
  };

  if (!instructor) return <div className="p-8 text-center text-text-secondary">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-bg-card border border-border rounded-xl text-text-secondary hover:text-text-primary transition-colors">
          <IconArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Instruktor Profili</h1>
          <p className="text-text-secondary">{instructor.name}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <IconUsers size={24} />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Barcha O'quvchilar</p>
            <p className="text-xl font-bold text-text-primary">{students.length} ta</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <IconWallet size={24} />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Umumiy ishlagan puli</p>
            <p className="text-xl font-bold text-green-500">{formatCurrency(totalEarned)}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
            <IconCashBanknote size={24} />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Olingan avanslar</p>
            <p className="text-xl font-bold text-orange-500">{formatCurrency(totalAdvances)}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border-accent/20 border">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <IconWallet size={24} />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Balans (Qoldiq)</p>
            <p className="text-xl font-bold text-accent">{formatCurrency(balance)}</p>
          </div>
        </div>
      </div>

      {/* Profile Details & Tabs Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent mx-auto">
              <IconCar size={40} />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-text-primary">{instructor.name}</h3>
              <p className="text-sm text-text-secondary">{instructor.phone}</p>
            </div>
            
            <hr className="border-border/50" />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Login:</span>
                <span className="font-medium text-text-primary">{instructor.login}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Mashina:</span>
                <span className="font-medium text-text-primary">{instructor.carModel} ({instructor.carNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Korobka:</span>
                <span className="font-medium text-text-primary">{instructor.transmission === 'auto' ? 'Avtomat' : 'Mexanika'}</span>
              </div>
              <div className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-2 transition-all hover:bg-indigo-500/10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-indigo-500/70 uppercase tracking-wider">1 o'quvchi uchun to'lov</span>
                  {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                    <button 
                      onClick={() => {
                        const newPrice = prompt("Yangi narxni kiriting (UZS):", String(pricePerStudent));
                        if (newPrice && !isNaN(Number(newPrice))) updatePrice(Number(newPrice));
                      }}
                      className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                      title="Narxni tahrirlash"
                    >
                      <IconEdit size={14} stroke={2.5} />
                    </button>
                  )}
                </div>
                <div className="text-2xl font-bold text-indigo-500">
                  {formatCurrency(pricePerStudent)}
                </div>
              </div>
            </div>

            <Button onClick={() => setIsAdvanceModalOpen(true)} className="w-full mt-4 shadow-lg shadow-primary/20" variant="primary">
              Avans berish
            </Button>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3 glass-panel rounded-2xl overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex justify-between items-center px-4 pt-4 border-b border-border/50 bg-bg-card/50 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <div className="flex">
              <button
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'students' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                onClick={() => setActiveTab('students')}
              >
                Guruhlar ({practiceGroups.filter(g => g.status === 'active').length})
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'finance' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                onClick={() => setActiveTab('finance')}
              >
                Moliya tarixi
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'archive' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                onClick={() => setActiveTab('archive')}
              >
                Arxiv ({practiceGroups.filter(g => g.status === 'completed').length})
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              {activeTab === 'students' && (
                <>
                  <Button size="sm" variant="outline" onClick={handleExportGroups} className="gap-2">
                    <IconDownload size={16} /> Excel
                  </Button>
                  <Button size="sm" onClick={() => setIsNewGroupModalOpen(true)}>
                    Yangi guruh ochish
                  </Button>
                </>
              )}
              {activeTab === 'finance' && (
                <Button size="sm" variant="outline" onClick={handleExportAdvances} className="gap-2">
                  <IconDownload size={16} /> Excel
                </Button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 flex-1 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {activeTab === 'students' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-3">

                    {practiceGroups.filter(g => g.status === 'active').map(group => {
                      const groupStudents = activeStudents.filter(s => s.practiceGroupId === group.id);
                      return (
                      <tbody key={group.id}>
                        <tr 
                          className="bg-bg-base/30 cursor-pointer hover:bg-bg-base transition-all group"
                          onClick={() => navigate(`/admin/practice-groups/${group.id}`)}
                        >
                            <td className="py-4 px-5 font-bold text-accent border border-border/60 rounded-xl group-hover:border-accent/50 group-hover:shadow-sm">
                              <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-2">
                                  <span>{group.name} ({groupStudents.length} ta o'quvchi)</span>
                                </div>
                                <div className="text-sm font-normal text-text-secondary">
                                  Daromad: {formatCurrency(groupStudents.length * pricePerStudent)}
                                </div>
                              </div>
                            </td>
                          </tr>
                      </tbody>
                    )})}
                    {activeStudents.length === 0 && (
                      <tbody>
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-text-secondary">Faol o'quvchilar yo'q</td>
                        </tr>
                      </tbody>
                    )}
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'finance' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-sm text-text-secondary">
                        <th className="py-3 px-4 font-medium">Sana</th>
                        <th className="py-3 px-4 font-medium">Summa</th>
                        <th className="py-3 px-4 font-medium">Tur</th>
                        <th className="py-3 px-4 font-medium">Izoh</th>
                        <th className="py-3 px-4 font-medium">Kiritdi</th>
                        {currentUser?.role === 'superadmin' && <th className="py-3 px-4 font-medium text-right">Amallar</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {payments.map(payment => (
                        <tr key={payment.id} className="hover:bg-bg-card/50 transition-colors">
                          <td className="py-3 px-4 text-text-primary">{new Date(payment.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-medium text-orange-500">{formatCurrency(Number(payment.amount))}</td>
                          <td className="py-3 px-4 text-text-secondary capitalize">{payment.type}</td>
                          <td className="py-3 px-4 text-text-secondary">{payment.note}</td>
                          <td className="py-3 px-4 text-text-secondary">{payment.adder?.name || 'Noma\'lum'}</td>
                          {currentUser?.role === 'superadmin' && (
                            <td className="py-3 px-4 text-right">
                              <button onClick={() => deletePayment(payment.id)} className="text-red-500 hover:text-red-600">
                                O'chirish
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr>
                          <td colSpan={currentUser?.role === 'superadmin' ? 6 : 5} className="py-8 text-center text-text-secondary">Moliya tarixi yo'q</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'archive' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">

                    {practiceGroups.filter(g => g.status === 'completed').map(group => {
                      const groupStudents = archivedStudents.filter(s => s.practiceGroupId === group.id);
                      return (
                      <tbody key={group.id} className="divide-y divide-border/50">
                        <tr 
                          className="bg-bg-base/50 cursor-pointer hover:bg-bg-base transition-colors"
                          onClick={() => navigate(`/admin/practice-groups/${group.id}`)}
                        >
                          <td className="py-4 px-4 font-bold text-accent">
                            <div className="flex justify-between items-center w-full">
                              <div className="flex items-center gap-2">
                                <span>{group.name} ({groupStudents.length} ta o'quvchi)</span>
                              </div>
                              <div className="text-sm font-normal text-text-secondary">
                                Daromad: {formatCurrency(groupStudents.length * pricePerStudent)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    )})}
                    {archivedStudents.length === 0 && (
                      <tbody>
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-text-secondary">Arxiv bo'sh</td>
                        </tr>
                      </tbody>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AdvancePaymentModal 
        isOpen={isAdvanceModalOpen} 
        onClose={() => setIsAdvanceModalOpen(false)} 
        onSubmit={handleAdvanceSubmit}
        instructorName={instructor.name}
      />

      {isNewGroupModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border/50 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-text-primary mb-4">Yangi amaliyot guruhi</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Guruh nomi</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-bg-base border border-border/50 rounded-xl text-text-primary focus:outline-none focus:border-accent"
                  placeholder="Masalan: Avgust-1"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsNewGroupModalOpen(false)}>
                  Bekor qilish
                </Button>
                <Button onClick={handleCreateGroup}>
                  Yaratish
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
};
