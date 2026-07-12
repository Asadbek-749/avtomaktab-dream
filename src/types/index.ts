export type Role = 'superadmin' | 'admin' | 'teacher' | 'instructor';

export interface Branch {
  id: string;
  name: string;
  address: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  login: string;
  phone: string;
  role: Role;
  branchId?: string; // Optional for superadmin, required for others
  password?: string;
  carModel?: string;
  carNumber?: string;
  transmission?: string; // 'manual' or 'auto'
  createdAt: string;
  isActive: boolean;
}

export interface ExamResult {
  id: string;
  attemptNumber: number;
  date: string;
  passed: boolean;
  note: string;
  addedBy: string; // admin or teacher ID
}

export interface Document {
  id: string;
  name: string;
  type: string;
  base64: string;
  uploadedAt: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  groupId: string;
  branchId: string;
  instructorId?: string;
  coursePrice: number;
  paidAmount: number;
  status: 'active' | 'completed' | 'stopped';
  providedDocuments?: {
    photo: boolean;
    form083: boolean;
    passport: boolean;
  };
  drivingHoursRequired: number;
  drivingHoursDone: number;
  transmissionPreference?: string;
  examResults: ExamResult[];
  documents: Document[];
  createdAt: string;
  createdBy: string;
}

export interface ScheduleSlot {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  startTime: string; // "09:00"
  type: 'theory' | 'practice';
}

export interface Group {
  id: string;
  name: string;
  teacherId: string;
  branchId: string;
  schedule: ScheduleSlot[];
  studentIds: string[];
  status: 'active' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  note: string;
  branchId: string;
  addedBy: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface CashReport {
  id: string;
  date: string; // ISO string representing the date of the report
  totalAmount: number;
  addedBy: string; // Admin's User ID or Name
  branchId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface AttendanceRecord {
  studentId: string;
  present: boolean;
}

export interface Attendance {
  id: string;
  groupId: string;
  date: string; // ISO string for the date of class
  records: AttendanceRecord[];
  teacherId: string;
  createdAt: string;
}

export interface DrivingLesson {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  studentId: string;
  instructorId: string;
  createdAt: string;
  student?: { firstName: string; lastName: string };
  instructor?: { name: string };
}
