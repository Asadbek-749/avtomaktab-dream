import { create } from 'zustand';
import { Group } from '../types';
import { api } from '../services/api';

interface GroupState {
  groups: Group[];
  fetchGroups: () => Promise<void>;
  addGroup: (data: Omit<Group, 'id' | 'createdAt'>, userId: string) => Promise<void>;
  updateGroup: (id: string, data: Partial<Group>) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  fetchGroups: async () => {
    try {
      const groups = await api.getGroups();
      set({ groups });
    } catch (e) { console.error(e); }
  },
  addGroup: async (data, userId) => {
    try {
      await api.addGroup(data, userId);
      const groups = await api.getGroups();
      set({ groups });
    } catch (e) { console.error(e); }
  },
  updateGroup: async (id, data) => {
    try {
      await api.updateGroup(id, data);
      const groups = await api.getGroups();
      set({ groups });
    } catch (e) { console.error(e); }
  }
}));
