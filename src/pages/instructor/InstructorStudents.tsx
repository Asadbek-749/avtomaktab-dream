import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Student } from '../../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

export const InstructorStudents = () => {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const allStudents = await api.getStudents();
      setStudents(allStudents.filter(s => s.instructorId === user?.id));
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">Faol</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">Tugatgan</span>;
      case 'stopped':
        return <span className="px-2 py-1 bg-danger/10 text-danger text-xs rounded-full">To'xtatilgan</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Mening O'quvchilarim</h1>
        <p className="text-text-muted">Menga biriktirilgan o'quvchilar ro'yxati</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Barcha o'quvchilar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ism va familiya</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Amaliyot soati</TableHead>
                <TableHead>Holati</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-text-muted">O'quvchilar topilmadi</TableCell>
                </TableRow>
              ) : (
                students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{student.drivingHoursDone || 0}</span> / {student.drivingHoursRequired || 20} soat
                        <div className="w-24 h-2 bg-bg-hover rounded-full overflow-hidden ml-2">
                          <div 
                            className="h-full bg-accent transition-all" 
                            style={{ width: `${Math.min(((student.drivingHoursDone || 0) / (student.drivingHoursRequired || 20)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
