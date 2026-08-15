import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { IconDownload } from '@tabler/icons-react';
import { exportToExcel } from '../../utils/exportExcel';
import { Student, Group, User, Branch } from '../../types';

interface DataListModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'students' | 'groups' | 'employees' | null;
  students: Student[];
  groups: Group[];
  employees: User[];
  branches: Branch[];
}

export const DataListModal: React.FC<DataListModalProps> = ({
  isOpen, onClose, type, students, groups, employees, branches
}) => {
  if (!isOpen || !type) return null;

  const handleExport = () => {
    if (type === 'students') {
      exportToExcel({
        data: students.map(s => ({
          'F.I.O': `${s.firstName} ${s.lastName}`,
          'Telefon': s.phone,
          'Guruh': groups.find(g => g.id === s.groupId)?.name || 'Noma\'lum',
          'Filial': branches.find(b => b.id === s.branchId)?.name || 'Noma\'lum',
          'Holati': s.status === 'active' ? 'Faol' : s.status === 'completed' ? 'Tugatgan' : 'To\'xtatilgan',
          'Qarz': (s.coursePrice - s.paidAmount) > 0 ? (s.coursePrice - s.paidAmount) : 0
        })),
        columns: [
          { header: 'F.I.O', key: 'F.I.O' },
          { header: 'Telefon', key: 'Telefon' },
          { header: 'Guruh', key: 'Guruh' },
          { header: 'Filial', key: 'Filial' },
          { header: 'Holati', key: 'Holati' },
          { header: 'Qarz', key: 'Qarz' }
        ],
        fileName: 'Oquvchilar_Royxati'
      });
    } else if (type === 'groups') {
      exportToExcel({
        data: groups.map(g => ({
          'Guruh nomi': g.name,
          'O\'qituvchi': employees.find(u => u.id === g.teacherId)?.name || 'Noma\'lum',
          'O\'quvchilar soni': students.filter(s => s.groupId === g.id).length,
          'Filial': branches.find(b => b.id === g.branchId)?.name || 'Noma\'lum',
          'Holati': g.status === 'active' ? 'Faol' : 'Tugatgan'
        })),
        columns: [
          { header: 'Guruh nomi', key: 'Guruh nomi' },
          { header: 'O\'qituvchi', key: 'O\'qituvchi' },
          { header: 'O\'quvchilar soni', key: 'O\'quvchilar soni' },
          { header: 'Filial', key: 'Filial' },
          { header: 'Holati', key: 'Holati' }
        ],
        fileName: 'Guruhlar_Royxati'
      });
    } else if (type === 'employees') {
      exportToExcel({
        data: employees.map(e => ({
          'F.I.O': e.name,
          'Telefon': e.phone,
          'Rol': e.role === 'admin' ? 'Admin' : 'O\'qituvchi',
          'Filial': branches.find(b => b.id === e.branchId)?.name || 'Biriktirilmagan'
        })),
        columns: [
          { header: 'F.I.O', key: 'F.I.O' },
          { header: 'Telefon', key: 'Telefon' },
          { header: 'Rol', key: 'Rol' },
          { header: 'Filial', key: 'Filial' }
        ],
        fileName: 'Xodimlar_Royxati'
      });
    }
  };

  const getTitle = () => {
    if (type === 'students') return 'O\'quvchilar ro\'yxati';
    if (type === 'groups') return 'Guruhlar ro\'yxati';
    if (type === 'employees') return 'Xodimlar ro\'yxati';
    return '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="xl">
      <div className="flex justify-end mb-4">
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <IconDownload size={18} /> Eksport (Excel)
        </Button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto pr-2">
        <Table>
          <TableHeader>
            <TableRow>
              {type === 'students' && (
                <>
                  <TableHead>F.I.O</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Guruh</TableHead>
                  <TableHead>Filial</TableHead>
                </>
              )}
              {type === 'groups' && (
                <>
                  <TableHead>Guruh nomi</TableHead>
                  <TableHead>O'qituvchi</TableHead>
                  <TableHead>O'quvchilar</TableHead>
                  <TableHead>Filial</TableHead>
                </>
              )}
              {type === 'employees' && (
                <>
                  <TableHead>F.I.O</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Filial</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {type === 'students' && students.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center">Ma'lumot topilmadi</TableCell></TableRow>
            )}
            {type === 'students' && students.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
                <TableCell>{s.phone}</TableCell>
                <TableCell>{groups.find(g => g.id === s.groupId)?.name || '-'}</TableCell>
                <TableCell>{branches.find(b => b.id === s.branchId)?.name || '-'}</TableCell>
              </TableRow>
            ))}

            {type === 'groups' && groups.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center">Ma'lumot topilmadi</TableCell></TableRow>
            )}
            {type === 'groups' && groups.map(g => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell>{employees.find(u => u.id === g.teacherId)?.name || '-'}</TableCell>
                <TableCell>{students.filter(s => s.groupId === g.id).length} ta</TableCell>
                <TableCell>{branches.find(b => b.id === g.branchId)?.name || '-'}</TableCell>
              </TableRow>
            ))}

            {type === 'employees' && employees.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center">Ma'lumot topilmadi</TableCell></TableRow>
            )}
            {type === 'employees' && employees.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell>{e.phone}</TableCell>
                <TableCell className="capitalize">{e.role}</TableCell>
                <TableCell>{branches.find(b => b.id === e.branchId)?.name || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Modal>
  );
};
