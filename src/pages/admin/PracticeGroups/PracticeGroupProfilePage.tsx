import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { Student, PracticeGroup, Group } from '../../../types';
import { IconArrowLeft, IconUsers, IconWallet, IconTrash, IconEdit, IconArchive, IconFileSpreadsheet, IconUserPlus } from '@tabler/icons-react';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '../../../utils/formatCurrency';
import * as XLSX from 'xlsx';
import { useConfirm } from '../../../hooks/useConfirm';

export const PracticeGroupProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<PracticeGroup | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [instructorPrice, setInstructorPrice] = useState(0);

  // Mass assignment states
  const [isMassAssignModalOpen, setIsMassAssignModalOpen] = useState(false);
  const [ConfirmDialog, confirm] = useConfirm();
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [allTheoryGroups, setAllTheoryGroups] = useState<Group[]>([]);
  const [selectedTheoryGroup, setSelectedTheoryGroup] = useState<Group | { id: string, name: string } | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      const groups = await api.getPracticeGroups();
      const currentGroup = groups.find(g => g.id === id);
      if (currentGroup) {
        setGroup(currentGroup);
        
        // Find instructor price
        const users = await api.getUsers();
        const inst = users.find(u => u.id === currentGroup.instructorId);
        if (inst) {
          setInstructorPrice(inst.studentPrice || 0);
        }
      }

      const all = await api.getStudents();
      setAllStudents(all);
      setStudents(all.filter(s => s.practiceGroupId === id));
      
      const tGroups = await api.getGroups();
      setAllTheoryGroups(tGroups);
      
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!group) return;
    if (await confirm("Guruhni butunlay o'chirishga ishonchingiz komilmi? Guruhdagi barcha o'quvchilar guruhsiz bo'lib qoladi.")) {
      try {
        await api.deletePracticeGroup(group.id);
        navigate(-1);
      } catch (e: any) {
        alert(`O'chirishda xatolik: ${e.response?.data?.error || e.message}`);
      }
    }
  };

  const handleArchive = async () => {
    if (!group) return;
    if (await confirm("Guruhni yakunlab, barcha o'quvchilarni arxivga o'tkazmoqchimisiz?")) {
      try {
        await api.updatePracticeGroup(group.id, { status: 'completed' });
        for (const s of students) {
          await api.updateStudent(s.id, { practiceStatus: 'completed' });
        }
        navigate(-1);
      } catch (e) {
        alert("Arxivlashda xatolik yuz berdi");
      }
    }
  };

  const handleEditName = async () => {
    if (!group) return;
    const newName = prompt("Yangi guruh nomini kiriting:", group.name);
    if (newName && newName.trim() && newName !== group.name) {
      try {
        await api.updatePracticeGroup(group.id, { name: newName.trim() });
        loadData();
      } catch (e) {
        alert("Guruh nomini o'zgartirishda xatolik yuz berdi");
      }
    }
  };

  const handleExportExcel = () => {
    if (!group) return;
    const data = students.map((s, index) => ({
      "№": index + 1,
      "F.I.O": `${s.lastName || ''} ${s.firstName || ''}`,
      "Telefon": s.phone,
      "Holat": s.status === 'active' ? 'Faol' : 'Arxiv',
      "Asosiy Guruh": allTheoryGroups.find(g => g.id === s.groupId)?.name || 'Guruhsiz'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "O'quvchilar");
    XLSX.writeFile(workbook, `${group.name}_oquvchilar.xlsx`);
  };

  const availableStudentsForMassAssign = useMemo(() => {
    if (!group || !selectedTheoryGroup) return [];
    return allStudents.filter(s => {
      // Check if student belongs to the selected theory group
      if (selectedTheoryGroup.id === 'unassigned') {
        if (s.groupId) return false;
      } else {
        if (s.groupId !== selectedTheoryGroup.id) return false;
      }

      const isEligible = !s.practiceGroupId;
      const searchTerm = studentSearchTerm.toLowerCase();
      const matchSearch = (s.firstName || '').toLowerCase().includes(searchTerm) || 
                          (s.lastName || '').toLowerCase().includes(searchTerm);
      
      return isEligible && matchSearch;
    });
  }, [allStudents, group, selectedTheoryGroup, studentSearchTerm]);

  const handleMassAssignSubmit = async () => {
    if (!group || selectedStudentIds.length === 0) return;
    try {
      for (const studentId of selectedStudentIds) {
        await api.updateStudent(studentId, {
          instructorId: group.instructorId,
          practiceGroupId: group.id,
          practiceStatus: 'waiting'
        });
      }
      setIsMassAssignModalOpen(false);
      setSelectedStudentIds([]);
      setStudentSearchTerm('');
      loadData();
    } catch (e: any) {
      console.error(e);
      alert(`O'quvchilarni qo'shishda xatolik: ${e.response?.data?.error || e.message}`);
    }
  };

  if (!group) return <div className="p-8 text-center">Yuklanmoqda...</div>;

  const totalIncome = students.length * instructorPrice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-bg-card border border-border rounded-xl text-text-secondary hover:text-text-primary transition-colors">
          <IconArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Guruh profili</h1>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <IconUsers size={24} />
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Guruh nomi</p>
              <h2 className="text-xl font-bold text-text-primary">{group.name}</h2>
            </div>
          </div>
        </div>
        <div className="bg-bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <IconUsers size={24} />
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">O'quvchilar soni</p>
              <h2 className="text-xl font-bold text-text-primary">{students.length} ta</h2>
            </div>
          </div>
        </div>
        <div className="bg-bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <IconWallet size={24} />
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Jami daromad</p>
              <h2 className="text-xl font-bold text-text-primary">{formatCurrency(totalIncome)}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {group.status === 'active' && (
          <Button 
            className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border-transparent"
            onClick={() => setIsMassAssignModalOpen(true)}
          >
            <IconUserPlus size={18} className="mr-2" /> O'quvchi qo'shish
          </Button>
        )}
        <Button variant="outline" onClick={handleExportExcel} className="border-blue-500/20 text-blue-500 hover:bg-blue-500/10">
          <IconFileSpreadsheet size={18} className="mr-2" /> Excel yuklab olish
        </Button>
        <Button variant="outline" onClick={handleEditName}>
          <IconEdit size={18} className="mr-2" /> Tahrirlash
        </Button>
        {group.status === 'active' && (
          <Button variant="outline" onClick={handleArchive} className="border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10">
            <IconArchive size={18} className="mr-2" /> Arxivlash
          </Button>
        )}
        <Button variant="outline" onClick={handleDelete} className="border-red-500/20 text-red-500 hover:bg-red-500/10">
          <IconTrash size={18} className="mr-2" /> O'chirish
        </Button>
      </div>

      {/* Students Table */}
      <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-bg-base/50">
              <tr>
                <th className="py-3 px-4 font-medium text-text-secondary">F.I.O</th>
                <th className="py-3 px-4 font-medium text-text-secondary">Telefon</th>
                <th className="py-3 px-4 font-medium text-text-secondary">Asosiy Guruh</th>
                <th className="py-3 px-4 font-medium text-text-secondary text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-text-secondary">O'quvchilar yo'q</td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student.id} className="hover:bg-bg-base/50 transition-colors border-b border-border/50 last:border-0">
                    <td className="py-3 px-4 text-text-primary">{student.lastName || ''} {student.firstName || ''}</td>
                    <td className="py-3 px-4 text-text-secondary">{student.phone}</td>
                    <td className="py-3 px-4 text-text-secondary">
                      <span className="px-2 py-1 bg-accent/10 text-accent rounded-lg text-sm">
                        {allTheoryGroups.find(g => g.id === student.groupId)?.name || 'Guruhsiz'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button size="sm" variant="outline" onClick={async () => {
                        if(await confirm("Ushbu o'quvchini guruhdan chiqarmoqchimisiz?")) {
                          try {
                            await api.updateStudent(student.id, { practiceGroupId: undefined, practiceStatus: 'not_started' });
                            loadData();
                          } catch (e) {
                            alert("Xatolik yuz berdi");
                          }
                        }
                      }}>
                        Guruhdan chiqarish
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mass Assign Modal */}
      {isMassAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border/50 rounded-2xl p-6 w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center gap-3 mb-2">
              {selectedTheoryGroup && (
                <button onClick={() => setSelectedTheoryGroup(null)} className="p-1 hover:bg-bg-base rounded-lg transition-colors">
                  <IconArrowLeft size={20} className="text-text-secondary" />
                </button>
              )}
              <h3 className="text-xl font-bold text-text-primary">
                O'quvchi qo'shish - {group.name}
              </h3>
            </div>
            
            {!selectedTheoryGroup ? (
              <>
                <p className="text-sm text-text-secondary mb-4">
                  O'quvchilarni qo'shish uchun avval ularning asosiy (nazariy) guruhini tanlang:
                </p>
                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {[...allTheoryGroups, { id: 'unassigned', name: 'Guruhsiz o\'quvchilar' }].map(tGroup => {
                    // Count available students for this group
                    const count = allStudents.filter(s => {
                      if (tGroup.id === 'unassigned') {
                        if (s.groupId) return false;
                      } else {
                        if (s.groupId !== tGroup.id) return false;
                      }
                      const isEligible = !s.practiceGroupId;
                      return isEligible;
                    }).length;

                    return (
                      <div 
                        key={tGroup.id}
                        onClick={() => setSelectedTheoryGroup(tGroup as Group)}
                        className="p-4 border border-border/50 rounded-xl hover:border-accent hover:bg-accent/5 cursor-pointer transition-all flex justify-between items-center"
                      >
                        <span className="font-medium text-text-primary">{tGroup.name}</span>
                        <span className="px-2 py-1 bg-bg-base rounded-md text-xs font-bold text-text-secondary">
                          {count} ta
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end pt-4 border-t border-border/50">
                  <Button variant="outline" onClick={() => setIsMassAssignModalOpen(false)}>
                    Yopish
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-text-secondary mb-4">
                  <b>{selectedTheoryGroup.name}</b> guruhidagi bo'sh o'quvchilar ko'rsatilmoqda.
                </p>
                
                <input
                  type="text"
                  placeholder="Ism, familiya orqali qidirish..."
                  className="w-full px-4 py-2 bg-bg-base border border-border/50 rounded-xl text-text-primary focus:outline-none focus:border-accent mb-4"
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                />

                <div className="flex-1 overflow-y-auto mb-4 border border-border/50 rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-bg-base sticky top-0">
                      <tr>
                        <th className="p-3 w-10">
                          <input 
                            type="checkbox"
                            className="rounded border-border/50 text-accent focus:ring-accent"
                            checked={selectedStudentIds.length === availableStudentsForMassAssign.length && availableStudentsForMassAssign.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds(availableStudentsForMassAssign.map(s => s.id));
                              } else {
                                setSelectedStudentIds([]);
                              }
                            }}
                          />
                        </th>
                        <th className="p-3 font-medium text-text-secondary">F.I.O</th>
                        <th className="p-3 font-medium text-text-secondary">Telefon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {availableStudentsForMassAssign.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-text-secondary">
                            Mos o'quvchilar topilmadi
                          </td>
                        </tr>
                      ) : (
                        availableStudentsForMassAssign.map(s => (
                          <tr key={s.id} className="hover:bg-bg-base/50 transition-colors">
                            <td className="p-3">
                              <input 
                                type="checkbox"
                                className="rounded border-border/50 text-accent focus:ring-accent"
                                checked={selectedStudentIds.includes(s.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentIds(prev => [...prev, s.id]);
                                  } else {
                                    setSelectedStudentIds(prev => prev.filter(id => id !== s.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="p-3 text-text-primary">{s.lastName || ''} {s.firstName || ''}</td>
                            <td className="p-3 text-text-secondary">{s.phone}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border/50">
                  <span className="text-sm font-medium text-text-secondary">
                    Tanlandi: {selectedStudentIds.length} ta
                  </span>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsMassAssignModalOpen(false)}>
                      Bekor qilish
                    </Button>
                    <Button onClick={handleMassAssignSubmit} disabled={selectedStudentIds.length === 0}>
                      Saqlash
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
};
