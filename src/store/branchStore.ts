import { create } from 'zustand';
import { Branch } from '../types';
import { api } from '../services/api';

interface BranchState {
  branches: Branch[];
  activeBranchId: string | null;
  fetchBranches: () => Promise<void>;
  setActiveBranch: (id: string | null) => void;
  addBranch: (data: Omit<Branch, 'id' | 'createdAt'>) => Promise<void>;
  updateBranch: (id: string, data: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
}

export const useBranchStore = create<BranchState>((set) => ({
  branches: [],
  activeBranchId: null,
  fetchBranches: async () => {
    try {
      const branches = await api.getBranches();
      set({ branches });
    } catch (e) { console.error(e); }
  },
  setActiveBranch: (id) => set({ activeBranchId: id }),
  addBranch: async (data) => {
    try {
      await api.addBranch(data);
      const branches = await api.getBranches();
      set({ branches });
    } catch (e) { console.error(e); }
  },
  updateBranch: async (id, data) => {
    try {
      await api.updateBranch(id, data);
      const branches = await api.getBranches();
      set({ branches });
    } catch (e) { console.error(e); }
  },
  deleteBranch: async (id) => {
    try {
      await api.deleteBranch(id);
      const branches = await api.getBranches();
      set({ branches });
    } catch (e) { console.error(e); }
  }
}));
