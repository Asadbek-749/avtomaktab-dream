import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Student, DrivingLesson } from '../../types';
import { IconPlus, IconCalendarEvent } from '@tabler/icons-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';

export const InstructorLessons = () => {
  const { user } = useAuthStore();
  const [lessons, setLessons] = useState<DrivingLesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    hours: 2,
    studentId: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const allStudents = await api.getStudents();
      setStudents(allStudents.filter(s => s.instructorId === user?.id && s.status !== 'completed'));

      const myLessons = await api.getDrivingLessons({ instructorId: user?.id });
      setLessons(myLessons);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addDrivingLesson({
        ...formData,
        instructorId: user?.id
      });
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      alert("Xatolik yuz berdi");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Haydash Darslari</h1>
          <p className="text-text-muted">Amaliyot soatlarini belgilash</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <IconPlus size={20} />
          Yangi dars qo'shish
        </Button>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sana</TableHead>
              <TableHead>O'quvchi</TableHead>
              <TableHead>Vaqti</TableHead>
              <TableHead>Soat</TableHead>
              <TableHead>Holati</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-text-muted">Darslar topilmadi</TableCell>
              </TableRow>
            ) : (
              lessons.map(lesson => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <IconCalendarEvent size={16} className="text-text-muted" />
                      {new Date(lesson.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{lesson.student?.firstName} {lesson.student?.lastName}</TableCell>
                  <TableCell>{lesson.startTime} - {lesson.endTime}</TableCell>
                  <TableCell className="font-medium text-accent">{lesson.hours} soat</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">O'tildi</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yangi amaliyot darsi">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">O'quvchi</label>
            <select 
              required
              className="w-full bg-bg-base border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
              value={formData.studentId}
              onChange={e => setFormData({...formData, studentId: e.target.value})}
            >
              <option value="">O'quvchini tanlang</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} (Qolgan soat: {s.drivingHoursRequired - s.drivingHoursDone})</option>
              ))}
            </select>
          </div>

          <Input 
            label="Sana" 
            type="date" 
            required 
            value={formData.date} 
            onChange={e => setFormData({...formData, date: e.target.value})} 
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Boshlanish vaqti" 
              type="time" 
              required 
              value={formData.startTime} 
              onChange={e => setFormData({...formData, startTime: e.target.value})} 
            />
            <Input 
              label="Tugash vaqti" 
              type="time" 
              required 
              value={formData.endTime} 
              onChange={e => setFormData({...formData, endTime: e.target.value})} 
            />
          </div>

          <Input 
            label="Dars davomiyligi (Soat)" 
            type="number" 
            required 
            min="1"
            max="10"
            value={formData.hours} 
            onChange={e => setFormData({...formData, hours: Number(e.target.value)})} 
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Eslatma (Ixtiyoriy)</label>
            <textarea 
              className="w-full bg-bg-base border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent min-h-[100px]"
              placeholder="Dars haqida eslatmalar..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit">Saqlash</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
