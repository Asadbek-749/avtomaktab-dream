import { create } from 'zustand';
import { Attendance } from '../types';
import { api } from '../services/api';

interface AttendanceState {
  attendances: Attendance[];
  fetchAttendances: () => void;
  addAttendance: (data: Omit<Attendance, 'id' | 'createdAt'>) => void;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  attendances: [],
  fetchAttendances: async () => {
    const attendances = await api.getAttendances();
    set({ attendances });
  },
  addAttendance: async (data) => {
    await api.addAttendance(data);
    const attendances = await api.getAttendances();
    set({ attendances });
  }
}));
