import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { AlertTriangle, BellRing, Clock3, FileText, Gift, Loader2, Target, TrendingUp } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from '../../lib/firebase';
import {
  addBonusPointsToClass,
  addBonusPointsToUser,
  createAnnouncement,
  getActivityFeed,
  getSchoolLeaderboard,
  setClassWeeklyGoalKg,
  getClassesByIds,
  getTeacherClasses,
} from '../../firebase/db';
import { EmptyState, LoadingScreen, MetricCard, Page, PageHeader, SectionCard, TonePill } from '../../components/ui/AppPrimitives';

function formatTime(value) {
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Ukjent';
  return date.toLocaleString('nb-NO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function TeacherActionCenter() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [activityLog, setActivityLog] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [schoolRank, setSchoolRank] = useState(null);
  const [schoolTotal, setSchoolTotal] = useState(0);
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [goalKg, setGoalKg] = useState('');
  const [bonusTarget, setBonusTarget] = useState('class');
  const [bonusValue, setBonusValue] = useState('50');
  const [bonusUserId, setBonusUserId] = useState('');
  const [working, setWorking] = useState(false);
  const [loadError, setLoadError] = useState('');

  const selectedClass = useMemo(() => classes.find((item) => item.id === selectedClassId) || null, [classes, selectedClassId]);

  useEffect(() => {
    if (!loading && (!user || !['teacher', 'admin'].includes(userData?.role))) {
      router.push('/auth/login');
    }
  }, [loading, user, userData, router]);

  useEffect(() => {
    async function loadActionCenter() {
      if (!user || !userData) return;
      setLoadError('');
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const classIds = userDoc.exists() ? userDoc.data().classIds || [] : [];

        let classList = await getClassesByIds(classIds);
        if (!classList.length) {
          classList = await getTeacherClasses(user.uid);
        }

        setClasses(classList || []);
        if (classList?.length) {
          setSelectedClassId((prev) => prev || classList[0].id);
          setGoalKg(String(classList[0].weeklyGoalKg || classList[0].weeklyGoal || ''));
        }
      } catch (error) {
        console.error('Failed loading action center:', error);
        setLoadError('Klarte ikke laste handlingssenteret.');
      }
    }
    loadActionCenter();
  }, [user, userData]);

  useEffect(() => {
    async function loadClassData() {
      if (!selectedClass) return;
      try {
        const [leaderboard, binsSnap, usersSnap, classActivities] = await Promise.all([
          selectedClass.schoolId ? getSchoolLeaderboard(selectedClass.schoolId) : Promise.resolve([]),
          getDocs(query(collection(db, 'bins'), where('classId', '==', selectedClass.id))),
          getDocs(query(collection(db, 'users'), where('classId', '==', selectedClass.id), where('role', '==', 'student'))),
          getActivityFeed(selectedClass.id, 10),
        ]);

        const rankIndex = leaderboard.findIndex((entry) => entry.id === selectedClass.id);
        setSchoolRank(rankIndex >= 0 ? rankIndex + 1 : null);
        setSchoolTotal(leaderboard.length || 0);

        const mergedActivities = [...(classActivities || [])].sort((a, b) => {
          const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
          const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
          return bTime - aTime;
        });
        setActivityLog(mergedActivities);

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const logsSnap = await getDocs(query(collection(db, 'waste_logs'), where('classId', '==', selectedClass.id)));
        const recentCount = logsSnap.docs.filter((item) => {
          const date = item.data().timestamp?.toDate ? item.data().timestamp.toDate() : new Date(item.data().timestamp);
          return date >= sevenDaysAgo;
        }).length;

        const nextStudents = usersSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
        setStudents(nextStudents);

        const nextAlerts = [];
        if (recentCount < 5) {
          nextAlerts.push({ type: 'low_activity', title: 'Lav aktivitet', message: `${selectedClass.name} har kun ${recentCount} registreringer siste 7 dager.` });
        }

        const bins = binsSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
        const staleBins = bins.filter((bin) => {
          const updated = bin.lastUpdated?.toDate ? bin.lastUpdated.toDate() : new Date(bin.lastUpdated || 0);
          return (Date.now() - updated.getTime()) / (1000 * 60 * 60) > 72;
        });
        if (staleBins.length) {
          nextAlerts.push({ type: 'bin_stale', title: 'Botter trenger oppfolging', message: `${staleBins.length} botter er ikke tomt siste 72 timer.` });
        }

        const lostStreak = nextStudents.filter((student) => (student.currentStreak || 0) === 0 && (student.longestStreak || 0) >= 3);
        if (lostStreak.length) {
          nextAlerts.push({ type: 'streak_loss', title: 'Streak-varsel', message: `${lostStreak.length} elever har mistet streak.` });
        }

        setAlerts(nextAlerts);
      } catch (error) {
        console.error('Failed loading class details:', error);
      }
    }
    loadClassData();
  }, [selectedClass]);

  const handleSendUpdate = async () => {
    if (!selectedClass || !message.trim()) return toast.error('Skriv en oppdatering forst.');
    setWorking(true);
    try {
      await createAnnouncement({
        classId: selectedClass.id,
        authorUid: user.uid,
        authorName: userData?.name || 'Laerer',
        title: 'Klasseoppdatering',
        body: message.trim(),
      });
      setMessage('');
      toast.success('Oppdatering sendt til klassen.');
    } catch (error) {
      console.error(error);
      toast.error('Klarte ikke sende oppdatering.');
    } finally {
      setWorking(false);
    }
  };

  const handleSetGoal = async () => {
    if (!selectedClass) return;
    const value = parseFloat(goalKg);
    if (Number.isNaN(value) || value <= 0) return toast.error('Skriv inn et gyldig ukesmal.');
    setWorking(true);
    try {
      await setClassWeeklyGoalKg(selectedClass.id, value);
      toast.success('Ukesmal oppdatert.');
    } catch (error) {
      toast.error('Klarte ikke oppdatere mal.');
    } finally {
      setWorking(false);
    }
  };

  const handleBonus = async () => {
    const points = parseInt(bonusValue, 10);
    if (!points || points <= 0) return toast.error('Ugyldig bonusverdi.');
    if (!selectedClass) return;

    setWorking(true);
    try {
      if (bonusTarget === 'class') {
        await addBonusPointsToClass(selectedClass.id, points, 'Teacher Action Center bonus');
      } else {
        if (!bonusUserId.trim()) return toast.error('Velg en elev.');
        await addBonusPointsToUser(bonusUserId.trim(), points, 'Teacher Action Center bonus');
      }
      toast.success('Bonus-EcoPoints sendt.');
    } catch (error) {
      toast.error('Klarte ikke sende bonus.');
    } finally {
      setWorking(false);
    }
  };

  const handleExportPdf = () => {
    if (!selectedClass) return;
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) return toast.error('Tillat popup for PDF-eksport.');

    popup.document.write(`
      <html>
        <head><title>BioBin X - ${selectedClass.name}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h1>Klasserapport: ${selectedClass.name}</h1>
          <p>Generert: ${new Date().toLocaleString('nb-NO')}</p>
          <p>EcoPoints: ${selectedClass.totalPoints || selectedClass.ecoPoints || 0}</p>
          <p>Rank i skole: ${schoolRank || '-'} / ${schoolTotal || '-'}</p>
          <h2>Siste handlinger</h2>
          <ul>
            ${activityLog.slice(0, 10).map((item) => `<li>${item.message || item.type} - ${formatTime(item.timestamp)}</li>`).join('')}
          </ul>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  if (loading || !userData) {
    return (
      <Layout>
        <LoadingScreen title="Laster handlingssenter" description="Henter klasser, varsler og siste aktivitet." />
      </Layout>
    );
  }

  return (
    <Layout>
      <Page className="space-y-6" width="max-w-6xl">
        <PageHeader
          eyebrow="Handlingssenter"
          title="Fang opp det som trenger oppfolging denne uken"
          description="Dette er stedet for raske laererhandlinger: sende oppdatering, justere ukesmal, gi bonus og plukke opp svake signaler for aktiviteten stopper helt."
          meta={[selectedClass?.name || 'Ingen klasse valgt', `${alerts.length} aktive varsler`, `${activityLog.length} nylige hendelser`]}
          actions={
            <select
              value={selectedClassId}
              onChange={(event) => {
                const nextId = event.target.value;
                setSelectedClassId(nextId);
                const nextClass = classes.find((item) => item.id === nextId);
                setGoalKg(String(nextClass?.weeklyGoalKg || nextClass?.weeklyGoal || ''));
              }}
              className="bio-input w-72"
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          }
        />

        {loadError ? (
          <div className="rounded-2xl border border-red-500/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">{loadError}</div>
        ) : null}

        {!classes.length ? (
          <EmptyState
            icon={BellRing}
            title="Ingen klasser koblet til handlingssenteret"
            description="Nar du har opprettet eller koblet deg til en klasse, dukker varsler, meldinger og raske handlinger opp her."
          />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-4">
              <MetricCard icon={TrendingUp} tone="earth" label="Plass i skole" value={schoolRank ? `#${schoolRank}` : '-'} meta={schoolTotal ? `Av ${schoolTotal} klasser` : 'Ikke rangert enda'} />
              <MetricCard icon={AlertTriangle} tone="neutral" label="Aapne varsler" value={alerts.length} meta="Lav aktivitet, botter og streak-tap" />
              <MetricCard icon={BellRing} tone="brand" label="Nye handlinger" value={activityLog.length} meta="Aktivitet loggfort pa valgt klasse" />
              <MetricCard icon={Target} tone="moss" label="Ukesmal" value={`${selectedClass?.weeklyGoalKg || selectedClass?.weeklyGoal || 0} kg`} meta="Kan oppdateres direkte fra denne siden" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <SectionCard title="Klasseoppdatering" description="Skriv korte og konkrete meldinger som hjelper elevene med hva de skal gjore videre.">
                <div className="space-y-4">
                  <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="bio-input min-h-28" placeholder="Eksempel: Husk registrering etter lunsj i dag. Vi mangler fortsatt aktivitet fra to grupper." />
                  <button onClick={handleSendUpdate} disabled={working || !message.trim()} className="btn-primary w-full py-4">
                    {working ? <Loader2 size={16} className="animate-spin" /> : <BellRing size={16} />}
                    Send klasseoppdatering
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Klasseinnsikt" description="En komprimert status for klassen du har valgt akkurat na.">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3"><span className="text-slate-400">Poeng</span><span className="font-600 text-white">{selectedClass?.totalPoints || selectedClass?.ecoPoints || 0}</span></div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3"><span className="text-slate-400">Skolerangering</span><span className="font-600 text-white">{schoolRank || '-'} / {schoolTotal || '-'}</span></div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3"><span className="text-slate-400">Ukesmal</span><span className="font-600 text-white">{selectedClass?.weeklyGoalKg || selectedClass?.weeklyGoal || 0} kg</span></div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3"><span className="text-slate-400">Elever</span><span className="font-600 text-white">{students.length}</span></div>
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <SectionCard title="Juster ukesmal" description="Brukes nar klassen trenger et mer realistisk eller mer ambisiost mal for denne perioden.">
                <div className="space-y-4">
                  <input value={goalKg} onChange={(event) => setGoalKg(event.target.value)} className="bio-input" placeholder="Ukesmal (kg)" />
                  <button onClick={handleSetGoal} disabled={working} className="btn-primary w-full py-4">
                    {working ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
                    Oppdater ukesmal
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Gi bonus-EcoPoints" description="Bruk dette sparsomt for konkrete hendelser som ekstra innsats, kampanjer eller ukesavslutning.">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select value={bonusTarget} onChange={(event) => setBonusTarget(event.target.value)} className="bio-input">
                      <option value="class">Hele klassen</option>
                      <option value="student">En elev</option>
                    </select>
                    <input value={bonusValue} onChange={(event) => setBonusValue(event.target.value)} className="bio-input" placeholder="Bonuspoeng" />
                  </div>
                  {bonusTarget === 'student' ? (
                    <select value={bonusUserId} onChange={(event) => setBonusUserId(event.target.value)} className="bio-input">
                      <option value="">Velg elev</option>
                      {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                    </select>
                  ) : null}
                  <button onClick={handleBonus} disabled={working} className="btn-primary w-full py-4">
                    {working ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
                    Send bonus
                  </button>
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="Varsler" description="Automatisk genererte signaler som forteller hvor du bor folge opp manuelt i stedet for a lete etter problemet selv.">
                <div className="space-y-3">
                  {!alerts.length ? (
                    <EmptyState icon={AlertTriangle} title="Ingen kritiske varsler akkurat na" description="Aktiviteten ser stabil ut. Kom tilbake senere hvis du vil kontrollere utviklingen pa nytt." />
                  ) : (
                    alerts.map((item) => (
                      <div key={item.type} className="rounded-2xl border border-amber-500/18 bg-amber-500/10 p-4">
                        <div className="flex items-center gap-2 text-sm font-600 text-amber-200"><AlertTriangle size={14} /> {item.title}</div>
                        <p className="mt-2 text-sm leading-6 text-amber-50/80">{item.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Aktivitetslogg" description="Gir deg den korte historien du trenger for a forsta hva som faktisk har skjedd i klassen nylig.">
                <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                  {!activityLog.length ? (
                    <EmptyState icon={Clock3} title="Ingen handlinger registrert enda" description="Nar klassen begynner a registrere og laereren sender oppdateringer, dukker det opp en logg her." />
                  ) : (
                    activityLog.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                        <div className="text-sm text-white">{item.message || 'Laererhandling'}</div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500"><Clock3 size={12} /> {formatTime(item.timestamp)}</div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Eksport og oppsummering" description="Nar du skal ta med innsikten videre til rapport eller samtale, kan du hente en enkel PDF-versjon direkte herfra.">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm leading-7 text-slate-300">
                  Klassen {selectedClass?.name || ''} ligger {schoolRank ? `pa plass ${schoolRank} av ${schoolTotal}` : 'ikke rangert enda'} og har {activityLog.length} nylige loggforinger som kan brukes i videre oppfolging.
                </div>
                <button onClick={handleExportPdf} className="btn-secondary px-5 py-3"><FileText size={16} /> Eksporter PDF-rapport</button>
              </div>
            </SectionCard>
          </>
        )}
      </Page>
    </Layout>
  );
}
