import { create } from 'zustand';
import { Student } from '../types';
import { api } from '../services/api';

interface StudentState {
  students: Student[];
  fetchStudents: () => Promise<void>;
  addStudent: (data: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
}

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  fetchStudents: async () => {
    try {
      const students = await api.getStudents();
      set({ students });
    } catch (e) { console.error(e); }
  },
  addStudent: async (data) => {
    try {
      console.log('Adding student with data:', data);
      const result = await api.addStudent(data);
      console.log('Student added successfully:', result);
      const students = await api.getStudents();
      set({ students });
    } catch (e) {
      console.error('Error adding student:', e);
      if ((e as any).response) {
        console.error('Response error:', (e as any).response.data);
        console.error('Response status:', (e as any).response.status);
      }
      throw e;
    }
  },
  updateStudent: async (id, data) => {
    try {
      await api.updateStudent(id, data);
      const students = await api.getStudents();
      set({ students });
    } catch (e) { console.error(e); }
  }
}));
