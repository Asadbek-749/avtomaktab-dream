import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconTrendingUp, IconBuildingStore, IconUser, IconWallet, IconCalendar, IconFileDescription, IconCash } from '@tabler/icons-react';
import { usePaymentStore } from '../../store/paymentStore';
import { useStudentStore } from '../../store/studentStore';
import { useAuthStore } from '../../store/authStore';
import { useBranchStore } from '../../store/branchStore';
import { Button } from '../../components/ui/Button';

interface IncomeFormProps {
  onClose: () => void;
  defaultStudentId?: string;
}

export const IncomeForm: React.FC<IncomeFormProps> = ({ onClose, defaultStudentId = '' }) => {
  const { addPayment } = usePaymentStore();
  const { students } = useStudentStore();
  const user = useAuthStore(state => state.user);
  const branches = useBranchStore(state => state.branches);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [studentId, setStudentId] = useState(defaultStudentId);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'naqd' | 'karta' | 'hisob'>('naqd');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  
  const [branchId, setBranchId] = useState(user?.role === 'admin' ? user.branchId : '');

  // Faqat joriy filialdagi qarzdor yoki o'qiyotgan o'quvchilar
  const availableStudents = students.filter(s => 
    (!branchId || s.branchId === branchId) && 
    s.status !== 'completed' &&
    (s.coursePrice - s.paidAmount > 0)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !studentId || !user) {
      setError("Iltimos barcha majburiy maydonlarni to'ldiring");
      return;
    }

    const student = students.find(s => s.id === studentId);
    if (!student) {
      setError("O'quvchi topilmadi");
      return;
    }

    const debt = student.coursePrice - student.paidAmount;
    const numAmount = Number(amount);
    
    if (numAmount > debt) {
      setError(`Kiritilgan summa qarz miqdoridan (${debt.toLocaleString()} so'm) oshmasligi kerak!`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Preserve current time when submitting
      const submitDate = new Date();
      const [year, month, day] = date.split('-').map(Number);
      submitDate.setFullYear(year, month - 1, day);

      await addPayment({
        studentId: student.id,
        amount: numAmount,
        method,
        date: submitDate.toISOString(),
        note: note || 'Dars uchun to\'lov',
        branchId: student.branchId,
        addedBy: user.id
      }, user.name);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-transparent backdrop-blur-lg"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 bg-bg-card border border-border shadow-2xl shadow-emerald-500/10 rounded-2xl w-full max-w-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-emerald-500/10 to-transparent relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <IconTrendingUp size={24} stroke={2} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Tushum qo'shish</h2>
                <p className="text-sm text-text-muted mt-0.5">O'quvchidan to'lov qabul qilish</p>
              </div>
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary hover:bg-bg-hover p-2 rounded-full transition-colors relative z-10">
              <IconX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm font-medium flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></div>
                {error}
              </div>
            )}

            {user?.role === 'superadmin' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1.5">
                  <IconBuildingStore size={16} className="text-text-muted" /> Filial *
                </label>
                <select
                  value={branchId || ''}
                  onChange={(e) => {
                    setBranchId(e.target.value);
                    setStudentId('');
                  }}
                  className="w-full bg-bg-base/50 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                  required
                >
                  <option value="">Filialni tanlang</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1.5">
                <IconUser size={16} className="text-text-muted" /> O'quvchi (Qarzdor) *
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-bg-base/50 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium disabled:opacity-50"
                required
                disabled={user?.role === 'superadmin' && !branchId}
              >
                <option value="">O'quvchini tanlang</option>
                {availableStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} (Qarz: {(s.coursePrice - s.paidAmount).toLocaleString()} UZS)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1.5">
                  <IconCash size={16} className="text-text-muted" /> Summa (UZS) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Masalan: 500000"
                    className="w-full bg-bg-base/50 border border-border rounded-xl pl-4 pr-16 py-2.5 text-text-primary focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-lg"
                    required
                    min="1000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted">UZS</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1.5">
                  <IconWallet size={16} className="text-text-muted" /> To'lov usuli *
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full bg-bg-base/50 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                  required
                >
                  <option value="naqd">Naqd pul</option>
                  <option value="karta">Plastik karta</option>
                  <option value="hisob">Hisob raqam</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1.5">
                  <IconCalendar size={16} className="text-text-muted" /> Sana *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-bg-base/50 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                  required
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1.5">
                  <IconFileDescription size={16} className="text-text-muted" /> Izoh (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="To'lov haqida qo'shimcha..."
                  className="w-full bg-bg-base/50 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                />
              </div>
            </div>

            <div className="pt-6 flex items-center justify-end gap-3 border-t border-border mt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="px-6 py-2.5 rounded-xl font-semibold">
                Bekor qilish
              </Button>
              <Button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30">
                {loading ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
