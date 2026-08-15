import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconTrendingDown, IconBuildingStore, IconCash, IconCategory, IconCalendar, IconFileDescription } from '@tabler/icons-react';
import { useExpenseStore } from '../../store/expenseStore';
import { useAuthStore } from '../../store/authStore';
import { useBranchStore } from '../../store/branchStore';
import { Button } from '../../components/ui/Button';

interface ExpenseFormProps {
  onClose: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onClose }) => {
  const { addExpense } = useExpenseStore();
  const user = useAuthStore(state => state.user);
  const branches = useBranchStore(state => state.branches);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [branchId, setBranchId] = useState(user?.role === 'admin' ? user.branchId : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !branchId) {
      setError("Iltimos barcha majburiy maydonlarni to'ldiring");
      return;
    }
    
    setLoading(true);
    try {
      // Preserve current time when submitting
      const submitDate = new Date();
      const [year, month, day] = date.split('-').map(Number);
      submitDate.setFullYear(year, month - 1, day);

      await addExpense({
        amount: Number(amount),
        category,
        date: submitDate.toISOString(),
        note,
        branchId: branchId!
      });
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
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 bg-bg-card border border-border shadow-2xl shadow-rose-500/10 rounded-2xl w-full max-w-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-rose-500/10 to-transparent relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <IconTrendingDown size={24} stroke={2} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">Xarajat qo'shish</h3>
                <p className="text-sm text-text-muted mt-0.5">Tizimga yangi chiqim kiritish</p>
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
                  required
                  value={branchId}
                  onChange={e => setBranchId(e.target.value)}
                  className="w-full bg-bg-hover border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all font-medium"
                >
                  <option value="" className="bg-bg-card text-text-primary">Filialni tanlang...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id} className="bg-bg-card text-text-primary">{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1.5">
                  <IconCash size={16} className="text-text-muted" /> Summa (UZS) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-bg-hover border border-border rounded-xl pl-4 pr-16 py-2.5 text-text-primary focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all font-bold text-lg"
                    placeholder="Masalan: 100000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted">UZS</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1.5">
                  <IconCategory size={16} className="text-text-muted" /> Toifa *
                </label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-bg-hover border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all font-medium"
                >
                  <option value="salary" className="bg-bg-card text-text-primary">Oylik maosh</option>
                  <option value="fuel" className="bg-bg-card text-text-primary">Yoqilg'i</option>
                  <option value="rent" className="bg-bg-card text-text-primary">Ijara</option>
                  <option value="tax" className="bg-bg-card text-text-primary">Soliq</option>
                  <option value="other" className="bg-bg-card text-text-primary">Boshqa</option>
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
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-bg-hover border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all font-medium"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-1.5">
                  <IconFileDescription size={16} className="text-text-muted" /> Izoh
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full bg-bg-hover border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all font-medium"
                  placeholder="Qisqacha izoh..."
                />
              </div>
            </div>

            <div className="pt-6 flex items-center justify-end gap-3 border-t border-border mt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="px-6 py-2.5 rounded-xl font-semibold">
                Bekor qilish
              </Button>
              <Button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/30">
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
