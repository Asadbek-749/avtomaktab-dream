import { create } from 'zustand';
import { Payment } from '../types';
import { api } from '../services/api';
import { useStudentStore } from './studentStore';

interface PaymentState {
  payments: Payment[];
  fetchPayments: () => Promise<void>;
  addPayment: (data: Omit<Payment, 'id'>, userName: string) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  payments: [],
  fetchPayments: async () => {
    try {
      const payments = await api.getPayments();
      set({ payments });
    } catch (e) { console.error(e); }
  },
  addPayment: async (data, userName) => {
    try {
      await api.addPayment(data, userName);
      const payments = await api.getPayments();
      set({ payments });
      await useStudentStore.getState().fetchStudents();
    } catch (e) { console.error(e); }
  },
  deletePayment: async (id) => {
    try {
      await api.deletePayment(id);
      set(state => ({ payments: state.payments.filter(p => p.id !== id) }));
      await useStudentStore.getState().fetchStudents();
    } catch (e) { console.error(e); throw e; }
  }
}));
