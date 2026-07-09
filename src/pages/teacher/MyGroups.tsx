import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import { useStudentStore } from '../../store/studentStore';
import { useAttendanceStore } from '../../store/attendanceStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { IconCheck, IconX, IconCalendarEvent } from '@tabler/icons-react';

export const MyGroups = () => {
  const user = useAuthStore(state => state.user);
  const { groups, fetchGroups } = useGroupStore();
  const { students, fetchStudents } = useStudentStore();
  const { attendances, fetchAttendances, addAttendance } = useAttendanceStore();

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchGroups();
    fetchStudents();
    fetchAttendances();
  }, [fetchGroups, fetchStudents, fetchAttendances]);

  const myGroups = groups.filter(g => g.teacherId === user?.id);

  const openAttendanceModal = (group: any) => {
    setSelectedGroup(group);
    
    // Load existing or set default records
    const today = new Date().toISOString().split('T')[0];
    setAttendanceDate(today);
    
    const groupStudents = students.filter(s => s.groupId === group.id);
    const existingAttendance = attendances.find(a => a.groupId === group.id && a.date === today);
    
    const initialRecords: Record<string, boolean> = {};
    groupStudents.forEach(s => {
      if (existingAttendance) {
        const rec = existingAttendance.records.find(r => r.studentId === s.id);
        initialRecords[s.id] = rec ? rec.present : true;
      } else {
        initialRecords[s.id] = true;
      }
    });
    setRecords(initialRecords);
    setAttendanceModalOpen(true);
  };

  const handleDateChange = (date: string) => {
    setAttendanceDate(date);
    if (!selectedGroup) return;
    
    const groupStudents = students.filter(s => s.groupId === selectedGroup.id);
    const existingAttendance = attendances.find(a => a.groupId === selectedGroup.id && a.date === date);
    
    const newRecords: Record<string, boolean> = {};
    groupStudents.forEach(s => {
      if (existingAttendance) {
        const rec = existingAttendance.records.find(r => r.studentId === s.id);
        newRecords[s.id] = rec ? rec.present : true;
      } else {
        newRecords[s.id] = true; // default present
      }
    });
    setRecords(newRecords);
  };

  const toggleStudentAttendance = (studentId: string) => {
    setRecords(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const saveAttendance = () => {
    if (!selectedGroup || !user) return;
    
    const formattedRecords = Object.entries(records).map(([studentId, present]) => ({
      studentId,
      present
    }));
    
    addAttendance({
      groupId: selectedGroup.id,
      date: attendanceDate,
      records: formattedRecords,
      teacherId: user.id
    });
    
    setAttendanceModalOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Mening guruhlarim</h2>
        <p className="text-text-muted">Sizga biriktirilgan barcha guruhlar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myGroups.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-muted">
            Sizga hali guruh biriktirilmagan.
          </div>
        ) : (
          myGroups.map((group, i) => (
            <motion.div 
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="hover:-translate-y-1 transition-transform duration-200 cursor-pointer group-card" onClick={() => openAttendanceModal(group)}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">{group.name}</h3>
                      <p className="text-sm text-text-muted mt-1">Holat: {group.status === 'active' ? 'Faol' : 'Tugagan'}</p>
                    </div>
                    <span className="bg-accent-bg text-accent px-3 py-1 rounded-full text-xs font-semibold">
                      {students.filter(s => s.groupId === group.id).length} O'quvchi
                    </span>
                  </div>
                  
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Modal isOpen={attendanceModalOpen} onClose={() => setAttendanceModalOpen(false)} title={`${selectedGroup?.name || ''} - Davomat`} size="3xl">
        <div className="space-y-6">
          <div className="bg-bg-hover p-4 rounded-xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-bold text-text-primary">Dars sanasini tanlang</h4>
              <p className="text-sm text-text-muted">Qaysi kun uchun davomat olayotganingizni aniqlang</p>
            </div>
            <div className="relative w-full sm:w-64 group">
              <input 
                type="date" 
                value={attendanceDate} 
                onChange={(e) => handleDateChange(e.target.value)} 
                className="w-full bg-bg-base border-2 border-border rounded-xl pl-4 pr-12 py-3 text-text-primary text-lg font-bold shadow-sm focus:outline-none focus:border-accent transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-text-muted group-hover:text-accent transition-colors">
                <IconCalendarEvent size={24} />
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto px-1">
            {selectedGroup && students.filter(s => s.groupId === selectedGroup.id).map(student => (
              <div key={student.id} className="flex items-center justify-between p-4 bg-bg-base border border-border rounded-xl hover:border-accent/50 transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-text-primary text-lg">{student.firstName} {student.lastName}</span>
                  <span className="text-sm text-text-muted">{student.phone}</span>
                </div>
                <button 
                  onClick={() => toggleStudentAttendance(student.id)}
                  className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${records[student.id] ? 'bg-success' : 'bg-border hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600'}`}
                  role="switch"
                  aria-checked={records[student.id]}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${records[student.id] ? 'translate-x-6' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            ))}
            {selectedGroup && students.filter(s => s.groupId === selectedGroup.id).length === 0 && (
              <div className="text-center text-text-muted py-4">Bu guruhda o'quvchilar yo'q.</div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setAttendanceModalOpen(false)}>Bekor qilish</Button>
            <Button onClick={saveAttendance}>Saqlash</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default MyGroups;
