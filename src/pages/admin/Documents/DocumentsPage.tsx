import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IconFileX, IconCheck, IconFileCheck } from '@tabler/icons-react';
import { useStudentStore } from '../../../store/studentStore';
import { useGroupStore } from '../../../store/groupStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';

export const DocumentsPage = () => {
  const { students, fetchStudents } = useStudentStore();
  const { groups, fetchGroups } = useGroupStore();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchStudents();
    fetchGroups();
  }, [fetchStudents, fetchGroups]);

  const activeStudents = students.filter(s => s.status === 'active');

  const missingDocsList = activeStudents.map(student => {
    const docs = student.providedDocuments || { photo: false, form083: false, passport: false };
    
    return {
      ...student,
      hasPhoto: docs.photo,
      hasForm083: docs.form083,
      hasPassport: docs.passport,
      isMissing: !docs.photo || !docs.form083 || !docs.passport
    };
  }).filter(s => s.isMissing && (selectedGroupId === 'all' || s.groupId === selectedGroupId));

  const itemsPerPage = 10;
  const totalPages = Math.ceil(missingDocsList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = missingDocsList.slice(startIndex, startIndex + itemsPerPage);

  const getGroupName = (id: string) => {
    const group = groups.find(g => g.id === id);
    return group ? group.name : 'Biriktirilmagan';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Hujjatlar Nazorati</h2>
          <p className="text-text-muted">Guruhlardagi hujjat topshirmagan o'quvchilar</p>
        </div>
        <div className="w-full sm:w-64">
          <select
            value={selectedGroupId}
            onChange={(e) => {
              setSelectedGroupId(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-bg-base border-2 border-border rounded-xl px-4 py-2 text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
          >
            <option value="all">Barcha guruhlar</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="border-danger/20 bg-danger/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger">
              <IconFileX size={20} />
              Muammoli O'quvchilar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="text-4xl font-bold text-danger">
              {missingDocsList.length}
            </div>
            <p className="text-sm text-danger/80 max-w-3xl">
              Ushbu o'quvchilardan 3x4 rasm, pasport nusxasi yoki 083/h ma'lumotnomasi talab qilinadi. Barcha hujjatlari to'liq bo'lsa, bu ro'yxatdan o'chib ketadi.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ro'yxat {selectedGroupId !== 'all' && `(${getGroupName(selectedGroupId)})`}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0 sm:p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>O'quvchi</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Guruh</TableHead>
                  <TableHead className="text-center">3x4 Rasm</TableHead>
                  <TableHead className="text-center">083/h (Tibbiy)</TableHead>
                  <TableHead className="text-center">Pasport (Nusxa)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-text-muted flex flex-col items-center justify-center">
                      <IconFileCheck size={48} className="text-success mb-2 opacity-50" />
                      Barcha o'quvchilarning hujjatlari joyida (To'liq topshirilgan)!
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((student, i) => (
                    <TableRow key={student.id} transition={{ delay: i * 0.05 }}>
                      <TableCell className="font-medium text-text-primary">{student.firstName} {student.lastName}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>{getGroupName(student.groupId)}</TableCell>
                      <TableCell className="text-center">
                        {student.hasPhoto ? (
                          <span className="inline-flex items-center justify-center bg-success/10 text-success p-1 rounded-md"><IconCheck size={18} /></span>
                        ) : (
                          <span className="inline-flex items-center justify-center bg-danger/10 text-danger p-1 rounded-md"><IconFileX size={18} /></span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.hasForm083 ? (
                          <span className="inline-flex items-center justify-center bg-success/10 text-success p-1 rounded-md"><IconCheck size={18} /></span>
                        ) : (
                          <span className="inline-flex items-center justify-center bg-danger/10 text-danger p-1 rounded-md"><IconFileX size={18} /></span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.hasPassport ? (
                          <span className="inline-flex items-center justify-center bg-success/10 text-success p-1 rounded-md"><IconCheck size={18} /></span>
                        ) : (
                          <span className="inline-flex items-center justify-center bg-danger/10 text-danger p-1 rounded-md"><IconFileX size={18} /></span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-border">
                <p className="text-sm text-text-muted">
                  Jami {missingDocsList.length} ta o'quvchidan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, missingDocsList.length)}
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Oldingi
                  </Button>
                  <span className="text-sm text-text-primary px-2 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Keyingi
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default DocumentsPage;
