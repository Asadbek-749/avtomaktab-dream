import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

export const MySchedule = () => {
  const user = useAuthStore(state => state.user);
  const { groups, fetchGroups } = useGroupStore();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const myGroups = groups.filter(g => g.teacherId === user?.id);
  
  // Aggregate schedule
  const scheduleByDay: Record<string, any[]> = {
    mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
  };

  myGroups.forEach(group => {
    group.schedule.forEach(slot => {
      scheduleByDay[slot.day].push({
        groupName: group.name,
        time: slot.startTime,
        type: slot.type
      });
    });
  });

  const days = [
    { key: 'mon', label: 'Dushanba' },
    { key: 'tue', label: 'Seshanba' },
    { key: 'wed', label: 'Chorshanba' },
    { key: 'thu', label: 'Payshanba' },
    { key: 'fri', label: 'Juma' },
    { key: 'sat', label: 'Shanba' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Mening jadvalim</h2>
        <p className="text-text-muted">Haftalik dars jadvalingiz</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.map((day, index) => (
          <Card key={day.key} className="h-full">
            <CardHeader className="bg-bg-hover rounded-t-xl py-3 px-4 border-b border-border">
              <CardTitle className="text-base">{day.label}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {scheduleByDay[day.key].length === 0 ? (
                <p className="text-sm text-text-muted italic">Dars yo'q</p>
              ) : (
                <div className="space-y-3">
                  {scheduleByDay[day.key].sort((a,b) => a.time.localeCompare(b.time)).map((slot, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-border bg-bg-base">
                      <div>
                        <p className="font-semibold text-text-primary">{slot.time}</p>
                        <p className="text-xs text-text-secondary">{slot.type === 'theory' ? 'Nazariya' : 'Amaliyot'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-accent">{slot.groupName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};

export default MySchedule;
