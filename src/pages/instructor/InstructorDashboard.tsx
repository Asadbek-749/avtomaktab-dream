import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Student, DrivingLesson } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { IconUsers, IconCalendarEvent, IconCar, IconPlus } from '@tabler/icons-react';
import { Button } from '../../components/ui/Button';

export const InstructorDashboard = () => {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<DrivingLesson[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch students assigned to this instructor
      const allStudents = await api.getStudents();
      const myStudents = allStudents.filter((s: any) => s.instructorId === user?.id && s.status !== 'completed');
      setStudents(myStudents);

      // Fetch driving lessons
      const myLessons = await api.getDrivingLessons({ instructorId: user?.id });
      setLessons(myLessons);
    } catch (error) {
      console.error(error);
    }
  };

  const totalLessonsThisMonth = lessons.filter(l => new Date(l.date).getMonth() === new Date().getMonth()).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Xush kelibsiz, {user?.name}!</h1>
        <p className="text-text-muted">Amaliyot instruktori paneli</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Faol o'quvchilarim</p>
                <p className="text-3xl font-bold text-text-primary mt-2">{students.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                <IconUsers size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-transparent border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">O'tilgan darslar (Oylik)</p>
                <p className="text-3xl font-bold text-text-primary mt-2">{totalLessonsThisMonth}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success">
                <IconCalendarEvent size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Avtomobil</p>
                <p className="text-xl font-bold text-text-primary mt-1">{user?.carModel || 'Kiritilmagan'}</p>
                <p className="text-xs text-text-muted">{user?.carNumber} • {user?.transmission === 'auto' ? 'Avtomat' : 'Mexanika'}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                <IconCar size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mening O'quvchilarim</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-text-muted text-center py-4">O'quvchilar biriktirilmagan</p>
            ) : (
              <div className="space-y-4">
                {students.map(student => (
                  <div key={student.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-bg-hover transition-colors border border-border/50">
                    <div>
                      <p className="font-semibold text-text-primary">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-text-secondary">{student.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Soatlar: <span className="text-accent">{student.drivingHoursDone || 0}</span> / {student.drivingHoursRequired || 20}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>So'nggi darslar</CardTitle>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <p className="text-text-muted text-center py-4">Hali darslar o'tilmagan</p>
            ) : (
              <div className="space-y-4">
                {lessons.slice(0, 5).map(lesson => (
                  <div key={lesson.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-bg-hover transition-colors border border-border/50">
                    <div>
                      <p className="font-semibold text-text-primary">{lesson.student?.firstName} {lesson.student?.lastName}</p>
                      <p className="text-xs text-text-secondary">{new Date(lesson.date).toLocaleDateString()} • {lesson.startTime} - {lesson.endTime}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                        {lesson.hours} soat
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
