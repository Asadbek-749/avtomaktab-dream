import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { useStudentStore } from '../../store/studentStore';
import { usePaymentStore } from '../../store/paymentStore';
import { useBranchStore } from '../../store/branchStore';
import { useExpenseStore } from '../../store/expenseStore';
import { useUserStore } from '../../store/userStore';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { 
  IconWallet, IconTrendingUp, IconTrendingDown, IconAlertCircle, 
  IconDownload, IconBuildingStore, IconCalendar, IconPlus, IconTrash, IconSearch,
  IconUsers, IconShield, IconBooks, IconChevronDown, IconChevronRight
} from '@tabler/icons-react';
import { exportToExcel } from '../../utils/exportExcel';
import { cn, Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ExpenseForm } from './ExpenseForm';
import { IncomeForm } from './IncomeForm';
import { DataListModal } from './DataListModal';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#f43f5e'];

export const SuperDashboard = () => {
  const { students, fetchStudents } = useStudentStore();
  const { groups, fetchGroups } = useGroupStore();
  const { payments, fetchPayments, deletePayment } = usePaymentStore();
  const { expenses, fetchExpenses, deleteExpense } = useExpenseStore();
  const { branches, fetchBranches, activeBranchId, setActiveBranch } = useBranchStore();
  const { users, fetchUsers } = useUserStore();
  const user = useAuthStore(state => state.user);

  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expense' | 'debt'>('overview');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'last_month' | 'year' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIncomeModalOpen] = useState(false);
  const [activeListModal, setActiveListModal] = useState<'students' | 'groups' | 'employees' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Delete confirm modal
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string, type: 'income'|'expense'}>({isOpen: false, id: '', type: 'income'});

  useEffect(() => {
    fetchStudents();
    fetchGroups();
    fetchPayments();
    fetchExpenses();
    fetchUsers();
    if (user?.role === 'superadmin') {
      fetchBranches();
    }
  }, [fetchStudents, fetchGroups, fetchPayments, fetchExpenses, fetchBranches, fetchUsers, user]);

  const effectiveBranchId = user?.role === 'admin' ? user.branchId : activeBranchId;

  const handleDeleteTransaction = (id: string, type: 'income' | 'expense') => {
    setDeleteConfirm({ isOpen: true, id, type });
  };

  const confirmDelete = async () => {
    const { id, type } = deleteConfirm;
    try {
      if (type === 'income') {
        await deletePayment(id);
      } else {
        await deleteExpense(id);
      }
      setDeleteConfirm({ isOpen: false, id: '', type: 'income' });
    } catch (err) {
      console.error(err);
      alert("Xatolik yuz berdi");
    }
  };

  // Filtrlar
  const filterByDate = (dateStr: string) => {
    if (dateFilter === 'all') return true;
    
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (dateFilter === 'today') {
      return date >= today;
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }
    if (dateFilter === 'month') {
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }
    if (dateFilter === 'last_month') {
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
    }
    if (dateFilter === 'year') {
      return date.getFullYear() === today.getFullYear();
    }
    if (dateFilter === 'custom') {
      if (!customStartDate && !customEndDate) return true;
      if (customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        start.setHours(0,0,0,0);
        const end = new Date(customEndDate);
        end.setHours(23,59,59,999);
        return date >= start && date <= end;
      }
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0,0,0,0);
        return date >= start;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23,59,59,999);
        return date <= end;
      }
    }
    return true;
  };

  const displayStudents = students.filter(s => {
    if (s.status === 'completed') return false;
    if (s.groupId) {
      const g = groups.find(grp => grp.id === s.groupId);
      if (g && g.status === 'completed') return false;
    }
    if (effectiveBranchId && s.branchId !== effectiveBranchId) return false;
    return true;
  });

  const displayGroups = groups.filter(g => {
    if (g.status === 'completed') return false;
    if (effectiveBranchId && g.branchId !== effectiveBranchId) return false;
    return true;
  });

  const displayPayments = payments.filter(p => {
    if (effectiveBranchId && p.branchId !== effectiveBranchId) return false;
    if (!filterByDate(p.date)) return false;
    return true;
  });

  const displayExpenses = expenses.filter(e => {
    if (effectiveBranchId && e.branchId !== effectiveBranchId) return false;
    if (!filterByDate(e.date)) return false;
    return true;
  });

  // Basic Stats
  const displayEmployees = users.filter(u => {
    if (u.role !== 'teacher' && u.role !== 'admin') return false;
    if (effectiveBranchId && u.branchId !== effectiveBranchId) return false;
    return true;
  });
  const teachersCount = displayEmployees.length;
  
  // Financial KPIs
  const totalIncome = displayPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalIncomeCash = displayPayments.filter(p => p.method === 'naqd').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalIncomeCard = displayPayments.filter(p => p.method === 'karta').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalIncomeBank = displayPayments.filter(p => p.method === 'hisob').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalExpenses = displayExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const netProfit = totalIncome - totalExpenses;
  
  const expectedIncome = displayStudents.reduce((acc, curr) => {
    const debt = Math.max(0, (Number(curr.coursePrice) || 0) - (Number(curr.paidAmount) || 0));
    return acc + debt;
  }, 0);

  // Unified Transactions
  const transactions = useMemo(() => {
    const p = displayPayments.map(payment => {
      const student = displayStudents.find(s => s.id === payment.studentId);
      return {
        id: payment.id,
        date: new Date(payment.date),
        type: 'income',
        amount: Number(payment.amount) || 0,
        title: student ? `${student.firstName} ${student.lastName}` : 'Noma\'lum o\'quvchi',
        note: payment.method === 'naqd' ? 'Naqd pul' : payment.method === 'karta' ? 'Plastik karta' : 'Hisob raqam',
        addedBy: users.find(u => u.id === payment.addedBy)?.name || payment.addedBy,
        branchId: payment.branchId
      };
    });

    const e = displayExpenses.map(expense => {
      let catLabel = expense.category;
      switch (expense.category) {
        case 'salary': catLabel = 'Oylik maosh'; break;
        case 'fuel': catLabel = 'Yoqilg\'i'; break;
        case 'rent': catLabel = 'Ijara'; break;
        case 'tax': catLabel = 'Soliq'; break;
      }
      return {
        id: expense.id,
        date: new Date(expense.date),
        type: 'expense',
        amount: Number(expense.amount) || 0,
        title: catLabel,
        note: expense.note,
        addedBy: users.find(u => u.id === expense.addedBy)?.name || expense.addedBy,
        branchId: expense.branchId
      };
    });

    let merged = [...p, ...e].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      merged = merged.filter(t => t.title.toLowerCase().includes(q) || t.note.toLowerCase().includes(q));
    }
    
    return merged;
  }, [displayPayments, displayExpenses, displayStudents, users, searchQuery]);

  const debtors = displayStudents.filter(s => (Number(s.coursePrice) || 0) > (Number(s.paidAmount) || 0));

  const groupedDebtors = useMemo(() => {
    const groupsMap = new Map<string, any>();
    
    debtors.forEach(student => {
      const gId = student.groupId || 'no-group';
      if (!groupsMap.has(gId)) {
        groupsMap.set(gId, {
          id: gId,
          name: displayGroups.find(g => g.id === gId)?.name || 'Guruhsiz',
          students: [],
          totalDebt: 0,
          totalPaid: 0,
          totalPrice: 0
        });
      }
      const groupData = groupsMap.get(gId);
      const debt = Math.max(0, (Number(student.coursePrice) || 0) - (Number(student.paidAmount) || 0));
      
      groupData.students.push({ ...student, debt });
      groupData.totalDebt += debt;
      groupData.totalPaid += Number(student.paidAmount) || 0;
      groupData.totalPrice += Number(student.coursePrice) || 0;
    });

    return Array.from(groupsMap.values()).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [debtors, displayGroups]);

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]);
  };

  // Monthly Chart
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; income: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { month: key, income: 0, expense: 0 };
    }
    
    displayPayments.forEach(p => {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key]) months[key].income += (Number(p.amount) || 0);
    });
    displayExpenses.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key]) months[key].expense += (Number(e.amount) || 0);
    });
    return Object.values(months).map(m => ({
      ...m,
      month: new Date(m.month + '-01').toLocaleString('uz-UZ', { month: 'short', year: 'numeric' })
    }));
  }, [displayPayments, displayExpenses]);

  // Pie Chart
  const expensesBreakdown = useMemo(() => {
    const categories: Record<string, number> = {};
    displayExpenses.forEach(e => {
      let catLabel = e.category;
      switch (e.category) {
        case 'salary': catLabel = 'Oylik maosh'; break;
        case 'fuel': catLabel = 'Yoqilg\'i'; break;
        case 'rent': catLabel = 'Ijara'; break;
        case 'tax': catLabel = 'Soliq'; break;
      }
      categories[catLabel] = (categories[catLabel] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [displayExpenses]);


  const handleExport = () => {
    let dataToExport: typeof transactions = [];
    
    if (activeTab === 'overview') {
      dataToExport = transactions;
    } else if (activeTab === 'income') {
      dataToExport = transactions.filter(t => t.type === 'income');
    } else if (activeTab === 'expense') {
      dataToExport = transactions.filter(t => t.type === 'expense');
    } else if (activeTab === 'debt') {
      exportToExcel({
        data: debtors.map(s => ({
          'O\'quvchi': `${s.firstName} ${s.lastName}`,
          'Telefon': s.phone,
          'Jami summa': s.coursePrice,
          'To\'langan': s.paidAmount,
          'Qarz': s.coursePrice - s.paidAmount
        })),
        columns: [
          { header: 'O\'quvchi', key: 'O\'quvchi' },
          { header: 'Telefon', key: 'Telefon' },
          { header: 'Jami summa', key: 'Jami summa' },
          { header: 'To\'langan', key: 'To\'langan' },
          { header: 'Qarz', key: 'Qarz' }
        ],
        fileName: 'Qarzdorlar'
      });
      return;
    }

    exportToExcel({
      data: dataToExport.map(t => ({
        'Sana': t.date.toLocaleDateString('uz-UZ'),
        'Turi': t.type === 'income' ? 'Kirim' : 'Chiqim',
        'Maqsad': t.title,
        'Izoh': t.note,
        'Summa': t.amount,
        'Kiritdi': t.addedBy
      })),
      columns: [
        { header: 'Sana', key: 'Sana' },
        { header: 'Turi', key: 'Turi' },
        { header: 'Maqsad', key: 'Maqsad' },
        { header: 'Izoh', key: 'Izoh' },
        { header: 'Summa', key: 'Summa' },
        { header: 'Kiritdi', key: 'Kiritdi' }
      ],
      fileName: 'Moliyaviy_Hisobot'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Umumiy hisobot</h1>
          <p className="text-text-muted font-medium mt-1">Tizimning umumiy va moliyaviy holati nazorati</p>
        </div>
        
        <div className="flex flex-wrap xl:flex-nowrap items-center gap-3">
          <div className="flex items-center gap-3">
            {user?.role === 'superadmin' && (
              <div className="flex items-center gap-2 bg-bg-card border border-border/60 hover:border-border shadow-sm px-4 py-2 rounded-full transition-colors h-11">
                <IconBuildingStore size={18} className="text-text-secondary" />
                <select
                  value={activeBranchId || ''}
                  onChange={(e) => setActiveBranch(e.target.value || null)}
                  className="bg-transparent text-sm font-semibold outline-none text-text-primary cursor-pointer pr-2"
                >
                  <option value="" className="bg-bg-card text-text-primary">Barcha filiallar</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id} className="bg-bg-card text-text-primary">{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 bg-bg-card border border-border/60 hover:border-border shadow-sm px-4 py-2 rounded-full transition-colors h-11">
              <IconCalendar size={18} className="text-text-secondary" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent text-sm font-semibold outline-none text-text-primary cursor-pointer pr-2"
              >
                <option value="all" className="bg-bg-card text-text-primary">Barcha vaqt</option>
                <option value="today" className="bg-bg-card text-text-primary">Bugun</option>
                <option value="week" className="bg-bg-card text-text-primary">Bu hafta</option>
                <option value="month" className="bg-bg-card text-text-primary">Bu oy</option>
                <option value="last_month" className="bg-bg-card text-text-primary">O'tgan oy</option>
                <option value="year" className="bg-bg-card text-text-primary">Bu yil</option>
                <option value="custom" className="bg-bg-card text-text-primary">Boshqa sana...</option>
              </select>
            </div>
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 animate-fade-in bg-bg-card border border-border/60 shadow-sm px-4 py-1.5 rounded-full h-11">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={e => setCustomStartDate(e.target.value)} 
                className="bg-transparent text-sm font-semibold outline-none text-text-primary cursor-pointer" 
              />
              <span className="text-text-muted text-sm font-medium">-</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={e => setCustomEndDate(e.target.value)} 
                className="bg-transparent text-sm font-semibold outline-none text-text-primary cursor-pointer" 
              />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Button onClick={() => setIncomeModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5 h-11 font-bold shadow-md shadow-emerald-500/20 !bg-none">
              <IconPlus size={18} stroke={2.5} /> Tushum
            </Button>
            
            <Button variant="danger" onClick={() => setExpenseModalOpen(true)} className="gap-2 rounded-full px-5 h-11 font-bold shadow-md">
              <IconPlus size={18} stroke={2.5} /> Xarajat
            </Button>

            <Button
              onClick={handleExport}
              variant="outline"
              className="gap-2 px-5 h-11 bg-bg-card border border-border hover:bg-bg-hover rounded-full transition-colors font-bold text-sm text-text-primary shadow-sm"
            >
              <IconDownload size={18} stroke={2.5} /> Eksport
            </Button>
          </div>
        </div>
      </div>

      {/* COMPACT BASIC STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
        <div 
          onClick={() => setActiveListModal('students')}
          className="flex items-center gap-4 bg-bg-card border border-border/40 shadow-sm hover:shadow-md px-5 py-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5 w-full"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex flex-shrink-0 items-center justify-center text-indigo-600 dark:text-indigo-400">
            <IconUsers size={24} stroke={2} />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider truncate">Jami o'quvchilar</p>
            <p className="text-xl font-black text-text-primary leading-tight mt-1">{displayStudents.length} ta</p>
          </div>
        </div>
        <div 
          onClick={() => setActiveListModal('groups')}
          className="flex items-center gap-4 bg-bg-card border border-border/40 shadow-sm hover:shadow-md px-5 py-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5 w-full"
        >
          <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-sky-500/10 flex flex-shrink-0 items-center justify-center text-sky-600 dark:text-sky-400">
            <IconBooks size={24} stroke={2} />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider truncate">Umumiy guruhlar</p>
            <p className="text-xl font-black text-text-primary leading-tight mt-1">{displayGroups.length} ta</p>
          </div>
        </div>
        <div 
          onClick={() => setActiveListModal('employees')}
          className="flex items-center gap-4 bg-bg-card border border-border/40 shadow-sm hover:shadow-md px-5 py-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5 w-full"
        >
          <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-500/10 flex flex-shrink-0 items-center justify-center text-violet-600 dark:text-violet-400">
            <IconShield size={24} stroke={2} />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider truncate">Xodimlar / O'qituvchi</p>
            <p className="text-xl font-black text-text-primary leading-tight mt-1">{teachersCount} ta</p>
          </div>
        </div>
      </div>

      {/* KPI CARDS (Minimalistic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-bg-card border border-border/40 shadow-sm hover:shadow-md transition-all rounded-3xl relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-10 transition-transform duration-500 group-hover:scale-110">
              <IconTrendingUp size={140} className="text-emerald-500 -mr-10 -mt-10" />
            </div>
            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10 min-h-[160px]">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Jami tushum</h3>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-text-primary tracking-tight">
                  {totalIncome.toLocaleString()} <span className="text-sm font-semibold text-text-muted">UZS</span>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Naqd: {totalIncomeCash.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Karta: {totalIncomeCard.toLocaleString()}
                  </div>
                  {totalIncomeBank > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      Bank: {totalIncomeBank.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-bg-card border border-border/40 shadow-sm hover:shadow-md transition-all rounded-3xl relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-10 transition-transform duration-500 group-hover:scale-110">
              <IconTrendingDown size={140} className="text-rose-500 -mr-10 -mt-10" />
            </div>
            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10 min-h-[160px]">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Jami xarajat</h3>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-text-primary tracking-tight">
                  {totalExpenses.toLocaleString()} <span className="text-sm font-semibold text-text-muted">UZS</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-bg-card border border-border/40 shadow-sm hover:shadow-md transition-all rounded-3xl relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-10 transition-transform duration-500 group-hover:scale-110">
              <IconWallet size={140} className="text-indigo-500 -mr-10 -mt-10" />
            </div>
            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10 min-h-[160px]">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Sof foyda</h3>
              </div>
              <div className="mt-4">
                <p className={cn("text-3xl font-black tracking-tight", netProfit >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400")}>
                  {netProfit.toLocaleString()} <span className="text-sm font-semibold text-text-muted">UZS</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-bg-card border border-border/40 shadow-sm hover:shadow-md transition-all rounded-3xl relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-10 transition-transform duration-500 group-hover:scale-110">
              <IconAlertCircle size={140} className="text-amber-500 -mr-10 -mt-10" />
            </div>
            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10 min-h-[160px]">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Qarzdorlik</h3>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-amber-600 dark:text-amber-500 tracking-tight">
                  {expectedIncome.toLocaleString()} <span className="text-sm font-semibold text-text-muted">UZS</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-border gap-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn("pb-3 text-sm font-semibold transition-colors relative", activeTab === 'overview' ? "text-accent" : "text-text-secondary hover:text-text-primary")}
        >
          Umumiy
          {activeTab === 'overview' && <motion.div layoutId="moliyaTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={cn("pb-3 text-sm font-semibold transition-colors relative", activeTab === 'income' ? "text-accent" : "text-text-secondary hover:text-text-primary")}
        >
          Tushumlar
          {activeTab === 'income' && <motion.div layoutId="moliyaTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={cn("pb-3 text-sm font-semibold transition-colors relative", activeTab === 'expense' ? "text-accent" : "text-text-secondary hover:text-text-primary")}
        >
          Xarajatlar
          {activeTab === 'expense' && <motion.div layoutId="moliyaTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('debt')}
          className={cn("pb-3 text-sm font-semibold transition-colors relative", activeTab === 'debt' ? "text-accent" : "text-text-secondary hover:text-text-primary")}
        >
          Qarzdorlik
          {activeTab === 'debt' && <motion.div layoutId="moliyaTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />}
        </button>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border-border bg-bg-card">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-text-primary mb-6">Daromad va Xarajat Dinamikasi</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val} width={55} />
                      <RechartsTooltip 
                        cursor={{ fill: 'var(--bg-hover)', opacity: 0.5 }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${value.toLocaleString()} UZS`, '']}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} verticalAlign="bottom" />
                      <Bar dataKey="income" name="Tushum" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="expense" name="Xarajat" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-bg-card">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-text-primary mb-6">Xarajatlar taqsimoti</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expensesBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
                        formatter={(value: number) => [`${value.toLocaleString()} UZS`, 'Xarajat']}
                      />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-sm border-border bg-bg-card overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Moliyaviy operatsiyalar</h3>
                  <p className="text-sm text-text-muted mt-1">So'nggi barcha tranzaksiyalar tarixi</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Turi</TableHead>
                      <TableHead>Maqsad</TableHead>
                      <TableHead>To'lov usuli / Izoh</TableHead>
                      <TableHead>Filial / Xodim</TableHead>
                      <TableHead className="text-right">Summa</TableHead>
                      <TableHead className="text-center w-16">Amal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-text-muted">Ma'lumot topilmadi</TableCell>
                      </TableRow>
                    ) : (
                      transactions.slice((currentPage - 1) * 10, currentPage * 10).map((t) => (
                        <TableRow key={t.id} className="hover:bg-bg-hover/50">
                          <TableCell className="text-sm whitespace-nowrap">
                            {t.date.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell>
                            <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", t.type === 'income' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>
                              {t.type === 'income' ? 'Tushum' : 'Xarajat'}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-text-primary">{t.title}</TableCell>
                          <TableCell className="text-text-muted text-sm">{t.note || '-'}</TableCell>
                          <TableCell className="text-text-secondary text-sm">
                            {branches.find(b => b.id === t.branchId)?.name || 'Noma\'lum filial'} <br/>
                            <span className="text-xs opacity-70">{t.addedBy}</span>
                          </TableCell>
                          <TableCell className={cn("text-right font-bold whitespace-nowrap", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                            {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} UZS
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteTransaction(t.id, t.type as 'income' | 'expense')} 
                              className="text-rose-600 hover:bg-rose-600 hover:text-white border-rose-500/20 px-2 h-8"
                            >
                              <IconTrash size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {transactions.length > 0 && (
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <span className="text-sm text-text-muted">Jami: {transactions.length} ta operatsiya</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1}
                    >
                      Oldingi
                    </Button>
                    <span className="text-sm font-medium py-1.5 px-3 bg-bg-hover rounded-lg">
                      {currentPage} / {Math.ceil(transactions.length / 10)}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(transactions.length / 10), p + 1))} 
                      disabled={currentPage === Math.ceil(transactions.length / 10)}
                    >
                      Keyingi
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {(activeTab === 'income' || activeTab === 'expense') && (
        <Card className="shadow-sm border-border bg-bg-card overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 border-b border-border flex items-center gap-4 bg-bg-base/30">
              <div className="relative flex-1 max-w-sm">
                <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text"
                  placeholder="Qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Maqsad</TableHead>
                    <TableHead>Izoh</TableHead>
                    <TableHead>Kiritdi</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    <TableHead className="text-center w-16">Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.filter(t => t.type === activeTab).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-text-muted">Ma'lumot topilmadi</TableCell>
                    </TableRow>
                  ) : (
                    transactions.filter(t => t.type === activeTab).map((t) => (
                      <TableRow key={t.id} className="hover:bg-bg-hover/50">
                        <TableCell className="text-sm whitespace-nowrap">
                          {t.date.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="font-medium text-text-primary">{t.title}</TableCell>
                        <TableCell className="text-text-muted text-sm">{t.note || '-'}</TableCell>
                        <TableCell className="text-text-secondary text-sm">{t.addedBy}</TableCell>
                        <TableCell className={cn("text-right font-bold whitespace-nowrap", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                          {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} UZS
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteTransaction(t.id, t.type as 'income' | 'expense')} 
                            className="text-rose-600 hover:bg-rose-600 hover:text-white border-rose-500/20 px-2 h-8"
                          >
                            <IconTrash size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'debt' && (
        <Card className="shadow-sm border-border bg-bg-card overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>O'quvchi / Guruh</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Umumiy summa</TableHead>
                    <TableHead>O'zlashtirish</TableHead>
                    <TableHead>Qarz</TableHead>
                    <TableHead className="text-right">Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedDebtors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-text-muted">Qarzdorlar yo'q</TableCell>
                    </TableRow>
                  ) : (
                    groupedDebtors.map((group) => {
                      const isExpanded = expandedGroups.includes(group.id);
                      const groupProgress = group.totalPrice > 0 ? (group.totalPaid / group.totalPrice) * 100 : 0;
                      return (
                        <React.Fragment key={group.id}>
                          <TableRow 
                            className="hover:bg-bg-hover/50 cursor-pointer bg-bg-base/30"
                            onClick={() => toggleGroup(group.id)}
                          >
                            <TableCell className="font-bold text-text-primary flex items-center gap-2">
                              {isExpanded ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
                              {group.name} <span className="text-xs font-normal text-text-muted bg-bg-card px-2 py-0.5 rounded-full">{group.students.length} kishi</span>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="font-semibold">{group.totalPrice.toLocaleString()} UZS</TableCell>
                            <TableCell>
                              <div className="w-32 h-2 bg-bg-card rounded-full overflow-hidden border border-border">
                                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, groupProgress)}%` }}></div>
                              </div>
                            </TableCell>
                            <TableCell className="text-rose-600 font-bold">{group.totalDebt.toLocaleString()} UZS</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                          
                          {isExpanded && group.students.map((s: any) => {
                            const studentProgress = s.coursePrice > 0 ? (s.paidAmount / s.coursePrice) * 100 : 0;
                            return (
                              <TableRow key={s.id} className="hover:bg-bg-hover/50 bg-bg-card">
                                <TableCell className="font-medium text-text-primary pl-8">{s.firstName} {s.lastName}</TableCell>
                                <TableCell className="text-text-secondary">{s.phone}</TableCell>
                                <TableCell>{Number(s.coursePrice).toLocaleString()} UZS</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-1.5 bg-bg-base rounded-full overflow-hidden border border-border">
                                      <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, studentProgress)}%` }}></div>
                                    </div>
                                    <span className="text-xs text-text-muted">{Math.round(studentProgress)}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-rose-500 font-semibold">{s.debt.toLocaleString()} UZS</TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" variant="outline" onClick={() => setIncomeModalOpen(true)} className="border-accent text-accent hover:bg-accent hover:text-white h-8 text-xs">
                                    To'lov
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {isExpenseModalOpen && <ExpenseForm onClose={() => setExpenseModalOpen(false)} />}
      {isIncomeModalOpen && <IncomeForm onClose={() => setIncomeModalOpen(false)} />}
      <DataListModal 
        isOpen={!!activeListModal} 
        onClose={() => setActiveListModal(null)} 
        type={activeListModal}
        students={displayStudents}
        groups={displayGroups}
        employees={displayEmployees}
        branches={branches}
      />
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        message="Haqiqatan ham bu tranzaksiyani o'chirmoqchimisiz? Ushbu amallni bekor qilib bo'lmaydi."
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', type: 'income' })}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default SuperDashboard;
