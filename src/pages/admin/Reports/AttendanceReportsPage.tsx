import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGroupStore } from '../../../store/groupStore';
import { useStudentStore } from '../../../store/studentStore';
import { useAttendanceStore } from '../../../store/attendanceStore';
import { useAuthStore } from '../../../store/authStore';
import { useBranchStore } from '../../../store/branchStore';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { IconCheck, IconX, IconClipboardCheck, IconSearch, IconUsers, IconCalendarEvent, IconChartPie } from '@tabler/icons-react';
import { cn } from '../../../components/ui/Button';

export const AttendanceReportsPage = () => {
  const { groups, fetchGroups } = useGroupStore();
  const { students, fetchStudents } = useStudentStore();
  const { attendances, fetchAttendances } = useAttendanceStore();
  const { activeBranchId } = useBranchStore();
  const user = useAuthStore(state => state.user);

  const [selectedGroup, setSelectedGroup] = useState<string>('');

  useEffect(() => {
    fetchGroups();
    fetchStudents();
    fetchAttendances();
  }, [fetchGroups, fetchStudents, fetchAttendances]);

  const displayBranchId = user?.role === 'superadmin' ? activeBranchId : user?.branchId;
  const filteredGroups = groups.filter(g => 
    g.status === 'active' && (!displayBranchId || g.branchId === displayBranchId)
  );

  const groupStudents = useMemo(() => students.filter(s => s.groupId === selectedGroup), [students, selectedGroup]);
  const groupAttendances = useMemo(() => attendances.filter(a => a.groupId === selectedGroup).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [attendances, selectedGroup]);

  // Calculations for stats
  const totalStudents = groupStudents.length;
  const totalClasses = groupAttendances.length;
  
  const avgAttendance = useMemo(() => {
    if (totalStudents === 0 || totalClasses === 0) return 0;
    let totalPresents = 0;
    groupAttendances.forEach(att => {
      att.records.forEach(rec => {
        if (groupStudents.find(s => s.id === rec.studentId) && rec.present) {
          totalPresents++;
        }
      });
    });
    return Math.round((totalPresents / (totalStudents * totalClasses)) * 100);
  }, [groupAttendances, groupStudents, totalClasses, totalStudents]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-border/50">
            <IconClipboardCheck size={26} stroke={2} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">Davomat Hisoboti</h2>
            <p className="text-text-muted mt-1 font-medium">Guruhlar bo'yicha to'liq davomat nazorati</p>
          </div>
        </div>

        <div className="w-full md:w-80 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
            <IconSearch size={18} stroke={2} />
          </div>
          <select 
            className="w-full bg-bg-card border border-border rounded-xl pl-10 pr-10 py-3 text-sm font-semibold text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer appearance-none shadow-sm"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="" className="bg-bg-card text-text-primary">Guruhni tanlang...</option>
            {filteredGroups.map(g => (
              <option key={g.id} value={g.id} className="bg-bg-card text-text-primary">{g.name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-text-muted">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      {!selectedGroup ? (
        <Card className="border-border shadow-sm bg-bg-card">
          <CardContent className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
              <IconSearch size={48} stroke={1.5} />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Guruh tanlanmagan</h3>
            <p className="text-text-secondary max-w-md">Davomat hisobotini ko'rish uchun yuqoridagi ro'yxatdan kerakli guruhni tanlang.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-border shadow-sm bg-bg-card hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-5 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-500/20">
                  <IconUsers size={28} stroke={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-muted tracking-wide uppercase">Jami O'quvchilar</p>
                  <p className="text-3xl font-black text-text-primary mt-0.5">{totalStudents} <span className="text-lg font-medium text-text-muted lowercase">ta</span></p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-bg-card hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-5 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                  <IconCalendarEvent size={28} stroke={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-muted tracking-wide uppercase">Jami Darslar</p>
                  <p className="text-3xl font-black text-text-primary mt-0.5">{totalClasses} <span className="text-lg font-medium text-text-muted lowercase">ta</span></p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-bg-card hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-5 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm border border-amber-100 dark:border-amber-500/20">
                  <IconChartPie size={28} stroke={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-muted tracking-wide uppercase">O'rtacha Davomat</p>
                  <p className="text-3xl font-black text-text-primary mt-0.5">{avgAttendance}<span className="text-xl font-bold text-text-muted">%</span></p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border shadow-sm bg-bg-card overflow-hidden">
            <CardContent className="p-0">
              {groupStudents.length === 0 ? (
                <div className="p-12 text-center text-text-muted flex flex-col items-center">
                  <IconUsers size={48} className="mb-4 opacity-50 text-indigo-400" />
                  <p className="font-medium text-lg">Bu guruhda o'quvchilar yo'q.</p>
                </div>
              ) : groupAttendances.length === 0 ? (
                <div className="p-12 text-center text-text-muted flex flex-col items-center">
                  <IconCalendarEvent size={48} className="mb-4 opacity-50 text-indigo-400" />
                  <p className="font-medium text-lg">Bu guruh uchun hali davomat qilinmagan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-bg-hover">
                      <TableRow>
                        <TableHead className="min-w-[250px] sticky left-0 bg-bg-hover z-10 shadow-[1px_0_0_0_var(--border)] font-bold text-text-primary text-sm uppercase tracking-wider">Ism Familiya</TableHead>
                        {groupAttendances.map(att => (
                          <TableHead key={att.id} className="text-center whitespace-nowrap px-4 text-xs font-bold uppercase tracking-wider text-text-secondary border-l border-border/50">
                            {new Date(att.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' })}
                          </TableHead>
                        ))}
                        <TableHead className="text-center font-bold text-text-primary uppercase tracking-wider text-sm border-l border-border/50">Qoldirgan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupStudents.map((student, idx) => {
                        let absentCount = 0;
                        return (
                          <TableRow key={student.id} className={cn(idx % 2 === 0 ? 'bg-transparent' : 'bg-bg-base/30')}>
                            <TableCell className="font-bold text-text-primary sticky left-0 z-10 shadow-[1px_0_0_0_var(--border)] bg-inherit">
                              {student.firstName} {student.lastName}
                            </TableCell>
                            {groupAttendances.map(att => {
                              const rec = att.records.find(r => r.studentId === student.id);
                              const isPresent = rec ? rec.present : true;
                              if (!isPresent) absentCount++;
                              return (
                                <TableCell key={att.id} className="text-center p-3 border-l border-border/50">
                                  {isPresent ? (
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                      <IconCheck size={16} stroke={3} />
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                      <IconX size={16} stroke={3} />
                                    </span>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center border-l border-border/50">
                              <span className={cn(
                                "inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-black min-w-[3rem]",
                                absentCount === 0 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                absentCount > 3 ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 shadow-sm ring-1 ring-rose-500/30" : 
                                "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              )}>
                                {absentCount > 0 ? absentCount : '0'}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
};

export default AttendanceReportsPage;
