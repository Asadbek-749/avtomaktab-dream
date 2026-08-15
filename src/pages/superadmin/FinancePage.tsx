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
import { useAuthStore } from '../../store/authStore';
import { 
  IconWallet, IconTrendingUp, IconTrendingDown, IconAlertCircle, 
  IconDownload, IconBuildingStore, IconCalendar, IconPlus, IconTrash, IconSearch
} from '@tabler/icons-react';
import { exportToExcel } from '../../utils/exportExcel';
import { cn, Button } from '../../components/ui/Button';
import { ExpenseForm } from './ExpenseForm';
import { IncomeForm } from './IncomeForm';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#f43f5e'];

export const FinancePage = () => {
  const { students, fetchStudents } = useStudentStore();
  const { payments, fetchPayments } = usePaymentStore();
  const { expenses, fetchExpenses, deleteExpense } = useExpenseStore();
  const { branches, fetchBranches, activeBranchId, setActiveBranch } = useBranchStore();
  const { users, fetchUsers } = useUserStore();
  const user = useAuthStore(state => state.user);

  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expense' | 'debt'>('overview');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'last_month' | 'year'>('month');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIncomeModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, dateFilter, searchQuery]);

  useEffect(() => {
    fetchStudents();
    fetchPayments();
    fetchExpenses();
    fetchUsers();
    if (user?.role === 'superadmin') {
      fetchBranches();
    }
  }, [fetchStudents, fetchPayments, fetchExpenses, fetchBranches, fetchUsers, user]);

  const effectiveBranchId = user?.role === 'admin' ? user.branchId : activeBranchId;

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
    return true;
  };

  const displayStudents = students.filter(s => {
    if (effectiveBranchId && s.branchId !== effectiveBranchId) return false;
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

  // KPIs
  const totalIncome = displayPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
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

  // Monthly Chart
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; income: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { month: key, income: 0, expense: 0 };
    }
    
    // faqat hamma vaqt uchun ko'rsatamiz chartni chiroyli turishi uchun, yoki filterga moslashtiramiz. 
    // Filterga moslashtirsak, masalan 'today' da bitta ustun bo'ladi.
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

  const debtors = displayStudents.filter(s => (s.coursePrice - s.paidAmount) > 0 && s.status !== 'completed');

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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Moliya</h1>
          <p className="text-sm text-text-muted mt-1">Umumiy tushum, xarajatlar, sof foyda va qarzdorlik hisoboti</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {user?.role === 'superadmin' && (
            <div className="flex items-center gap-2 bg-bg-card border border-border px-3 py-2 rounded-xl">
              <IconBuildingStore size={20} className="text-text-secondary" />
              <select
                value={activeBranchId || ''}
                onChange={(e) => setActiveBranch(e.target.value || null)}
                className="bg-transparent text-sm font-medium outline-none text-text-primary cursor-pointer min-w-[140px]"
              >
                <option value="" className="bg-bg-card text-text-primary">Barcha filiallar</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id} className="bg-bg-card text-text-primary">{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 bg-bg-card border border-border px-3 py-2 rounded-xl">
            <IconCalendar size={20} className="text-text-secondary" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-transparent text-sm font-medium outline-none text-text-primary cursor-pointer min-w-[120px]"
            >
              <option value="all" className="bg-bg-card text-text-primary">Barcha vaqt</option>
              <option value="today" className="bg-bg-card text-text-primary">Bugun</option>
              <option value="week" className="bg-bg-card text-text-primary">Bu hafta</option>
              <option value="month" className="bg-bg-card text-text-primary">Bu oy</option>
              <option value="last_month" className="bg-bg-card text-text-primary">O'tgan oy</option>
              <option value="year" className="bg-bg-card text-text-primary">Bu yil</option>
            </select>
          </div>
          
          <Button onClick={() => setIncomeModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent !bg-none">
            <IconPlus size={18} /> Tushum
          </Button>
          
          <Button variant="danger" onClick={() => setExpenseModalOpen(true)} className="gap-2 border-transparent">
            <IconPlus size={18} /> Xarajat
          </Button>

          <Button
            onClick={handleExport}
            variant="outline"
            className="gap-2 px-4 py-2 bg-bg-card border border-border hover:bg-bg-hover rounded-xl transition-colors font-medium text-sm text-text-secondary"
          >
            <IconDownload size={18} /> Eksport
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Jami tushum</h3>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <IconTrendingUp size={22} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {totalIncome.toLocaleString()} <span className="text-sm font-medium opacity-80">UZS</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-rose-600 dark:text-rose-400">Jami xarajat</h3>
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <IconTrendingDown size={22} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-400">
                {totalExpenses.toLocaleString()} <span className="text-sm font-medium opacity-80">UZS</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Sof foyda</h3>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <IconWallet size={22} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">
                {netProfit.toLocaleString()} <span className="text-sm font-medium opacity-80">UZS</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-amber-600 dark:text-amber-400">Qarzdorlik</h3>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <IconAlertCircle size={22} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">
                {expectedIncome.toLocaleString()} <span className="text-sm font-medium opacity-80">UZS</span>
              </p>
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
              <div className="overflow-auto max-h-[500px] custom-scrollbar">
                <Table>
                  <TableHeader className="sticky top-0 z-10 shadow-sm">
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Turi</TableHead>
                      <TableHead>Maqsad</TableHead>
                      <TableHead>To'lov usuli / Izoh</TableHead>
                      <TableHead>Filial / Xodim</TableHead>
                      <TableHead className="text-right">Summa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-text-muted">Ma'lumot topilmadi</TableCell>
                      </TableRow>
                    ) : (
                      transactions.slice(0, 30).map((t) => (
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
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
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
            <div className="overflow-auto max-h-[500px] custom-scrollbar">
              <Table>
                <TableHeader className="sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Maqsad</TableHead>
                    <TableHead>Izoh</TableHead>
                    <TableHead>Kiritdi</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    {activeTab === 'expense' && <TableHead className="text-right">Amallar</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const filtered = transactions.filter(t => t.type === activeTab);
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);
                    
                    if (filtered.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={activeTab === 'expense' ? 6 : 5} className="text-center py-8 text-text-muted">Ma'lumot topilmadi</TableCell>
                        </TableRow>
                      );
                    }
                    return paginated.map((t) => (
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
                        {activeTab === 'expense' && (
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => deleteExpense(t.id)} className="text-rose-600 hover:bg-rose-600 hover:text-white border-rose-500/20">
                              <IconTrash size={16} />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>
            {(() => {
              const totalItems = transactions.filter(t => t.type === activeTab).length;
              const totalPages = Math.ceil(totalItems / itemsPerPage);
              if (totalPages <= 1) return null;
              return (
                <div className="flex items-center justify-between p-4 border-t border-border bg-bg-base/30">
                  <span className="text-sm text-text-muted">
                    Jami: {totalItems} ta. {currentPage}-sahifa ({totalPages} dan)
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Oldingi</Button>
                    <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Keyingi</Button>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {activeTab === 'debt' && (
        <Card className="shadow-sm border-border bg-bg-card overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[500px] custom-scrollbar">
              <Table>
                <TableHeader className="sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead>O'quvchi</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Filial</TableHead>
                    <TableHead>Umumiy summa</TableHead>
                    <TableHead>To'langan</TableHead>
                    <TableHead>Qarz</TableHead>
                    <TableHead className="text-right">Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const paginated = debtors.slice(startIndex, startIndex + itemsPerPage);
                    
                    if (debtors.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-text-muted">Qarzdorlar yo'q</TableCell>
                        </TableRow>
                      );
                    }
                    return paginated.map((s) => (
                      <TableRow key={s.id} className="hover:bg-bg-hover/50">
                        <TableCell className="font-medium text-text-primary">{s.firstName} {s.lastName}</TableCell>
                        <TableCell className="text-text-secondary">{s.phone}</TableCell>
                        <TableCell className="text-text-secondary">{branches.find(b => b.id === s.branchId)?.name || '-'}</TableCell>
                        <TableCell>{s.coursePrice.toLocaleString()} UZS</TableCell>
                        <TableCell className="text-emerald-600">{s.paidAmount.toLocaleString()} UZS</TableCell>
                        <TableCell className="text-rose-600 font-bold">{(s.coursePrice - s.paidAmount).toLocaleString()} UZS</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setIncomeModalOpen(true)} className="border-accent text-accent hover:bg-accent hover:text-white">
                            To'lov qo'shish
                          </Button>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>
            {(() => {
              const totalItems = debtors.length;
              const totalPages = Math.ceil(totalItems / itemsPerPage);
              if (totalPages <= 1) return null;
              return (
                <div className="flex items-center justify-between p-4 border-t border-border bg-bg-base/30">
                  <span className="text-sm text-text-muted">
                    Jami: {totalItems} ta. {currentPage}-sahifa ({totalPages} dan)
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Oldingi</Button>
                    <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Keyingi</Button>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {isExpenseModalOpen && <ExpenseForm onClose={() => setExpenseModalOpen(false)} />}
      {isIncomeModalOpen && <IncomeForm onClose={() => setIncomeModalOpen(false)} />}
    </div>
  );
};
