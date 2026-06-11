// pages/dashboard/teacher.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  BarChart2,
  Brain,
  Copy,
  Download,
  Leaf,
  Plus,
  Target,
  Trash2,
  Trophy,
  Users,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/layout/Layout';
import {
  getTeacherClasses,
  getClassStudents,
  getClassLogs,
  createClass,
  setClassWeeklyGoal,
  getWeeklyWaste,
  getAllSchools,
  getSchoolGroups,
  getBinsByTeacher,
} from '../../firebase/db';
import { calculateEnergy, calculateCO2Saved, exportLogsToCSV, exportStudentsToCSV } from '../../utils/calculator';
import AddBinModal from '../../components/AddBinModal';
import GroupModal from '../../components/GroupModal';
import Klasseligaen from '../../components/Klasseligaen';
import Challenges from '../../components/Challenges';
import SmartAvfallsanalyse from '../../components/SmartAvfallsanalyse';
import CO2Prognose from '../../components/CO2Prognose';
import AIAssistant from '../../components/AIAssistant';
import { EmptyState, LoadingScreen, MetricCard, Page, PageHeader, SectionCard, TonePill } from '../../components/ui/AppPrimitives';

const chartTooltipStyle = {
  background: '#12181c',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  fontFamily: 'Poppins',
};

