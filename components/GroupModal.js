import { useState, useEffect } from 'react';
import { X, Users, Trash2, Edit2, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClassGroup, updateClassGroup, deleteClassGroup, getGroupsByTeacher, assignUserToGroup, getClassStudents } from '../firebase/db';

export default function GroupModal({ isOpen, onClose, teacherId, onSuccess }) {
  const [mode, setMode] = useState('list');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [groupName, setGroupName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);
  
  const [editingGroup, setEditingGroup] = useState(null);
  
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (isOpen && teacherId) {
      loadGroups();
    }
  }, [isOpen, teacherId]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const teacherGroups = await getGroupsByTeacher(teacherId);
      setGroups(teacherGroups || []);
    } catch (err) {
      console.error('Error loading groups:', err);
      setError('Klarte ikke laste grupper');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    const { getTeacherClasses } = await import('../firebase/db');
    try {
      const teacherClasses = await getTeacherClasses(teacherId);
      setClasses(teacherClasses || []);
      if (teacherClasses && teacherClasses.length > 0) {
        setSelectedClass(teacherClasses[0].id);
      }
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const loadClassStudents = async (classId, groupId) => {
    try {
      const students = await getClassStudents(classId);
      setClassStudents(students || []);
    } catch (err) {
      console.error('Error loading students:', err);
      setClassStudents([]);
    }
  };

  const handleOpenCreate = () => {
    loadClasses();
    setGroupName('');
    setError('');
    setMode('create');
  };

  const handleOpenEdit = (group) => {
    setEditingGroup(group);
    setGroupName(group.groupName);
    setError('');
    setMode('edit');
  };

  const handleOpenMembers = async (group) => {
    setSelectedGroup(group);
    await loadClassStudents(group.classId, group.id);
    setMode('members');
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return setError('Skriv inn gruppenavn');
    if (!selectedClass) return setError('Velg en klasse');
    
    const selectedClassData = classes.find(c => c.id === selectedClass);
    if (!selectedClassData) return setError('Klarte ikke finne valgt klasse');
    
    setSaving(true);
    setError('');
    try {
      await createClassGroup({
        groupName: groupName.trim(),
        classId: selectedClass,
        className: selectedClassData.name,
        createdBy: teacherId,
      });
      toast.success('Gruppe opprettet!');
      loadGroups();
      setMode('list');
      onSuccess?.();
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Klarte ikke opprette gruppe');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!groupName.trim()) return setError('Skriv inn gruppenavn');
    if (!editingGroup) return;
    
    setSaving(true);
    setError('');
    try {
      await updateClassGroup(editingGroup.id, { groupName: groupName.trim() });
      toast.success('Gruppe oppdatert!');
      loadGroups();
      setMode('list');
      setEditingGroup(null);
      onSuccess?.();
    } catch (err) {
      console.error('Error updating group:', err);
      setError('Klarte ikke oppdatere gruppe');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (group) => {
    if (!confirm(`Er du sikker på at du vil slette ${group.groupName}?`)) return;
    
    setSaving(true);
    try {
      await deleteClassGroup(group.id);
      toast.success('Gruppe slettet!');
      loadGroups();
      onSuccess?.();
    } catch (err) {
      console.error('Error deleting group:', err);
      toast.error('Klarte ikke slette gruppe');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignStudent = async (student, assign) => {
    setAssigning(true);
    try {
      if (assign) {
        await assignUserToGroup(student.uid, selectedGroup.id, selectedGroup.groupName);
        toast.success(`${student.name} lagt til i gruppen`);
      } else {
        await assignUserToGroup(student.uid, null, null);
        toast.success(`${student.name} fjernet fra gruppen`);
      }
      await loadClassStudents(selectedGroup.classId, selectedGroup.id);
      loadGroups();
      onSuccess?.();
    } catch (err) {
      console.error('Error assigning student:', err);
      toast.error('Klarte ikke tildele elev');
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bio-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-700 text-white text-xl">
            {mode === 'list' && 'Grupper'}
            {mode === 'create' && 'Opprett gruppe'}
            {mode === 'edit' && 'Rediger gruppe'}
            {mode === 'members' && `Medlemmer - ${selectedGroup?.groupName}`}
          </h2>
          <button onClick={() => { setMode('list'); onClose(); }} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {mode === 'list' && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} />
                Opprett gruppe
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="text-bio-400 animate-spin" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users size={48} className="mx-auto mb-4 text-slate-600" />
                <p>Ingen grupper ennå</p>
                <p className="text-sm mt-1">Opprett din første gruppe</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map(group => (
                  <div key={group.id} className="p-4 rounded-xl bg-white/4 border border-white/8 flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-body font-500">{group.groupName}</h3>
                      <p className="text-slate-500 text-sm">{group.className}</p>
                      <div className="flex gap-4 mt-2 text-xs text-slate-400">
                        <span>{group.memberCount || 0} medlemmer</span>
                        <span>{group.binCount || 0} bøtter</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenMembers(group)}
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-bio-400 hover:bg-bio-500/10 transition-all"
                        title="Medlemmer"
                      >
                        <Users size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(group)}
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        title="Rediger"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(group)}
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Slett"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm font-body font-500 block mb-2">Gruppenavn</label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="F.eks. Arbeidsgruppe 1"
                className="bio-input"
                autoFocus
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-body font-500 block mb-2">Tilknyttet klasse</label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="bio-input"
              >
                <option value="">Velg klasse</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setMode('list')} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors font-body">
                Avbryt
              </button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={16} /> Opprett</>}
              </button>
            </div>
          </div>
        )}

        {mode === 'edit' && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm font-body font-500 block mb-2">Gruppenavn</label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="bio-input"
                autoFocus
              />
            </div>
            <div>
              <label className="text-slate-500 text-sm font-body">Klasse</label>
              <p className="text-white">{editingGroup?.className}</p>
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setMode('list')} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors font-body">
                Avbryt
              </button>
              <button onClick={handleUpdate} disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={16} /> Lagre</>}
              </button>
            </div>
          </div>
        )}

        {mode === 'members' && selectedGroup && (
          <>
            <div className="mb-4 p-3 rounded-xl bg-bio-500/10 border border-bio-500/20">
              <p className="text-bio-300 text-sm">
                {classStudents.filter(s => s.groupId === selectedGroup.id).length} av {classStudents.length} elever er i denne gruppen
              </p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {classStudents.map(student => (
                <div key={student.uid} className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bio-600 to-moss-700 flex items-center justify-center text-white font-display font-600 text-sm">
                      {student.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-white text-sm font-body">{student.name}</p>
                      <p className="text-slate-500 text-xs">
                        {student.groupId === selectedGroup.id ? (
                          <span className="text-bio-400">I gruppen</span>
                        ) : (
                          <span>Ikke i gruppe</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssignStudent(student, student.groupId !== selectedGroup.id)}
                    disabled={assigning}
                    className={`px-3 py-1.5 rounded-lg text-sm font-body transition-all ${
                      student.groupId === selectedGroup.id
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-bio-500/20 text-bio-400 hover:bg-bio-500/30'
                    }`}
                  >
                    {student.groupId === selectedGroup.id ? 'Fjern' : 'Legg til'}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setMode('list')} className="w-full mt-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors font-body">
              Tilbake til grupper
            </button>
          </>
        )}
      </div>
    </div>
  );
}