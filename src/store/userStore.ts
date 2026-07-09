import { create } from 'zustand';
import { User, Role } from '../types';
import { api } from '../services/api';

interface UserState {
  users: User[];
  fetchUsers: () => Promise<void>;
  addUser: (data: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  fetchUsers: async () => {
    try {
      const users = await api.getUsers();
      set({ users });
    } catch (e) { console.error(e); }
  },
  addUser: async (data) => {
    try {
      await api.addUser(data);
      const users = await api.getUsers();
      set({ users });
    } catch (e) { console.error(e); }
  },
  updateUser: async (id, data) => {
    try {
      await api.updateUser(id, data);
      const users = await api.getUsers();
      set({ users });
    } catch (e) { console.error(e); }
  },
  deleteUser: async (id) => {
    try {
      await api.deleteUser(id);
      const users = await api.getUsers();
      set({ users });
    } catch (e) { console.error(e); }
  },
  toggleUserStatus: async (id) => {
    const user = get().users.find(u => u.id === id);
    if (user) {
      try {
        await api.updateUser(id, { isActive: !user.isActive });
        const users = await api.getUsers();
        set({ users });
      } catch (e) { console.error(e); }
    }
  }
}));
