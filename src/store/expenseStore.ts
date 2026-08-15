import { create } from 'zustand';
import { api } from '../services/api';
import { Expense } from '../types';

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'addedBy' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  loading: false,
  error: null,

  fetchExpenses: async () => {
    set({ loading: true, error: null });
    try {
      const expenses = await api.getExpenses();
      set({ expenses, loading: false });
    } catch (error: any) {
      set({ error: error.message || "Xarajatlarni yuklashda xatolik yuz berdi", loading: false });
    }
  },

  addExpense: async (expenseData) => {
    set({ loading: true, error: null });
    try {
      const expense = await api.addExpense(expenseData);
      set((state) => ({ 
        expenses: [expense, ...state.expenses],
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message || "Xarajat qo'shishda xatolik yuz berdi", loading: false });
      throw error;
    }
  },

  deleteExpense: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.deleteExpense(id);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message || "Xarajatni o'chirishda xatolik yuz berdi", loading: false });
      throw error;
    }
  },
}));
