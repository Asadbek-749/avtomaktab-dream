import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { IconBook, IconCalendarEvent, IconUsers } from '@tabler/icons-react';
import { StatCard } from '../../components/ui/StatCard';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';

export const TeacherDashboard = () => {
  const user = useAuthStore(state => state.user);
  const { groups, fetchGroups } = useGroupStore();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const myGroups = groups.filter(g => g.teacherId === user?.id);
  const totalStudents = myGroups.reduce((acc, g) => acc + (g.studentIds || []).length, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Xush kelibsiz, {user?.name}!</h2>
        <p className="text-text-muted">Sizning darslaringiz va o'quvchilaringiz statistikasi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Mening guruhlarim"
          value={myGroups.length}
          icon={IconBook}
        />
        <StatCard
          title="Jami O'quvchilar"
          value={totalStudents}
          icon={IconUsers}
        />
        <StatCard
          title="Bugungi darslar"
          value={1}
          icon={IconCalendarEvent}
        />
      </div>
      
      {/* Teacher specific quick actions could go here */}
    </motion.div>
  );
};

export default TeacherDashboard;
