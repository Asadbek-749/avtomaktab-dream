import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGroupStore } from '../../../store/groupStore';
import { useAuthStore } from '../../../store/authStore';
import { useUserStore } from '../../../store/userStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { IconClock, IconMapPin } from '@tabler/icons-react';

const WEEK_DAYS = [
  { id: 'mon', label: 'Dushanba' },
  { id: 'tue', label: 'Seshanba' },
  { id: 'wed', label: 'Chorshanba' },
  { id: 'thu', label: 'Payshanba' },
  { id: 'fri', label: 'Juma' },
  { id: 'sat', label: 'Shanba' },
];

export const SchedulePage = () => {
  const { groups, fetchGroups } = useGroupStore();
  const { users, fetchUsers } = useUserStore();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, [fetchGroups, fetchUsers]);

  const branchGroups = groups.filter(g => g.branchId === user?.branchId && g.status === 'active');
  const teachers = users.filter(u => u.role === 'teacher' || u.role === 'admin');

  const getSchedulesForDay = (dayId: string) => {
    const schedules: { groupName: string; teacherName: string; startTime: string; type: string }[] = [];
    
    branchGroups.forEach(group => {
      const teacher = teachers.find(t => t.id === group.teacherId);
      const teacherName = teacher ? teacher.name : "Noma'lum o'qituvchi";
      
      group.schedule.forEach(slot => {
        if (slot.day === dayId) {
          schedules.push({
            groupName: group.name,
            teacherName,
            startTime: slot.startTime,
            type: slot.type
          });
        }
      });
    });

    // Sort by start time
    return schedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Jadval</h2>
        <p className="text-text-muted">Filial bo'yicha haftalik dars jadvali</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {WEEK_DAYS.map(day => {
          const daySchedules = getSchedulesForDay(day.id);
          
          return (
            <Card key={day.id} className="h-full">
              <CardHeader className="bg-bg-hover rounded-t-2xl border-b border-border">
                <CardTitle className="text-center">{day.label}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {daySchedules.length === 0 ? (
                  <p className="text-center text-text-muted py-8">Bu kunda darslar yo'q</p>
                ) : (
                  daySchedules.map((schedule, i) => (
                    <div key={i} className="bg-bg-base border border-border p-4 rounded-xl shadow-sm hover:border-accent transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-accent">{schedule.groupName}</h4>
                        <span className="flex items-center gap-1 text-sm font-semibold text-text-primary bg-accent/10 px-2 py-1 rounded-md">
                          <IconClock size={14} />
                          {schedule.startTime}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary font-medium">{schedule.teacherName}</p>
                      <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                        <IconMapPin size={12} />
                        {schedule.type === 'theory' ? 'Nazariya xonasi' : 'Amaliyot maydoni'}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SchedulePage;
