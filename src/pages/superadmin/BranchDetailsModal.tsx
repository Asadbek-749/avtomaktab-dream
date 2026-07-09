import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { useBranchStore } from '../../store/branchStore';
import { useStudentStore } from '../../store/studentStore';
import { useGroupStore } from '../../store/groupStore';
import { useUserStore } from '../../store/userStore';
import { useCashStore } from '../../store/cashStore';
import { IconUsers, IconSchool, IconWallet, IconIdBadge2, IconTrash } from '@tabler/icons-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Card, CardContent } from '../../components/ui/Card';
import { cn } from '../../components/ui/Button';

interface BranchDetailsModalProps {
  branchId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BranchDetailsModal = ({ branchId, isOpen, onClose }: BranchDetailsModalProps) => {

  const [activeTab, setActiveTab] = useState<'employees' | 'groups' | 'students' | 'finance'>('employees');
  
  const { branches, deleteBranch } = useBranchStore();
  const { students } = useStudentStore();
  const { groups } = useGroupStore();
  const { users } = useUserStore();
  const { reports: cashReports } = useCashStore();

  if (!branchId) return null;

  const branch = branches.find(b => b.id === branchId);
  if (!branch) return null;

  const branchStudents = students.filter(s => s.branchId === branchId);
  const branchGroups = groups.filter(g => g.branchId === branchId);
  const branchUsers = users.filter(u => u.branchId === branchId);
  const branchReports = cashReports.filter(r => r.branchId === branchId && r.status === 'approved');

  const totalPaid = branchStudents.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalDebt = branchStudents.reduce((acc, curr) => acc + Math.max(0, curr.coursePrice - curr.paidAmount), 0);
  const totalCashReported = branchReports.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const tabs = [
    { id: 'employees', label: 'Xodimlar', icon: IconIdBadge2, count: branchUsers.length },
    { id: 'groups', label: 'Guruhlar', icon: IconSchool, count: branchGroups.length },
    { id: 'students', label: "O'quvchilar", icon: IconUsers, count: branchStudents.length },
    { id: 'finance', label: 'Moliya', icon: IconWallet, count: undefined },
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${branch.name} - Batafsil ma'lumot`} size="5xl">
      <div className="flex flex-col h-full space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-bg-hover rounded-xl overflow-x-auto w-full">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0",
                  isActive 
                    ? "bg-bg-card shadow-sm text-accent" 
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-base/50"
                )}
              >
                <Icon size={18} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn(
                    "ml-1.5 px-2 py-0.5 rounded-full text-xs",
                    isActive ? "bg-accent/10" : "bg-border text-text-muted"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {activeTab === 'employees' && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>F.I.SH</TableHead>
                    <TableHead>Lavozimi</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-text-muted">Xodimlar topilmadi</TableCell></TableRow>
                  ) : (
                    branchUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded-md text-xs",
                            user.role === 'admin' ? "bg-accent/10 text-accent" : "bg-success/10 text-success"
                          )}>
                            {user.role === 'admin' ? 'Admin' : "O'qituvchi"}
                          </span>
                        </TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell className="text-text-muted">{user.login}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guruh nomi</TableHead>
                    <TableHead>O'qituvchi</TableHead>
                    <TableHead>O'quvchilar soni</TableHead>
                    <TableHead>Holati</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchGroups.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-text-muted">Guruhlar topilmadi</TableCell></TableRow>
                  ) : (
                    branchGroups.map(group => {
                      const teacher = branchUsers.find(u => u.id === group.teacherId);
                      const studentCount = branchStudents.filter(s => s.groupId === group.id).length;
                      return (
                        <TableRow key={group.id}>
                          <TableCell className="font-bold text-accent">{group.name}</TableCell>
                          <TableCell>{teacher?.name || "Noma'lum"}</TableCell>
                          <TableCell>{studentCount} ta</TableCell>
                          <TableCell>
                            <span className={cn(
                              "px-2 py-1 rounded-md text-xs",
                              group.status === 'active' ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                            )}>
                              {group.status === 'active' ? 'Faol' : 'Tugatilgan'}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>F.I.SH</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Guruh</TableHead>
                    <TableHead className="text-right">Qarzdorlik</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchStudents.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-text-muted">O'quvchilar topilmadi</TableCell></TableRow>
                  ) : (
                    branchStudents.map(student => {
                      const group = branchGroups.find(g => g.id === student.groupId);
                      const debt = Math.max(0, student.coursePrice - student.paidAmount);
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                          <TableCell>{student.phone}</TableCell>
                          <TableCell className="text-text-muted">{group?.name || "Noma'lum"}</TableCell>
                          <TableCell className={cn("text-right font-semibold", debt > 0 ? "text-danger" : "text-success")}>
                            {debt > 0 ? `${debt.toLocaleString()} so'm` : "Qarzi yo'q"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-sm text-text-secondary mb-2">Umumiy to'langan summa</h4>
                  <p className="text-2xl font-bold text-success">{totalPaid.toLocaleString()} so'm</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-sm text-text-secondary mb-2">Umumiy qarzdorlik</h4>
                  <p className="text-2xl font-bold text-danger">{totalDebt.toLocaleString()} so'm</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-sm text-text-secondary mb-2">Kassaga topshirilgan summa</h4>
                  <p className="text-2xl font-bold text-accent">{totalCashReported.toLocaleString()} so'm</p>
                  <p className="text-xs text-text-muted mt-1">(Tasdiqlangan hisobotlar bo'yicha)</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        {/* Actions */}
        <div className="pt-4 border-t border-border flex justify-end">
          <button
            onClick={() => {
              if(window.confirm("Rostdan ham ushbu filialni o'chirmoqchimisiz? Barcha tegishli ma'lumotlar o'chib ketishi mumkin.")) {
                deleteBranch(branch.id);
                onClose();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-lg transition-colors font-medium text-sm"
          >
            <IconTrash size={18} />
            Filialni o'chirish
          </button>
        </div>
      </div>
    </Modal>
  );
};
