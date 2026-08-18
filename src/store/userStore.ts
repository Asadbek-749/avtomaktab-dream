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
    } catch (e: any) { 
      console.error(e);
      alert(e.response?.data?.message || 'Xodim qo\'shishda xatolik yuz berdi');
      throw e;
    }
  },
  updateUser: async (id, data) => {
    try {
      await api.updateUser(id, data);
      const users = await api.getUsers();
      set({ users });
    } catch (e: any) { 
      console.error(e);
      alert(e.response?.data?.message || 'Xodimni saqlashda xatolik yuz berdi');
      throw e;
    }
  },
  deleteUser: async (id) => {
    try {
      await api.deleteUser(id);
      const users = await api.getUsers();
      set({ users });
    } catch (e: any) {
      const msg = e.response?.data?.message;
      if (msg) {
        alert(msg);
      } else {
        alert("Xatolik yuz berdi. Xodimni o'chirib bo'lmaydi.");
      }
      console.error("DELETE ERROR:", e);
    }
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
