import axios from 'axios';
import { Student, Group, Payment, User, ActivityLog, CashReport, Branch, Attendance, InstructorPayment } from '../types';

const API_URL = import.meta.env.PROD ? 'https://api.avtodream.uz/api' : 'http://localhost:5000/api';

const apiInstance = axios.create({
  baseURL: API_URL
});

// Interceptor for attaching token
apiInstance.interceptors.request.use((config) => {
  const authStore = localStorage.getItem('auth-storage');
  if (authStore) {
    try {
      const parsed = JSON.parse(authStore);
      if (parsed.state && parsed.state.user && parsed.state.user.token) {
        config.headers.Authorization = `Bearer ${parsed.state.user.token}`;
      }
    } catch (e) {}
  }
  return config;
});

class ApiService {
  // --- Branches ---
  async getBranches(): Promise<Branch[]> {
    const res = await apiInstance.get('/branches');
    return res.data;
  }
  async addBranch(data: Omit<Branch, 'id' | 'createdAt'>): Promise<Branch> {
    const res = await apiInstance.post('/branches', data);
    return res.data;
  }
  async updateBranch(id: string, data: Partial<Branch>): Promise<Branch> {
    const res = await apiInstance.put(`/branches/${id}`, data);
    return res.data;
  }
  async deleteBranch(id: string): Promise<void> {
    await apiInstance.delete(`/branches/${id}`);
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    const res = await apiInstance.get('/users');
    return res.data;
  }
  async addUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const res = await apiInstance.post('/users', data);
    return res.data;
  }
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const res = await apiInstance.put(`/users/${id}`, data);
    return res.data;
  }
  async deleteUser(id: string): Promise<void> {
    await apiInstance.delete(`/users/${id}`);
  }

  // --- Students ---
  async getStudents(): Promise<Student[]> {
    const res = await apiInstance.get('/students');
    // Map _id to id if necessary
    return res.data.map((s: any) => ({ ...s, id: s._id || s.id }));
  }
  async addStudent(data: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
    // Filter out fields that don't exist in backend schema
    const { documents, examResults, id, createdAt, ...cleanData } = data as any;

    console.log('Sending student data to API:', cleanData);
    const res = await apiInstance.post('/students', cleanData);
    return { ...res.data, id: res.data.id || res.data._id };
  }
  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    // Filter out fields that don't exist in backend schema
    const { documents, examResults, id: _id, createdAt, createdBy, ...cleanData } = data as any;

    console.log('Updating student with data:', cleanData);
    const res = await apiInstance.put(`/students/${id}`, cleanData);
    return { ...res.data, id: res.data.id || res.data._id };
  }
  async deleteStudent(id: string): Promise<void> {
    await apiInstance.delete(`/students/${id}`);
  }

  // --- Groups ---
  async getGroups(): Promise<Group[]> {
    const res = await apiInstance.get('/groups');
    return res.data.map((g: any) => ({ ...g, id: g._id || g.id }));
  }
  async addGroup(data: Omit<Group, 'id' | 'createdAt'>, userId: string): Promise<Group> {
    const res = await apiInstance.post('/groups', data);
    return { ...res.data, id: res.data.id || res.data._id };
  }
  async updateGroup(id: string, data: Partial<Group>): Promise<Group> {
    const res = await apiInstance.put(`/groups/${id}`, data);
    return { ...res.data, id: res.data.id || res.data._id };
  }

  // --- Payments ---
  async getPayments(): Promise<Payment[]> {
    const res = await apiInstance.get('/payments');
    return res.data.map((p: any) => ({ ...p, id: p._id || p.id }));
  }
  async addPayment(data: Omit<Payment, 'id'>, userName: string): Promise<Payment> {
    const res = await apiInstance.post('/payments', data);
    return { ...res.data, id: res.data.id || res.data._id };
  }

  // Auth (Login) - Usually handled by authStore directly or here
  async login(login: string, password: string):Promise<any> {
    const res = await apiInstance.post('/auth/login', { login, password });
    return res.data;
  }

  // --- Logs ---
  async getLogs(): Promise<ActivityLog[]> {
    const res = await apiInstance.get('/logs');
    return res.data.map((l: any) => ({ ...l, id: l.id || l._id, timestamp: l.createdAt }));
  }
  async logActivity(data: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<ActivityLog> {
    const res = await apiInstance.post('/logs', data);
    return res.data;
  }
  
  // --- Cash Reports ---
  async getCashReports(): Promise<CashReport[]> {
    const res = await apiInstance.get('/cash-reports');
    return res.data;
  }
  async addCashReport(totalAmount: number, addedBy: string, branchId: string): Promise<CashReport> {
    const res = await apiInstance.post('/cash-reports', { totalAmount, branchId });
    return res.data;
  }
  async updateCashReport(id: string, status: string, superadminId: string): Promise<CashReport> {
    const res = await apiInstance.put(`/cash-reports/${id}`, { status });
    return res.data;
  }
  
  // --- Attendance (mocking) ---
  async getAttendances(): Promise<Attendance[]> {
    return [];
  }

  // --- Driving Lessons ---
  async getDrivingLessons(params?: { studentId?: string; instructorId?: string }): Promise<any[]> {
    const res = await apiInstance.get('/driving-lessons', { params });
    return res.data;
  }
  async addDrivingLesson(data: any): Promise<any> {
    const res = await apiInstance.post('/driving-lessons', data);
    return res.data;
  }
  async updateDrivingLesson(id: string, data: any): Promise<any> {
    const res = await apiInstance.put(`/driving-lessons/${id}`, data);
    return res.data;
  }
  async deleteDrivingLesson(id: string): Promise<void> {
    await apiInstance.delete(`/driving-lessons/${id}`);
  }

  // --- Expenses ---
  async getExpenses(): Promise<any[]> {
    const res = await apiInstance.get('/expenses');
    return res.data;
  }
  async addExpense(data: any): Promise<any> {
    const res = await apiInstance.post('/expenses', data);
    return res.data;
  }
  async deleteExpense(id: string): Promise<void> {
    await apiInstance.delete(`/expenses/${id}`);
  }

  // --- Payments (Extended) ---
  async deletePayment(id: string): Promise<void> {
    await apiInstance.delete(`/payments/${id}`);
  }

  // --- Instructor Payments ---
  async getInstructorPayments(instructorId: string): Promise<InstructorPayment[]> {
    const res = await apiInstance.get(`/instructor-payments/instructor/${instructorId}`);
    return res.data;
  }
  async addInstructorPayment(data: Omit<InstructorPayment, 'id' | 'createdAt'>): Promise<InstructorPayment> {
    const res = await apiInstance.post('/instructor-payments', data);
    return res.data;
  }
  async deleteInstructorPayment(id: string): Promise<void> {
    await apiInstance.delete(`/instructor-payments/${id}`);
  }

  // --- Practice Groups ---
  async getPracticeGroups(instructorId?: string, branchId?: string): Promise<any[]> {
    const params: any = {};
    if (instructorId) params.instructorId = instructorId;
    if (branchId) params.branchId = branchId;
    const res = await apiInstance.get('/practice-groups', { params });
    return res.data;
  }
  async createPracticeGroup(data: { name: string, instructorId: string, branchId: string }): Promise<any> {
    const res = await apiInstance.post('/practice-groups', data);
    return res.data;
  }
  async updatePracticeGroup(id: string, data: { name?: string, status?: 'active' | 'completed' }): Promise<any> {
    const res = await apiInstance.put(`/practice-groups/${id}`, data);
    return res.data;
  }
  async deletePracticeGroup(id: string): Promise<void> {
    await apiInstance.delete(`/practice-groups/${id}`);
  }

  // --- Instructor Finance Summary ---
  async getInstructorFinanceSummary(): Promise<any[]> {
    const res = await apiInstance.get('/instructor-payments/summary');
    return res.data;
  }
}

export const api = new ApiService();
