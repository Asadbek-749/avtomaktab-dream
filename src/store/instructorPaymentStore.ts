import { create } from 'zustand';
import { api } from '../services/api';
import { InstructorPayment } from '../types';

export interface InstructorFinanceSummary {
  instructorId: string;
  name: string;
  branchId: string;
  studentCount: number;
  pricePerStudent: number;
  totalEarned: number;
  totalAdvances: number;
  balance: number;
}

interface InstructorPaymentState {
  payments: InstructorPayment[];
  summary: InstructorFinanceSummary[];
  loading: boolean;
  error: string | null;
  fetchPayments: (instructorId: string) => Promise<void>;
  fetchSummary: () => Promise<void>;
  addPayment: (payment: Omit<InstructorPayment, 'id' | 'createdAt'>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
}

export const useInstructorPaymentStore = create<InstructorPaymentState>((set) => ({
  payments: [],
  summary: [],
  loading: false,
  error: null,

  fetchSummary: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.getInstructorFinanceSummary();
      set({ summary: data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  fetchPayments: async (instructorId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api.getInstructorPayments(instructorId);
      set({ payments: data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  addPayment: async (payment) => {
    set({ loading: true, error: null });
    try {
      const newPayment = await api.addInstructorPayment(payment);
      set((state) => ({
        payments: [newPayment, ...state.payments],
        loading: false
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  deletePayment: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.deleteInstructorPayment(id);
      set((state) => ({
        payments: state.payments.filter((p) => p.id !== id),
        loading: false
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  }
}));