export default function TeacherDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStats, setClassStats] = useState({ students: [], logs: [], totalWaste: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalWeight, setGoalWeight] = useState('');
  const [settingGoal, setSettingGoal] = useState(false);
  const [classWeeklyWaste, setClassWeeklyWaste] = useState(0);
  const [schools, setSchools] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showAddBinModal, setShowAddBinModal] = useState(false);
  const [bins, setBins] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (userData?.role !== 'teacher' && userData?.role !== 'admin' && userData?.role !== 'rector'))) {
      router.push('/auth/login');
    }
  }, [user, userData, loading, router]);

  useEffect(() => {
    if (user && userData?.role === 'teacher') {
      getTeacherClasses(user.uid)
        .then((cls) => {
          setClasses(cls || []);
          if (cls && cls.length > 0) setSelectedClass(cls[0]);
        })
        .catch((err) => {
          console.error('Error loading classes:', err);
          setClasses([]);
        });
      getBinsByTeacher(user.uid).then((data) => setBins(data || [])).catch(() => setBins([]));
    }
  }, [user, userData]);

  useEffect(() => {
    if (selectedClass) {
      Promise.all([getClassStudents(selectedClass.id), getClassLogs(selectedClass.id)])
        .then(([students, logs]) => {
          const totalWaste = (logs || []).reduce((sum, log) => sum + (log.weight || 0), 0);
          setClassStats({ students: students || [], logs: logs || [], totalWaste });
        })
        .catch((err) => {
          console.error('Error loading class data:', err);
          setClassStats({ students: [], logs: [], totalWaste: 0 });
        });
      getWeeklyWaste(selectedClass.id).then(setClassWeeklyWaste).catch(() => setClassWeeklyWaste(0));
      setGoalWeight(selectedClass.weeklyGoal?.toString() || '');
    }
  }, [selectedClass]);

  const handleOpenCreateModal = async () => {
    try {
      const allSchools = await getAllSchools();
      setSchools(allSchools || []);
      if (allSchools && allSchools.length > 0) {
        setSelectedSchool(allSchools[0].id);
        const schoolGroups = await getSchoolGroups(allSchools[0].id);
        setGroups(schoolGroups || []);
      }
      setSelectedGroup('');
      setShowCreateModal(true);
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

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return toast.error('Skriv inn klassenavn');
    if (newClassName.trim().length > 50) return toast.error('Klassenavnet er for langt');
    if (!selectedSchool) return toast.error('Velg en skole');

    const exists = classes.some((cls) => cls.name.toLowerCase() === newClassName.trim().toLowerCase());
    if (exists) return toast.error('En klasse med dette navnet eksisterer allerede');

    setCreating(true);
    try {
      const result = await createClass({ name: newClassName.trim(), teacherId: user.uid, schoolId: selectedSchool, groupId: selectedGroup || null });
      toast.success(`Klasse opprettet! Kode: ${result.code}`);
      const cls = await getTeacherClasses(user.uid);
      setClasses(cls || []);
      setShowCreateModal(false);
      setNewClassName('');
      if (cls?.length) {
        const createdClass = cls.find((item) => item.id === result.id) || cls[0];
        setSelectedClass(createdClass);
      }
    } catch (err) {
      console.error('Error creating class:', err);
      toast.error('Klarte ikke opprette klasse');
    } finally {
      setCreating(false);
    }
  };

  const handleSetGoal = async () => {
    if (!selectedClass) return;
    const weight = parseFloat(goalWeight);
    if (Number.isNaN(weight) || weight <= 0) return toast.error('Skriv inn en gyldig vekt');
    setSettingGoal(true);
    try {
      await setClassWeeklyGoal(selectedClass.id, weight);
      toast.success('Ukentlig mal oppdatert');
      setShowGoalModal(false);
      const cls = await getTeacherClasses(user.uid);
      setClasses(cls || []);
      const updated = cls?.find((item) => item.id === selectedClass.id);
      if (updated) setSelectedClass(updated);
    } catch (err) {
      console.error('Error setting goal:', err);
      toast.error('Klarte ikke sette mal');
    } finally {
      setSettingGoal(false);
    }
  };

  const studentChartData = useMemo(() => {
    const truncateName = (name) => {
      if (!name) return 'Ukjent';
      const firstName = name.split(' ')[0] || name;
      return firstName.length > 12 ? `${firstName.substring(0, 12)}...` : firstName;
    };

    return [...classStats.students]
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 8)
      .map((student) => ({ name: truncateName(student.name), poeng: student.points || 0 }));
  }, [classStats.students]);

  if (loading || !userData) {
    return (
      <Layout>
        <LoadingScreen title="Laster laereroversikten" description="Henter klasser, elevdata og fremdrift for denne uken." />
      </Layout>
    );
  }

  const energy = calculateEnergy(classStats.totalWaste);
  const co2 = calculateCO2Saved(classStats.totalWaste);
  const weeklyGoal = selectedClass?.weeklyGoal || 0;
  const goalProgress = weeklyGoal > 0 ? Math.min((classWeeklyWaste / weeklyGoal) * 100, 100) : 0;

  return (
    <Layout>
      <Page className="space-y-6" width="max-w-6xl">
        <PageHeader
          eyebrow="Laererflate"
          title="Folg opp klasseaktivitet med faktiske handlinger"
          description="Denne arbeidsflaten er bygget for det du ma gjore gjennom skoleuken: opprette klasser, dele kode, sette mal og fange opp hvor aktiviteten stopper opp."
          meta={[
            `${classes.length} klasser`,
            `${bins.length} aktive bins`,
            `${classStats.students.length} elever i valgt klasse`,
          ]}
          actions={
            <>
              <button onClick={handleOpenCreateModal} className="btn-primary px-5 py-3"><Plus size={16} /> Ny klasse</button>
              <button onClick={() => setShowGroupModal(true)} className="btn-secondary px-5 py-3"><Users size={16} /> Grupper</button>
              <button onClick={() => setShowAddBinModal(true)} className="btn-secondary px-5 py-3"><Trash2 size={16} /> Legg til botte</button>
              <button onClick={() => setShowAIAssistant(true)} className="btn-secondary px-5 py-3"><Brain size={16} /> AI-assistent</button>
            </>
          }
        />

        {classes.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Ingen klasser enda"
            description="Opprett den forste klassen for a dele kode med elever, sette ukesmal og begynne a fa reell aktivitet inn i plattformen."
            action={<button onClick={handleOpenCreateModal} className="btn-primary"><Plus size={16} /> Opprett forste klasse</button>}
          />
        ) : (
          <>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {classes.map((cls) => {
                const active = selectedClass?.id === cls.id;
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`min-w-fit rounded-2xl border px-4 py-3 text-left transition-all ${active ? 'border-bio-500/25 bg-bio-500/12 text-white' : 'border-white/8 bg-white/4 text-slate-300 hover:border-white/12 hover:bg-white/6'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-600">{cls.name}</span>
                      {cls.groupName ? <TonePill>{cls.groupName}</TonePill> : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{cls.schoolName || 'Ingen skole valgt'} · {cls.code}</div>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <SectionCard
                title={`Del klassekode for ${selectedClass?.name || 'klassen'}`}
                description="Dette er inngangen elevene bruker for a bli koblet til riktig klasse og riktig ukesmal."
                action={<TonePill tone="brand">{selectedClass?.schoolName || 'Skole ikke satt'}</TonePill>}
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <div className="text-xs uppercase tracking-[0.08em] text-slate-500">Klassekode</div>
                    <div className="mt-2 font-mono text-3xl tracking-[0.3em] text-white">{selectedClass?.code}</div>
                    <p className="mt-3 text-sm leading-7 text-slate-400">Del koden i tavlevisning, læringsplattform eller velkomstmelding. Elevene kan bruke den direkte i onboardingen.</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedClass?.code || '');
                      toast.success('Klassekode kopiert');
                    }}
                    className="btn-secondary px-5 py-3"
                  >
                    <Copy size={16} /> Kopier kode
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                title="Ukentlig klassemål"
                description="Maalkortet brukes for a se om klassen har nok aktivitet denne uken og for a gjore oppfolgingen konkret."
                action={<button onClick={() => setShowGoalModal(true)} className="btn-ghost">Endre mal</button>}
              >
                {weeklyGoal > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>{classWeeklyWaste.toFixed(1)} kg registrert denne uken</span>
                      <span>{weeklyGoal} kg mal</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/8">
                      <div className={`h-full rounded-full ${goalProgress >= 100 ? 'bg-earth-400' : 'bg-bio-400'}`} style={{ width: `${goalProgress}%` }} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-slate-500">{Math.max(weeklyGoal - classWeeklyWaste, 0).toFixed(1)} kg igjen for a na malet.</span>
                      {selectedClass?.weeklyGoalCompleted ? <TonePill tone="earth">Mal oppnadd</TonePill> : null}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={Target}
                    title="Ingen ukesmal satt"
                    description="Sett et mal i kilo slik at klassen far en tydelig referanse for progresjon denne uken."
                    action={<button onClick={() => setShowGoalModal(true)} className="btn-primary">Sett ukesmal</button>}
                  />
                )}
              </SectionCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <MetricCard icon={Users} tone="brand" label="Elever" value={classStats.students.length} meta="I valgt klasse akkurat na" />
              <MetricCard icon={Leaf} tone="brand" label="Matavfall" value={`${classStats.totalWaste.toFixed(1)} kg`} meta="Samlet registrert i klassen" />
              <MetricCard icon={Zap} tone="moss" label="Energi" value={`${energy.toFixed(1)} kWh`} meta="Omtrentlig biogasspotensial" />
              <MetricCard icon={Wind} tone="neutral" label="CO2 spart" value={`${co2.toFixed(1)} kg`} meta="Estimat basert pa registrert vekt" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <SectionCard title="Poeng per elev" description="Bruk denne visningen for a se hvem som deltar jevnt og hvem som trenger en konkret oppfordring i klassen.">
                {studentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={studentChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#dbe8dc' }} />
                      <Bar dataKey="poeng" fill="#8dbb95" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={BarChart2} title="Ingen elevdata enda" description="Nar elever blir med i klassen og registrerer kast, dukker poengfordelingen opp her." />
                )}
              </SectionCard>

              <SectionCard
                title="Elevliste"
                description="En rask operativ liste over hvem som er med, hvor mye de har registrert og hvem som leder akkurat na."
                action={
                  classStats.students.length > 0 ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          exportStudentsToCSV(classStats.students);
                          toast.success('Elever eksportert');
                        }}
                        className="btn-ghost px-3 py-2"
                        title="Eksporter elever"
                      >
                        <Download size={15} />
                      </button>
                      <button
                        onClick={() => {
                          exportLogsToCSV(classStats.logs);
                          toast.success('Avfallslogg eksportert');
                        }}
                        className="btn-ghost px-3 py-2"
                        title="Eksporter logg"
                      >
                        <Leaf size={15} />
                      </button>
                    </div>
                  ) : null
                }
              >
                {classStats.students.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Ingen elever har blitt med enda"
                    description={`Del klassekoden ${selectedClass?.code || ''} sa elevene kan koble seg til denne arbeidsflaten.`}
                  />
                ) : (
                  <div className="space-y-3">
                    {classStats.students
                      .sort((a, b) => (b.points || 0) - (a.points || 0))
                      .map((student, index) => (
                        <div key={student.id} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/3 px-4 py-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-2xl text-xs font-700 ${index === 0 ? 'bg-earth-500/12 text-earth-100' : index === 1 ? 'bg-white/10 text-white' : index === 2 ? 'bg-[#8f6045]/20 text-[#d9b9a8]' : 'bg-white/6 text-slate-400'}`}>
                            {index + 1}
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-sm font-700 text-white">
                            {student.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-600 text-white">{student.name}</div>
                            <div className="text-xs text-slate-500">{(student.totalWaste || 0).toFixed(1)} kg registrert</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-600 text-bio-100">{(student.points || 0).toLocaleString('no-NO')} p</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Klasseligaen userData={userData} />
              <CO2Prognose />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Challenges classId={selectedClass?.id} teacherId={user?.uid} />
              <SmartAvfallsanalyse teacherId={user?.uid} />
            </div>
          </>
        )}
      </Page>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="bio-card w-full max-w-md p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-700 text-white">Opprett ny klasse</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-ghost px-2 py-2"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-500 text-slate-300">Klassenavn</label>
                <input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="F.eks. 8A" className="bio-input" autoFocus />
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
              <button onClick={handleCreateClass} disabled={creating || !selectedSchool} className="btn-primary w-full py-4">
                {creating ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Plus size={16} /> Opprett klasse</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="bio-card w-full max-w-md p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-700 text-white">Sett ukentlig klassemål</h2>
              <button onClick={() => setShowGoalModal(false)} className="btn-ghost px-2 py-2"><X size={18} /></button>
            </div>
            <p className="mb-4 text-sm leading-7 text-slate-400">Sett et mal for hvor mye matavfall klassen skal registrere denne uken. Malet brukes direkte i klasseoversikten og kan oppdateres senere.</p>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-500 text-slate-300">Klassemål (kg)</label>
                <input type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} placeholder="F.eks. 50" className="bio-input" min="0" step="1" autoFocus />
              </div>
              <button onClick={handleSetGoal} disabled={settingGoal} className="btn-primary w-full py-4">
                {settingGoal ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Target size={16} /> Oppdater ukesmal</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddBinModal
        isOpen={showAddBinModal}
        onClose={() => setShowAddBinModal(false)}
        onSuccess={() => {
          if (user) {
            getBinsByTeacher(user.uid).then((data) => setBins(data || [])).catch(() => {});
          }
        }}
      />

      <GroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        teacherId={user?.uid}
        onSuccess={() => {}}
      />

      <AIAssistant isOpen={showAIAssistant} onClose={() => setShowAIAssistant(false)} teacherId={user?.uid} />
    </Layout>
  );
}
