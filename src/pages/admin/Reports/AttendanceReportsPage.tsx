import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGroupStore } from '../../../store/groupStore';
import { useStudentStore } from '../../../store/studentStore';
import { useAttendanceStore } from '../../../store/attendanceStore';
import { useAuthStore } from '../../../store/authStore';
import { useBranchStore } from '../../../store/branchStore';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { IconCheck, IconX } from '@tabler/icons-react';

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

  const groupStudents = students.filter(s => s.groupId === selectedGroup);
  const groupAttendances = attendances.filter(a => a.groupId === selectedGroup).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Davomat Hisoboti</h2>
        <p className="text-text-muted">Guruhlar bo'yicha to'liq davomat nazorati</p>
      </div>

      <div className="max-w-md">
        <label className="text-sm font-medium text-text-primary block mb-2">Guruhni tanlang</label>
        <select 
          className="w-full bg-bg-base border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent transition-colors"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">Guruhni tanlang...</option>
          {filteredGroups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {selectedGroup && (
        <Card>
          <CardContent className="p-0 overflow-hidden">
            {groupStudents.length === 0 ? (
              <div className="p-8 text-center text-text-muted">Bu guruhda o'quvchilar yo'q.</div>
            ) : groupAttendances.length === 0 ? (
              <div className="p-8 text-center text-text-muted">Bu guruh uchun hali davomat qilinmagan.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px] sticky left-0 bg-bg-hover z-10">Ism Familiya</TableHead>
                      {groupAttendances.map(att => (
                        <TableHead key={att.id} className="text-center whitespace-nowrap px-4">
                          {new Date(att.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' })}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-bold">Jami Qoldirgan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupStudents.map(student => {
                      let absentCount = 0;
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium sticky left-0 bg-bg-base z-10 border-r border-border">
                            {student.firstName} {student.lastName}
                          </TableCell>
                          {groupAttendances.map(att => {
                            const rec = att.records.find(r => r.studentId === student.id);
                            const isPresent = rec ? rec.present : true; // Default present if no record but attendance exists? Actually if no record, maybe didn't exist yet, assume absent or N/A. Let's assume false if no record explicitly found, but in our logic we saved all.
                            if (!isPresent) absentCount++;
                            return (
                              <TableCell key={att.id} className="text-center">
                                {isPresent ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/10 text-success"><IconCheck size={14}/></span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-danger/10 text-danger"><IconX size={14}/></span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-bold text-danger">
                            {absentCount > 0 ? absentCount : '-'}
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
      )}
    </motion.div>
  );
};

export default AttendanceReportsPage;
