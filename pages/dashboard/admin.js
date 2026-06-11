// pages/dashboard/admin.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/layout/Layout';
import { getAdminStats, deleteUser, deleteClass, deleteWasteLog, updateUser, updateClass, getAllSchools, createSchool, deleteSchool, getAllGroups, createGroup, deleteGroup, getAdmins, addAdmin, removeAdmin, getAllAdminUsers, addBonusPointsToUser, addBonusPointsToClass, resetUserPoints, resetClassPoints, resetAllPoints, resetAllWaste, deleteAllUsers, deleteAllClasses, getTeacherClasses } from '../../firebase/db';
import { doc, setDoc, db } from '../../firebase/config';
import { calculateEnergy, calculateCO2Saved } from '../../utils/calculator';
import { Shield, Users, GraduationCap, School, Leaf, Trash2, Edit2, X, Check, BarChart2, Plus, Building2, Copy, UsersRound, UserPlus, Gift, RotateCcw, Zap, Bomb, Skull, Crown, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingUser, setEditingUser] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [schools, setSchools] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [creatingSchool, setCreatingSchool] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSchool, setNewGroupSchool] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [bonusPointsAmount, setBonusPointsAmount] = useState(100);
  const [bonusPointsReason, setBonusPointsReason] = useState('');
  const [selectedUserForBonus, setSelectedUserForBonus] = useState('');
  const [selectedClassForBonus, setSelectedClassForBonus] = useState('');
  const [applyingBonus, setApplyingBonus] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'admin')) {
      router.push('/auth/login');
    }
  }, [user, userData, loading]);

  useEffect(() => {
    if (user && userData?.role === 'admin') {
      loadStats();
    }
  }, [user, userData]);

  const loadStats = async () => {
    try {
      const data = await getAdminStats();
      setStats(data || { totalUsers: 0, totalStudents: 0, totalTeachers: 0, totalClasses: 0, totalLogs: 0, totalWaste: 0, students: [], teachers: [], classes: [], logs: [] });
    } catch (err) {
      console.error('Error loading stats:', err);
      setStats({ totalUsers: 0, totalStudents: 0, totalTeachers: 0, totalClasses: 0, totalLogs: 0, totalWaste: 0, students: [], teachers: [], classes: [], logs: [] });
    }
  };

  const loadSchools = async () => {
    console.log('Loading schools...');
    try {
      const data = await getAllSchools();
      console.log('Schools loaded:', data);
      setSchools(data || []);
    } catch (err) {
      console.error('Error loading schools:', err);
      toast.error('Klarte ikke laste skoler');
    }
  };

  const loadGroups = async () => {
    console.log('Loading groups...');
    try {
      const [allGroups, allSchools] = await Promise.all([getAllGroups(), getAllSchools()]);
      console.log('Groups loaded:', allGroups);
      console.log('Schools loaded:', allSchools);
      setGroups(allGroups || []);
      setSchools(allSchools || []);
    } catch (err) {
      console.error('Error loading groups:', err);
      toast.error('Klarte ikke laste grupper');
    }
  };

  useEffect(() => {
    if (activeTab === 'skoler') {
      loadSchools();
    }
    if (activeTab === 'grupper') {
      loadGroups();
    }
    if (activeTab === 'admins') {
      loadAdmins();
    }
    if (activeTab === 'tools') {
      loadStats();
    }
  }, [activeTab]);

  const handleCreateSchool = async () => {
    if (!newSchoolName.trim()) return toast.error('Skriv inn skolenavn');
    setCreatingSchool(true);
    try {
      await createSchool({ name: newSchoolName });
      toast.success('Skole opprettet!');
      setNewSchoolName('');
      setShowSchoolModal(false);
      loadSchools();
    } catch (err) {
      toast.error('Klarte ikke opprette skole');
    } finally {
      setCreatingSchool(false);
    }
  };

  const handleDeleteSchool = async (schoolId) => {
    if (!confirm('Er du sikker på at du vil slette denne skolen? Alle tilknyttede klasser vil miste sin skoletilknytning.')) return;
    try {
      await deleteSchool(schoolId);
      toast.success('Skole slettet');
      loadSchools();
    } catch (err) {
      toast.error('Klarte ikke slette skole');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return toast.error('Skriv inn gruppenavn');
    if (!newGroupSchool) return toast.error('Velg en skole');
    setCreatingGroup(true);
    try {
      await createGroup({ name: newGroupName, schoolId: newGroupSchool });
      toast.success('Gruppe opprettet!');
      setNewGroupName('');
      setNewGroupSchool('');
      setShowGroupModal(false);
      loadGroups();
    } catch (err) {
      toast.error('Klarte ikke opprette gruppe');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Er du sikker på at du vil slette denne gruppen?')) return;
    try {
      await deleteGroup(groupId);
      toast.success('Gruppe slettet');
      loadGroups();
    } catch (err) {
      toast.error('Klarte ikke slette gruppe');
    }
  };

  const handleDeleteUser = async (uid) => {
    if (!confirm('Er du sikker på at du vil slette denne brukeren?')) return;
    try {
      await deleteUser(uid);
      toast.success('Bruker slettet');
      loadStats();
    } catch (err) {
      toast.error('Klarte ikke slette bruker');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!confirm('Er du sikker på at du vil slette denne klassen?')) return;
    try {
      await deleteClass(classId);
      toast.success('Klasse slettet');
      loadStats();
    } catch (err) {
      toast.error('Klarte ikke slette klasse');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm('Er du sikker på at du vil slette denne loggen?')) return;
    try {
      await deleteWasteLog(logId);
      toast.success('Logg slettet');
      loadStats();
    } catch (err) {
      toast.error('Klarte ikke slette logg');
    }
  };

  const handleSaveUser = async () => {
    try {
      await updateUser(editingUser.uid, editForm);
      toast.success('Bruker oppdatert');
      setEditingUser(null);
      loadStats();
    } catch (err) {
      toast.error('Klarte ikke oppdatere bruker');
    }
  };

  const handleSaveClass = async () => {
    try {
      await updateClass(editingClass.id, editForm);
      toast.success('Klasse oppdatert');
      setEditingClass(null);
      loadStats();
    } catch (err) {
      toast.error('Klarte ikke oppdatere klasse');
    }
  };

  const loadAdmins = async () => {
    try {
      const adminList = await getAllAdminUsers();
      setAdmins(adminList);
    } catch (err) {
      console.error('Error loading admins:', err);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) {
      return toast.error('Fyll inn e-post og passord');
    }
    setAddingAdmin(true);
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../../firebase/config');
      
      const userCredential = await createUserWithEmailAndPassword(auth, newAdminEmail, newAdminPassword);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        name: newAdminName || newAdminEmail.split('@')[0],
        email: newAdminEmail,
        role: 'admin',
        classId: null,
        points: 0,
        totalWaste: 0,
        badges: [],
        createdAt: new Date().toISOString(),
      });
      
      await addAdmin(user.uid, newAdminEmail, newAdminName || newAdminEmail.split('@')[0]);
      
      toast.success('Admin lagt til!');
      setShowAddAdminModal(false);
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminPassword('');
      loadAdmins();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error('E-posten er allerede i bruk');
      } else {
        toast.error('Kunne ikke legge til admin');
      }
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (uid) => {
    if (!confirm('Er du sikker på at du vil fjerne denne adminen?')) return;
    try {
      await removeAdmin(uid);
      toast.success('Admin fjernet');
      loadAdmins();
    } catch (err) {
      toast.error('Kunne ikke fjerne admin');
    }
  };

  const handleGiveBonusToUser = async () => {
    if (!selectedUserForBonus) return toast.error('Velg en bruker');
    if (!bonusPointsAmount || bonusPointsAmount <= 0) return toast.error('Skriv inn gyldig poengsum');
    
    setApplyingBonus(true);
    try {
      const user = stats?.students?.find(s => s.uid === selectedUserForBonus) || 
                   stats?.teachers?.find(t => t.uid === selectedUserForBonus);
      const reason = bonusPointsReason || 'Bonus fra admin';
      await addBonusPointsToUser(selectedUserForBonus, bonusPointsAmount, reason);
      toast.success(`+${bonusPointsAmount} poeng gitt til ${user?.name || 'bruker'}! ${reason}`);
      setBonusPointsAmount(100);
      setBonusPointsReason('');
      loadStats();
    } catch (err) {
      toast.error('Kunne ikke gi bonpoeng');
    } finally {
      setApplyingBonus(false);
    }
  };

  const handleGiveBonusToClass = async () => {
    if (!selectedClassForBonus) return toast.error('Velg en klasse');
    if (!bonusPointsAmount || bonusPointsAmount <= 0) return toast.error('Skriv inn gyldig poengsum');
    
    setApplyingBonus(true);
    try {
      const cls = stats?.classes?.find(c => c.id === selectedClassForBonus);
      const reason = bonusPointsReason || 'Bonus fra admin';
      const count = await addBonusPointsToClass(selectedClassForBonus, bonusPointsAmount, reason);
      toast.success(`${count} elever fikk +${bonusPointsAmount} poeng! ${reason}`);
      setBonusPointsAmount(100);
      setBonusPointsReason('');
      loadStats();
    } catch (err) {
      toast.error('Kunne ikke gi bonpoeng til klasse');
    } finally {
      setApplyingBonus(false);
    }
  };

  const handleResetUserPoints = async (userId) => {
    if (!confirm('Er du sikker? Poengene til denne brukeren vil bli nullstilt.')) return;
    try {
      await resetUserPoints(userId);
      toast.success('Poeng nullstilt!');
      loadStats();
    } catch (err) {
      toast.error('Kunne ikke nullstille poeng');
    }
  };

  const handleResetClassPoints = async (classId) => {
    if (!confirm('Er du sikker? Alle poeng i denne klassen vil bli nullstilt.')) return;
    try {
      const count = await resetClassPoints(classId);
      toast.success(`${count} elever sine poeng nullstilt!`);
      loadStats();
    } catch (err) {
      toast.error('Kunne ikke nullstille poeng');
    }
  };

  const handleResetAllPoints = async () => {
    if (!confirm('⚠️ ADVARSEL: Dette vil nullstille ALLE poeng til alle elever! Er du helt sikker?')) return;
    if (!confirm('Dette kan ikke angres! Bekreft en gang til.')) return;
    try {
      const count = await resetAllPoints();
      toast.success(`Alle poeng nullstilt for ${count} elever!`);
      loadStats();
    } catch (err) {
      toast.error('Kunne ikke nullstille poeng');
    }
  };

  const handleResetAllWaste = async () => {
    if (!confirm('⚠️ ADVARSEL: Dette vil slette ALL avfallslogg OG nullstille alle poeng! Er du sikker?')) return;
    if (!confirm('Dette kan ikke angres! Alle data vil gå tapt!')) return;
    try {
      const result = await resetAllWaste();
      toast.success(` ${result.usersReset} brukere nullstilt, ${result.logsDeleted} logger slettet!`);
      loadStats();
    } catch (err) {
      toast.error('Kunne ikke slette data');
    }
  };

  const handleDeleteAllUsers = async () => {
    if (!confirm('⚠️ ADVARSEL: Dette vil slette ALLE brukere (unntatt admin)! Er du sikker?')) return;
    if (!confirm('Dette kan ikke angres! Alle brukere unntatt admin vil bli slettet!')) return;
    try {
      const count = await deleteAllUsers();
      toast.success(`${count} brukere slettet!`);
      loadStats();
    } catch (err) {
      toast.error('Kunne ikke slette brukere');
    }
  };

  const handleDeleteAllClasses = async () => {
    if (!confirm('⚠️ ADVARSEL: Dette vil slette ALLE klasser! Er du sikker?')) return;
    if (!confirm('Dette kan ikke angres! Alle klasser vil bli slettet!')) return;
    try {
      const count = await deleteAllClasses();
      toast.success(`${count} klasser slettet!`);
      loadStats();
    } catch (err) {
      toast.error('Kunne ikke slette klasser');
    }
  };

  if (loading || !userData) {
    return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><div className="w-10 h-10 border-2 border-bio-500/30 border-t-bio-500 rounded-full animate-spin" /></div>;
  }

  const tabs = [
    { id: 'overview', label: 'Oversikt' },
    { id: 'admins', label: 'Administratorer' },
    { id: 'skoler', label: 'Skoler' },
    { id: 'grupper', label: 'Grupper' },
    { id: 'users', label: 'Brukere' },
    { id: 'classes', label: 'Klasser' },
    { id: 'logs', label: 'Logger' },
    { id: 'tools', label: 'Verktøy 🛠️' },
  ];

  const topStudents = stats?.students
    ?.sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 5)
    .map(s => ({ name: s.name?.split(' ')[0] || 'Ukjent', poeng: s.points || 0 }));

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
              <Shield size={20} className="text-red-400" />
            </div>
            <div>
              <h1 className="font-display font-700 text-white text-2xl lg:text-3xl mb-1">
                Admin Dashboard 🛡️
              </h1>
              <p className="text-slate-400 font-body text-sm">Full kontroll over BioBin X</p>
            </div>
          </div>
          <button onClick={loadStats} className="btn-primary text-sm">
            Oppdater
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-body font-500 transition-all ${
                activeTab === tab.id
                  ? 'bg-bio-500/15 text-bio-400 border border-bio-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bio-card p-5">
                <div className="w-9 h-9 rounded-xl bg-bio-500/15 flex items-center justify-center mb-3">
                  <Users size={18} className="text-bio-400" />
                </div>
                <div className="font-display font-700 text-white text-2xl">{stats.totalUsers || 0}</div>
                <div className="text-slate-500 text-xs font-body mt-1">Totalt brukere</div>
              </div>
              <div className="bio-card p-5">
                <div className="w-9 h-9 rounded-xl bg-moss-500/15 flex items-center justify-center mb-3">
                  <GraduationCap size={18} className="text-moss-400" />
                </div>
                <div className="font-display font-700 text-white text-2xl">{stats.totalStudents || 0}</div>
                <div className="text-slate-500 text-xs font-body mt-1">Elever</div>
              </div>
              <div className="bio-card p-5">
                <div className="w-9 h-9 rounded-xl bg-earth-500/15 flex items-center justify-center mb-3">
                  <School size={18} className="text-earth-400" />
                </div>
                <div className="font-display font-700 text-white text-2xl">{stats.totalTeachers || 0}</div>
                <div className="text-slate-500 text-xs font-body mt-1">Lærere</div>
              </div>
              <div className="bio-card p-5">
                <div className="w-9 h-9 rounded-xl bg-bio-500/15 flex items-center justify-center mb-3">
                  <BarChart2 size={18} className="text-bio-400" />
                </div>
                <div className="font-display font-700 text-white text-2xl">{stats.totalClasses || 0}</div>
                <div className="text-slate-500 text-xs font-body mt-1">Klasser</div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Matavfall', value: (stats.totalWaste || 0).toFixed(1), icon: Leaf, color: 'bio', unit: 'kg' },
                { label: 'Energi', value: calculateEnergy(stats.totalWaste || 0).toFixed(1), color: 'moss', unit: 'kWh' },
                { label: 'CO₂ spart', value: calculateCO2Saved(stats.totalWaste || 0).toFixed(1), color: 'earth', unit: 'kg' },
              ].map(({ label, value, color, unit }) => (
                <div key={label} className="bio-card p-5">
                  <div className="text-slate-500 text-xs font-body mb-1">{label}</div>
                  <div className="font-display font-700 text-white text-xl">{value} <span className="text-sm text-slate-500">{unit}</span></div>
                </div>
              ))}
            </div>

            {/* Top Students Chart */}
            <div className="bio-card p-6">
              <h2 className="font-display font-700 text-white text-lg mb-5">Topp 5 elever</h2>
              {topStudents?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topStudents}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1a2d1f', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', fontFamily: 'DM Sans' }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#4ade80' }}
                    />
                    <Bar dataKey="poeng" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-center py-8 font-body">Ingen elever ennå</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-white text-xl">Administratorer</h2>
              <button onClick={() => setShowAddAdminModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                <UserPlus size={16} /> Legg til admin
              </button>
            </div>
            
            <div className="bio-card overflow-hidden">
              {admins.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Shield size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="font-body">Ingen administratorer ennå</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {admins.map(admin => (
                    <div key={admin.uid} className="flex items-center gap-4 p-4 hover:bg-white/3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-display font-700 text-sm">
                        {admin.name?.[0]?.toUpperCase() || admin.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-body font-500">{admin.name || 'Administrator'}</div>
                        <div className="text-slate-500 text-xs font-body">{admin.email}</div>
                      </div>
                      {admin.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
                        <button
                          onClick={() => handleRemoveAdmin(admin.uid)}
                          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                          title="Fjern admin"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'grupper' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-white text-xl">Grupper</h2>
              <button onClick={() => setShowGroupModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} /> Ny gruppe
              </button>
            </div>
            <div className="bio-card overflow-hidden">
              {groups.length === 0 ? (
                <div className="p-8 text-center">
                  <UsersRound size={40} className="mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400 font-body">Ingen grupper ennå. Opprett en gruppe for å komme i gang.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {groups.map(group => (
                    <div key={group.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-earth-500/15 flex items-center justify-center">
                          <UsersRound size={20} className="text-earth-400" />
                        </div>
                        <div>
                          <div className="text-white font-body font-500">{group.name}</div>
                          <div className="text-slate-500 text-xs font-body">
                            Skole: <span className="text-earth-400">{schools.find(s => s.id === group.schoolId)?.name || 'Ukjent'}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteGroup(group.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'skoler' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-white text-xl">Skoler</h2>
              <button onClick={() => setShowSchoolModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} /> Ny skole
              </button>
            </div>
            <div className="bio-card overflow-hidden">
              {schools.length === 0 ? (
                <div className="p-8 text-center">
                  <Building2 size={40} className="mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400 font-body">Ingen skoler ennå. Opprett en skole for å komme i gang.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {schools.map(school => (
                    <div key={school.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-bio-500/15 flex items-center justify-center">
                          <Building2 size={20} className="text-bio-400" />
                        </div>
                        <div>
                          <div className="text-white font-body font-500">{school.name}</div>
                          <div className="text-slate-500 text-xs font-body">
                            Kode: <span className="font-mono text-bio-400">{school.code}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(school.code); toast.success('Kode kopiert!'); }} className="p-2 text-slate-500 hover:text-bio-400 transition-colors mr-2">
                        <Copy size={16} />
                      </button>
                      <button onClick={() => handleDeleteSchool(school.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && stats && (
          <div className="bio-card overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-display font-700 text-white">Alle brukere ({stats.totalUsers})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/3">
                  <tr>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Navn</th>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">E-post</th>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Rolle</th>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Poeng</th>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Avfall</th>
                    <th className="text-right text-slate-400 text-xs font-body font-500 px-4 py-3">Handlinger</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.students.concat(stats.teachers).map(user => (
                    <tr key={user.uid} className="border-t border-white/5 hover:bg-white/3">
                      <td className="px-4 py-3">
                        <div className="text-white text-sm font-body">{user.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-400 text-sm font-body">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-500 ${
                          user.role === 'admin' ? 'bg-red-500/15 text-red-400' :
                          user.role === 'teacher' ? 'bg-earth-500/15 text-earth-400' :
                          'bg-bio-500/15 text-bio-400'
                        }`}>
                          {user.role === 'admin' ? 'Administrator' : user.role === 'teacher' ? 'Lærer' : 'Elev'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-bio-400 text-sm font-mono">{user.points || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-400 text-sm">{(user.totalWaste || 0).toFixed(1)} kg</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingUser(user); setEditForm({ name: user.name, points: user.points, role: user.role }); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-bio-400 hover:bg-white/5 transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.uid)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/8 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'classes' && stats && (
          <div className="bio-card overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-display font-700 text-white">Alle klasser ({stats.totalClasses})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/3">
                  <tr>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Navn</th>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Kode</th>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Elever</th>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Avfall</th>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Poeng</th>
                    <th className="text-right text-slate-400 text-xs font-body font-500 px-4 py-3">Handlinger</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.classes.map(cls => (
                    <tr key={cls.id} className="border-t border-white/5 hover:bg-white/3">
                      <td className="px-4 py-3">
                        <div className="text-white text-sm font-body">{cls.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-bio-400 text-sm">{cls.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-400 text-sm">{cls.studentCount || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-400 text-sm">{(cls.totalWaste || 0).toFixed(1)} kg</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-bio-400 text-sm font-mono">{cls.totalPoints || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingClass(cls); setEditForm({ name: cls.name, studentCount: cls.studentCount }); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-bio-400 hover:bg-white/5 transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(cls.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/8 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && stats && (
          <div className="bio-card overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-display font-700 text-white">Alle logger ({stats.totalLogs})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/3">
                  <tr>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Dato</th>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Bruker</th>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Vekt</th>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Poeng</th>
                    <th className="text-left text-slate-400 text-xs font-body font-500 px-4 py-3">Energi</th>
                    <th className="text-right text-slate-400 text-xs font-body font-500 px-4 py-3">Handlinger</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.logs.map(log => {
                    const user = stats.students.find(s => s.uid === log.userId) || stats.teachers.find(t => t.uid === log.userId);
                    return (
                      <tr key={log.id} className="border-t border-white/5 hover:bg-white/3">
                        <td className="px-4 py-3">
                          <div className="text-slate-400 text-sm font-body">
                            {log.timestamp ? new Date(log.timestamp).toLocaleDateString('no-NO') : 'Ukjent'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white text-sm font-body">{user?.name || 'Ukjent'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-400 text-sm">{log.weight} kg</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-bio-400 text-sm font-mono">+{log.points}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-400 text-sm">{(log.energyKwh || 0).toFixed(2)} kWh</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/8 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tools' && stats && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-white text-xl">Admin Verktøy 🛠️</h2>
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`px-4 py-2 rounded-xl text-sm font-body font-500 transition-all ${
                  debugMode ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {debugMode ? 'Skjul Debug' : 'Vis Debug'}
              </button>
            </div>

            {debugMode && (
              <div className="bio-card p-4 bg-red-500/5 border-red-500/20">
                <h3 className="text-red-400 font-display font-700 text-lg mb-2">🔧 Debug Mode</h3>
                <div className="text-slate-400 text-sm font-body space-y-1">
                  <p>Totalt brukere: {stats.totalUsers}</p>
                  <p>Totalt elever: {stats.totalStudents}</p>
                  <p>Totalt lærere: {stats.totalTeachers}</p>
                  <p>Totalt klasser: {stats.totalClasses}</p>
                  <p>Totalt logger: {stats.totalLogs}</p>
                  <p>Totalt avfall: {stats.totalWaste?.toFixed(2)} kg</p>
                  <p>Admin UID: {user?.uid}</p>
                  <p>Admin E-post: {user?.email}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bio-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-bio-500/15 flex items-center justify-center">
                    <Gift size={20} className="text-bio-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-700 text-white">Gi Bonpoeng 🎁</h3>
                    <p className="text-slate-400 text-xs font-body">Gi bonpoeng til elever</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-300 text-sm font-body font-500 block mb-1">Velg elev</label>
                    <select
                      value={selectedUserForBonus}
                      onChange={e => setSelectedUserForBonus(e.target.value)}
                      className="bio-input text-sm"
                    >
                      <option value="">Velg en elev...</option>
                      {(stats?.students || []).map(s => (
                        <option key={s.uid} value={s.uid}>{s.name} ({s.points} p)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-body font-500 block mb-1">Poeng</label>
                    <input
                      type="number"
                      value={bonusPointsAmount}
                      onChange={e => setBonusPointsAmount(parseInt(e.target.value) || 0)}
                      className="bio-input text-sm"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-body font-500 block mb-1">Grunn (valgfritt)</label>
                    <input
                      type="text"
                      value={bonusPointsReason}
                      onChange={e => setBonusPointsReason(e.target.value)}
                      placeholder="F.eks. Flott jobba!"
                      className="bio-input text-sm"
                    />
                  </div>
                  <button
                    onClick={handleGiveBonusToUser}
                    disabled={applyingBonus || !selectedUserForBonus}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {applyingBonus ? 'Gir poeng...' : <><Gift size={16} /> Gi {bonusPointsAmount} poeng</>}
                  </button>
                </div>
              </div>

              <div className="bio-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-earth-500/15 flex items-center justify-center">
                    <Crown size={20} className="text-earth-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-700 text-white">Gi Klasse Bonus 👑</h3>
                    <p className="text-slate-400 text-xs font-body">Gi bonpoeng til hele klasser</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-300 text-sm font-body font-500 block mb-1">Velg klasse</label>
                    <select
                      value={selectedClassForBonus}
                      onChange={e => setSelectedClassForBonus(e.target.value)}
                      className="bio-input text-sm"
                    >
                      <option value="">Velg en klasse...</option>
                      {(stats?.classes || []).map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.studentCount || 0} elever)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-body font-500 block mb-1">Poeng per elev</label>
                    <input
                      type="number"
                      value={bonusPointsAmount}
                      onChange={e => setBonusPointsAmount(parseInt(e.target.value) || 0)}
                      className="bio-input text-sm"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-body font-500 block mb-1">Grunn (valgfritt)</label>
                    <input
                      type="text"
                      value={bonusPointsReason}
                      onChange={e => setBonusPointsReason(e.target.value)}
                      placeholder="F.eks. Beste klassen!"
                      className="bio-input text-sm"
                    />
                  </div>
                  <button
                    onClick={handleGiveBonusToClass}
                    disabled={applyingBonus || !selectedClassForBonus}
                    className="btn-primary w-full flex items-center justify-center gap-2 bg-earth-600"
                  >
                    {applyingBonus ? 'Gir poeng...' : <><Crown size={16} /> Gi {bonusPointsAmount} poeng til alle</>}
                  </button>
                </div>
              </div>
            </div>

            <div className="bio-card p-6 border-orange-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                  <RotateCcw size={20} className="text-orange-400" />
                </div>
                <div>
                  <h3 className="font-display font-700 text-white">Nullstill Data ⚠️</h3>
                  <p className="text-slate-400 text-xs font-body">Farlige operasjoner - dobbelbekreftelse kreves</p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={handleResetAllPoints}
                  className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-body font-500 hover:bg-orange-500/20 transition-all"
                >
                  <RotateCcw size={16} className="mx-auto mb-1" />
                  Nullstill Alle Poeng
                </button>
                <button
                  onClick={handleResetAllWaste}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body font-500 hover:bg-red-500/20 transition-all"
                >
                  <Bomb size={16} className="mx-auto mb-1" />
                  Slett All Data
                </button>
                <button
                  onClick={handleDeleteAllUsers}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body font-500 hover:bg-red-500/20 transition-all"
                >
                  <Skull size={16} className="mx-auto mb-1" />
                  Slett Alle Brukere
                </button>
                <button
                  onClick={handleDeleteAllClasses}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body font-500 hover:bg-red-500/20 transition-all"
                >
                  <School size={16} className="mx-auto mb-1" />
                  Slett Alle Klasser
                </button>
              </div>
            </div>

            <div className="bio-card p-6 border-moss-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-moss-500/15 flex items-center justify-center">
                  <Sparkles size={20} className="text-moss-400" />
                </div>
                <div>
                  <h3 className="font-display font-700 text-white">Super-Krefter ✨</h3>
                  <p className="text-slate-400 text-xs font-body">Morsomme admin-muligheter</p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setBonusPointsAmount(1000);
                    setBonusPointsReason('🍀 LUCKY WINNER! 🍀');
                    toast.success('1000 bonpoeng klar til utdeling!');
                  }}
                  className="p-3 rounded-xl bg-moss-500/10 border border-moss-500/20 text-moss-400 text-sm font-body font-500 hover:bg-moss-500/20 transition-all"
                >
                  <Sparkles size={16} className="mx-auto mb-1" />
                  Lucky Winner Mode
                </button>
                <button
                  onClick={() => {
                    setBonusPointsAmount(500);
                    setBonusPointsReason('🌟 Ukens Miljø-Helt! 🌟');
                    toast.success('500 bonpoeng klar til utdeling!');
                  }}
                  className="p-3 rounded-xl bg-earth-500/10 border border-earth-500/20 text-earth-400 text-sm font-body font-500 hover:bg-earth-500/20 transition-all"
                >
                  <Zap size={16} className="mx-auto mb-1" />
                  Miljø-Helt Bonus
                </button>
                <button
                  onClick={() => {
                    setBonusPointsAmount(10000);
                    setBonusPointsReason('👑 ADMIN CROWN JEWEL 👑');
                    toast.success('10,000 bonpoeng klar!');
                  }}
                  className="p-3 rounded-xl bg-bio-500/10 border border-bio-500/20 text-bio-400 text-sm font-body font-500 hover:bg-bio-500/20 transition-all"
                >
                  <Crown size={16} className="mx-auto mb-1" />
                  Crown Jewel Bonus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bio-card p-8 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-700 text-white text-xl">Rediger bruker</h2>
              <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-body font-500 block mb-2">Navn</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="bio-input"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-body font-500 block mb-2">Poeng</label>
                <input
                  type="number"
                  value={editForm.points || 0}
                  onChange={e => setEditForm({ ...editForm, points: parseInt(e.target.value) || 0 })}
                  className="bio-input"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-body font-500 block mb-2">Rolle</label>
                <select
                  value={editForm.role || 'student'}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  className="bio-input"
                >
                  <option value="student">Elev</option>
                  <option value="teacher">Lærer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button onClick={handleSaveUser} className="btn-primary w-full flex items-center justify-center gap-2 py-4 mt-4">
                <Check size={16} /> Lagre endringer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bio-card p-8 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-700 text-white text-xl">Rediger klasse</h2>
              <button onClick={() => setEditingClass(null)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-body font-500 block mb-2">Navn</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="bio-input"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-body font-500 block mb-2">Antall elever</label>
                <input
                  type="number"
                  value={editForm.studentCount || 0}
                  onChange={e => setEditForm({ ...editForm, studentCount: parseInt(e.target.value) || 0 })}
                  className="bio-input"
                />
              </div>
              <button onClick={handleSaveClass} className="btn-primary w-full flex items-center justify-center gap-2 py-4 mt-4">
                <Check size={16} /> Lagre endringer
              </button>
            </div>
          </div>
        </div>
      )}

      {showSchoolModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bio-card p-8 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-700 text-white text-xl">Ny skole</h2>
              <button onClick={() => setShowSchoolModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-body font-500 block mb-2">Skolenavn</label>
                <input
                  type="text"
                  value={newSchoolName}
                  onChange={e => setNewSchoolName(e.target.value)}
                  placeholder="F.eks. Eberg Ungdomsskole"
                  className="bio-input"
                  autoFocus
                />
              </div>
              <button onClick={handleCreateSchool} disabled={creatingSchool} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
                {creatingSchool ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={16} /> Opprett skole</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bio-card p-8 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-700 text-white text-xl">Ny gruppe</h2>
              <button onClick={() => setShowGroupModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-body font-500 block mb-2">Gruppenavn</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="F.eks. 9. trinn"
                  className="bio-input"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-body font-500 block mb-2">Skole</label>
                <select
                  value={newGroupSchool}
                  onChange={e => setNewGroupSchool(e.target.value)}
                  className="bio-input"
                >
                  <option value="">Velg skole</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleCreateGroup} disabled={creatingGroup || !newGroupSchool} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
                {creatingGroup ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={16} /> Opprett gruppe</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bio-card p-8 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-700 text-white text-xl">Legg til administrator</h2>
              <button onClick={() => setShowAddAdminModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-body font-500 block mb-2">Navn</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={e => setNewAdminName(e.target.value)}
                  placeholder="F.eks. Per Hansen"
                  className="bio-input"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-body font-500 block mb-2">E-post</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  placeholder="admin@eksempel.no"
                  className="bio-input"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-body font-500 block mb-2">Passord</label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={e => setNewAdminPassword(e.target.value)}
                  placeholder="Minst 6 tegn"
                  className="bio-input"
                />
              </div>
              <button onClick={handleAddAdmin} disabled={addingAdmin} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
                {addingAdmin ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus size={16} /> Opprett admin</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
