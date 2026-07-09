import { create } from 'zustand';
import { CashReport } from '../types';
import { api } from '../services/api';

interface CashState {
  reports: CashReport[];
  fetchReports: () => void;
  addReport: (totalAmount: number, addedBy: string, branchId: string) => void;
  updateReportStatus: (id: string, status: 'approved' | 'rejected', superadminId: string) => void;
}

export const useCashStore = create<CashState>((set) => ({
  reports: [],
  fetchReports: async () => {
    const reports = await api.getCashReports();
    set({ reports });
  },
  addReport: async (totalAmount, addedBy, branchId) => {
    // await api.addCashReport(totalAmount, addedBy, branchId);
    const reports = await api.getCashReports();
    set({ reports });
  },
  updateReportStatus: async (id, status, superadminId) => {
    // await api.updateCashReport(id, status, superadminId);
    const reports = await api.getCashReports();
    set({ reports });
  }
}));
