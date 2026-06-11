// pages/dashboard/classes.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronRight, Copy, Plus, Users, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDemo } from '../../hooks/useDemo';
import Layout from '../../components/layout/Layout';
import { getTeacherClasses, createClass, getClassStudents, getAllSchools, getSchoolGroups } from '../../firebase/db';
import { getTopStreaksByClass } from '../../lib/streak';
import { EmptyState, LoadingScreen, Page, PageHeader, SectionCard, TonePill } from '../../components/ui/AppPrimitives';

export default function ClassesPage() {
  const { user, userData, loading } = useAuth();
  const { isDemo, demoData } = useDemo();
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [classStudents, setClassStudents] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [classStreakLeaders, setClassStreakLeaders] = useState({});
  const [newName, setNewName] = useState('');
  const [schools, setSchools] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && userData) {
      if (userData.role !== 'teacher' && userData.role !== 'admin' && userData.role !== 'rector' && !isDemo) {
        router.push('/auth/login');
      }
    }
  }, [loading, userData, isDemo, router]);

  useEffect(() => {
    if (isDemo) {
      setClasses(demoData.classes);
      setClassStudents(demoData.classStudentsByClass || {});
      return;
    }

    if (user && userData?.role === 'teacher') {
      getTeacherClasses(user.uid).then((cls) => setClasses(cls || [])).catch(() => setClasses([]));
    }
  }, [user, userData, isDemo, demoData]);

  const toggleExpand = async (classId) => {
    if (expanded === classId) {
      setExpanded(null);
      return;
    }
    setExpanded(classId);

    if (!classStudents[classId]) {
      const students = await getClassStudents(classId);
      setClassStudents((prev) => ({ ...prev, [classId]: students || [] }));
    }
    if (!classStreakLeaders[classId]) {
      const streaks = await getTopStreaksByClass(classId, 5);
      setClassStreakLeaders((prev) => ({ ...prev, [classId]: streaks || [] }));
    }
  };

  const handleOpenModal = async () => {
    try {
      const allSchools = await getAllSchools();
      setSchools(allSchools || []);
      if (allSchools && allSchools.length > 0) {
        setSelectedSchool(allSchools[0].id);
        const schoolGroups = await getSchoolGroups(allSchools[0].id);
        setGroups(schoolGroups || []);
      }
      setSelectedGroup('');
      setShowModal(true);
    } catch (err) {
      console.error('Error loading schools:', err);
      toast.error('Klarte ikke laste skoler');
    }
  };

  const handleSchoolChange = async (schoolId) => {
    setSelectedSchool(schoolId);
    setSelectedGroup('');
    try {
      const schoolGroups = await getSchoolGroups(schoolId);
      setGroups(schoolGroups || []);
    } catch (err) {
      setGroups([]);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return toast.error('Skriv inn klassenavn');
    if (!selectedSchool) return toast.error('Velg en skole');
    setCreating(true);
    try {
      const result = await createClass({ name: newName, teacherId: user.uid, schoolId: selectedSchool, groupId: selectedGroup || null });
      toast.success(`Klasse opprettet! Kode: ${result.code}`);
      const cls = await getTeacherClasses(user.uid);
      setClasses(cls || []);
      setShowModal(false);
      setNewName('');
    } catch (err) {
      console.error('Error creating class:', err);
      toast.error(`Feil ved oppretting: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  if ((loading || !userData) && !isDemo) {
    return (
      <Layout>
        <LoadingScreen title="Laster klasser" description="Henter klassestruktur, elever og tilgjengelige skoler." />
      </Layout>
    );
  }

  return (
    <Layout>
      <Page className="space-y-6" width="max-w-5xl">
        <PageHeader
          eyebrow="Klasser"
          title="Hold klasseoppsettet ryddig og delbart"
          description="Denne siden er laget for drift av klasser: hvem som er med, hvilken kode som brukes og hvor elevaktiviteten trenger et puff."
          meta={[`${classes.length} klasser`, isDemo ? 'Demo-data' : 'Live-data']}
          actions={<button onClick={handleOpenModal} className="btn-primary"><Plus size={15} /> Ny klasse</button>}
        />

        {classes.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Ingen klasser enda"
            description="Opprett den forste klassen for a kunne dele kode med elever og fa klasseaktivitet inn i plattformen."
            action={<button onClick={handleOpenModal} className="btn-primary"><Plus size={15} /> Opprett forste klasse</button>}
          />
        ) : (
          <div className="space-y-4">
            {classes.map((cls) => (
              <SectionCard
                key={cls.id}
                title={cls.name}
                description={`${(cls.totalWaste || 0).toFixed(1)} kg registrert · ${cls.totalPoints || 0} poeng totalt`}
                action={
                  <div className="flex items-center gap-2">
                    <TonePill>{cls.code}</TonePill>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(cls.code);
                        toast.success('Klassekode kopiert');
                      }}
                      className="btn-ghost px-2 py-2"
                    >
                      <Copy size={14} />
                    </button>
                    <button onClick={() => toggleExpand(cls.id)} className="btn-ghost px-2 py-2">
                      {expanded === cls.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                }
              >
                <div className="flex flex-wrap gap-2 pb-4">
                  {cls.schoolName ? <TonePill tone="brand">{cls.schoolName}</TonePill> : null}
                  {cls.groupName ? <TonePill>{cls.groupName}</TonePill> : null}
                </div>

                {expanded === cls.id ? (
                  <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                    <div className="space-y-3">
                      <div className="text-xs uppercase tracking-[0.08em] text-slate-500">Elever</div>
                      {(classStudents[cls.id] || []).length === 0 ? (
                        <EmptyState
                          icon={Users}
                          title="Ingen elever enda"
                          description={`Del koden ${cls.code} med elevene. Nar de kobler seg til klassen, dukker de opp her automatisk.`}
                        />
                      ) : (
                        (classStudents[cls.id] || [])
                          .sort((a, b) => (b.points || 0) - (a.points || 0))
                          .map((student, index) => (
                            <div key={student.id} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/3 px-4 py-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-2xl border border-white/8 bg-white/4 text-xs font-700 text-white">{index + 1}</div>
                              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-sm font-700 text-white">{student.name?.[0]?.toUpperCase()}</div>
                              <div className="min-w-0 flex-1 text-sm text-white">{student.name}</div>
                              <div className="text-sm font-600 text-bio-100">{student.points || 0} p</div>
                            </div>
                          ))
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs uppercase tracking-[0.08em] text-slate-500">Streak-toppliste</div>
                      {(classStreakLeaders[cls.id] || []).length === 0 ? (
                        <EmptyState icon={ChevronRight} title="Ingen streak-data enda" description="Nar elever sjekker inn og registrerer jevnt, blir topplisten synlig her." />
                      ) : (
                        (classStreakLeaders[cls.id] || []).map((entry) => (
                          <div key={entry.uid} className="flex items-center justify-between rounded-2xl border border-orange-500/15 bg-orange-500/10 px-4 py-3 text-sm">
                            <div className="text-slate-100">#{entry.rank} {entry.name}</div>
                            <div className="font-600 text-orange-300">{entry.currentStreak} dager</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </SectionCard>
            ))}
          </div>
        )}
      </Page>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="bio-card w-full max-w-md p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-700 text-white">Ny klasse</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost px-2 py-2"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-500 text-slate-300">Klassenavn</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="F.eks. 9B" className="bio-input" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-500 text-slate-300">Skole</label>
                <select value={selectedSchool} onChange={(e) => handleSchoolChange(e.target.value)} className="bio-input">
                  {schools.length === 0 ? <option value="">Ingen skoler tilgjengelig</option> : schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
                </select>
              </div>
              {groups.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-500 text-slate-300">Gruppe (valgfritt)</label>
                  <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="bio-input">
                    <option value="">Ingen gruppe</option>
                    {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                  </select>
                </div>
              )}
              <button onClick={handleCreate} disabled={creating || !selectedSchool} className="btn-primary w-full py-4">
                {creating ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Plus size={16} /> Opprett</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
