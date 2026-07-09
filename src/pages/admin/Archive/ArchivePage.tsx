import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStudentStore } from '../../../store/studentStore';
import { useGroupStore } from '../../../store/groupStore';
import { useBranchStore } from '../../../store/branchStore';
import { useAuthStore } from '../../../store/authStore';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { IconArchive } from '@tabler/icons-react';

export const ArchivePage = () => {

  const { students, fetchStudents } = useStudentStore();
  const { groups, fetchGroups } = useGroupStore();
  const { activeBranchId } = useBranchStore();
  const user = useAuthStore(state => state.user);
  
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchGroups();
  }, [fetchStudents, fetchGroups]);

  const displayBranchId = user?.role === 'superadmin' ? activeBranchId : user?.branchId;

  const archivedGroups = groups.filter(g => 
    g.status === 'completed' && (!displayBranchId || g.branchId === displayBranchId)
  );

  const handleViewGroupStudents = (group: any) => {
    setSelectedGroup(group);
    setStudentsModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Arxiv</h2>
          <p className="text-text-muted">Tugatilgan guruhlar tarixi</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guruh Nomi</TableHead>
                <TableHead>Ochilgan sana</TableHead>
                <TableHead>Tugagan sana</TableHead>
                <TableHead>O'quvchilar soni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-text-muted">
                    <div className="flex flex-col items-center">
                      <IconArchive size={48} className="opacity-20 mb-2" />
                      Arxivlangan guruhlar yo'q
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                archivedGroups.map(group => (
                  <TableRow 
                    key={group.id} 
                    className="cursor-pointer hover:bg-bg-hover transition-colors"
                    onClick={() => handleViewGroupStudents(group)}
                  >
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{new Date(group.createdAt).toLocaleDateString('uz-UZ')}</TableCell>
                    <TableCell>{group.completedAt ? new Date(group.completedAt).toLocaleDateString('uz-UZ') : '-'}</TableCell>
                    <TableCell>{students.filter(s => s.groupId === group.id).length}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* O'quvchilar ro'yxati modali */}
      <Modal isOpen={studentsModalOpen} onClose={() => setStudentsModalOpen(false)} title={`${selectedGroup?.name || ''} o'quvchilari (Arxiv)`}>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {selectedGroup && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ism Familiya</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">To'langan summa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.filter(s => s.groupId === selectedGroup.id).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-text-muted">
                      Bu guruhda o'quvchilar yo'q
                    </TableCell>
                  </TableRow>
                ) : (
                  students.filter(s => s.groupId === selectedGroup.id).map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell className="text-right text-success font-medium">
                        {student.paidAmount.toLocaleString()} so'm
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setStudentsModalOpen(false)}>Yopish</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default ArchivePage;
