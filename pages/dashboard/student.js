// pages/dashboard/student.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/layout/Layout';
import { getUserLogs, getWeeklyWaste, dailyCheckIn } from '../../firebase/db';
import { getRank, calculateEnergy, calculateCO2Saved } from '../../utils/calculator';
import {
  ArrowRight,
  Camera,
  CheckCircle,
  Flame,
  Leaf,
  Star,
  TrendingUp,
  Users,
  Wind,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ALL_BADGES } from '../../firebase/db';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GroupStats from '../../components/GroupStats';
import EcoLevelBadge from '../../components/EcoLevelBadge';
import CO2Prognose from '../../components/CO2Prognose';
import WeeklyQuiz from '../../components/WeeklyQuiz';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { getTopStreaksByClass, syncStreakDecay } from '../../lib/streak';
import { EmptyState, LoadingScreen, MetricCard, Page, PageHeader, SectionCard, TonePill } from '../../components/ui/AppPrimitives';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-white/8 bg-dark-800 px-3 py-2 text-sm shadow-bio">
        <p className="text-slate-400">{label}</p>
        <p className="font-600 text-white">{payload[0].value} kg</p>
      </div>
    );
  }
  return null;
};

export default function StudentDashboard() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [weeklyWaste, setWeeklyWaste] = useState(0);
  const [checkingIn, setCheckingIn] = useState(false);
  const [topStreaks, setTopStreaks] = useState([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!loading && user) {
      if (userData?.role === 'teacher' || userData?.role === 'admin' || userData?.role === 'rector') {
        router.push('/dashboard/teacher');
      }
    }
  }, [user, userData, loading, router]);

  useEffect(() => {
    if (user) {
      getUserLogs(user.uid)
        .then((userLogs) => {
          setLogs(userLogs || []);
          const days = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lor', 'Son'];
          const weekData = days.map((day, i) => {
            const date = new Date();
            date.setDate(date.getDate() - date.getDay() + i + 1);
            const dayLogs = (userLogs || []).filter((log) => {
              if (!log.timestamp) return false;
              const current = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
              return current.toDateString() === date.toDateString();
            });
            return { day, weight: parseFloat(dayLogs.reduce((sum, log) => sum + (log.weight || 0), 0).toFixed(2)) };
          });
          setChartData(weekData);
        })
        .catch((err) => {
          console.error('Error loading logs:', err);
          setLogs([]);
          setChartData([]);
        });
    }
  }, [user]);

  useEffect(() => {
    if (user && userData) {
      syncStreakDecay(user.uid)
        .then((result) => {
          if (result?.reset) {
            refreshUserData();
          }
        })
        .catch(() => {});

      getWeeklyWaste(user.uid, userData.classId).then(setWeeklyWaste).catch(() => setWeeklyWaste(0));
      if (userData.classId) {
        getTopStreaksByClass(userData.classId, 5).then(setTopStreaks).catch(() => setTopStreaks([]));
      }
    }
  }, [user, userData, refreshUserData]);

  if (loading || !userData) {
    return (
      <Layout>
        <LoadingScreen title="Laster elevoversikten" description="Henter poeng, aktivitet og fremdrift for denne uken." />
      </Layout>
    );
  }

  const totalWaste = userData?.totalWaste || 0;
  const energy = calculateEnergy(totalWaste);
  const co2 = calculateCO2Saved(totalWaste);
  const rank = getRank(userData?.points || 0);
  const earnedBadges = userData?.badges || [];
  const today = new Date().toDateString();
  const lastCheckin = userData?.lastCheckin ? new Date(userData.lastCheckin).toDateString() : null;
  const checkedInToday = lastCheckin === today;
  const firstName = userData.name?.split(' ')[0] || 'der';
  const sectionMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-80px' },
        transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
      };

  const checkInAction = async () => {
    if (checkedInToday || checkingIn) return;
    setCheckingIn(true);
    try {
      const result = await dailyCheckIn(user.uid, userData?.classId);
      if (result?.streak) {
        await refreshUserData();
        toast.success(`Sjekket inn! ${result.streak} dagers streak`);
      } else if (result?.alreadyCheckedIn) {
        toast('Allerede sjekket inn i dag');
      }
    } catch (err) {
      toast.error('Klarte ikke sjekke inn');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <Layout>
      <Page className="space-y-6" width="max-w-6xl">
        <motion.div {...sectionMotion}>
          <PageHeader
            eyebrow={`Hei ${firstName}`}
            title={`Du er ${rank.name} akkurat na`}
            description="Her ser du hva som er registrert denne uken, hva klassen jobber mot og hvilken handling som gir mest mening akkurat i dag."
            meta={[
              `${(userData.points || 0).toLocaleString('no-NO')} poeng`,
              userData.className || 'Ingen klasse valgt',
              `${logs.length} registreringer totalt`,
            ]}
            actions={
              <Link href="/scan" className="btn-primary px-5 py-3">
                Registrer matavfall
                <ArrowRight size={16} />
              </Link>
            }
          />
        </motion.div>

        <motion.div className="grid gap-4 lg:grid-cols-4" {...sectionMotion}>
          <MetricCard icon={Star} tone="earth" label="Poeng" value={(userData.points || 0).toLocaleString('no-NO')} meta="Oppdateres ved registrering og klassebonus" />
          <MetricCard icon={Leaf} tone="brand" label="Matavfall registrert" value={`${totalWaste.toFixed(1)} kg`} meta="All historikk pa kontoen din" />
          <MetricCard icon={Zap} tone="moss" label="Energi estimert" value={`${energy.toFixed(1)} kWh`} meta="Basert pa samlet mengde matavfall" />
          <MetricCard icon={Wind} tone="neutral" label="CO2 spart" value={`${co2.toFixed(1)} kg`} meta="Viser omtrentlig klimaeffekt" />
        </motion.div>

        <motion.div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]" {...sectionMotion}>
          <SectionCard
            title="Neste anbefalte handling"
            description="Det viktigste du kan gjore akkurat na er a registrere neste kast sa klassen holder aktiviteten oppe."
          >
            <Link href="/scan" className="group block rounded-[24px] border border-bio-500/18 bg-bio-500/12 p-5 transition-all hover:border-bio-500/30 hover:bg-bio-500/14">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-700 text-white">Apne skanneren</div>
                  <p className="mt-2 max-w-lg text-sm leading-7 text-slate-300">Ta bilde av matavfallet, legg inn vekt og fa poeng med en gang. Registreringen dukker opp i aktivitetsloggen din og teller mot klassemlet.</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-bio-100">
                  <Camera size={24} />
                </div>
              </div>
            </Link>
          </SectionCard>

          <SectionCard
            title="Daglig innsjekk"
            description="Brukes for a holde streaken i live og fa et lite daglig puff tilbake til plattformen."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                <div>
                  <div className="text-sm font-600 text-white">Navaerende streak</div>
                  <div className="mt-1 text-xs text-slate-500">Lengste streak: {userData?.longestStreak || 0} dager</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-700 text-orange-300">{userData?.currentStreak || 0}</div>
                  <div className="text-xs text-slate-500">dager</div>
                </div>
              </div>

              <button
                onClick={checkInAction}
                disabled={checkedInToday || checkingIn}
                className={`w-full rounded-2xl px-4 py-4 text-sm font-600 transition-all ${checkedInToday ? 'border border-bio-500/18 bg-bio-500/12 text-bio-100' : 'btn-secondary justify-center text-white'}`}
              >
                {checkingIn ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sjekker inn
                  </span>
                ) : checkedInToday ? (
                  <span className="inline-flex items-center gap-2"><CheckCircle size={16} /> Sjekket inn i dag</span>
                ) : (
                  <span className="inline-flex items-center gap-2"><Flame size={16} /> Sjekk inn for +10 poeng</span>
                )}
              </button>
            </div>
          </SectionCard>
        </motion.div>

        <motion.div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]" {...sectionMotion}>
          <SectionCard
            title="Denne uken"
            description="En enkel oppsummering av hvordan aktiviteten din og klassen din beveger seg gjennom uken."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                <div className="text-xs uppercase tracking-[0.08em] text-slate-500">Klassemiljo</div>
                <div className="mt-2 text-2xl font-700 text-white">{weeklyWaste.toFixed(1)} kg</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">Registrert denne uken i klassen din. Hold flyten oppe for a bidra til ukesmalet.</p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                <div className="text-xs uppercase tracking-[0.08em] text-slate-500">Min gruppe</div>
                {userData.groupId ? (
                  <>
                    <div className="mt-2 text-lg font-700 text-white">{userData.groupName}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Koblet til {userData.className || 'klassen din'} og klar for felles progresjon.</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-400">Du er ikke koblet til en gruppe enda. Leren kan legge deg til senere fra klasseoversikten.</p>
                )}
              </div>
            </div>

            {topStreaks.length > 0 && (
              <div className="mt-4 rounded-[24px] border border-white/8 bg-white/4 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-600 text-white">Streak-toppliste i klassen</div>
                    <div className="text-xs text-slate-500">Viser hvem som holder vanen varm over tid.</div>
                  </div>
                  <TrendingUp size={16} className="text-bio-200" />
                </div>
                <div className="space-y-2">
                  {topStreaks.map((entry) => (
                    <div key={entry.uid} className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/3 px-3 py-3 text-sm">
                      <span className="text-slate-200">#{entry.rank} {entry.name}</span>
                      <span className="font-600 text-orange-300">{entry.currentStreak} dager</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <div className="space-y-4">
            <div className="bio-card p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-600 text-white">Niva og progresjon</div>
                  <div className="text-xs text-slate-500">Viser hvordan kontoen din utvikler seg over tid.</div>
                </div>
                <TonePill tone="earth">{rank.name}</TonePill>
              </div>
              <EcoLevelBadge userData={userData} />
            </div>

            <SectionCard
              title="Badges"
              description="Ikke samleobjekter uten mening. Disse viser hvilke typer aktivitet du faktisk har fullfort."
              action={<span className="text-sm text-slate-500">{earnedBadges.length}/{ALL_BADGES.length}</span>}
            >
              <div className="grid grid-cols-2 gap-3">
                {ALL_BADGES.slice(0, 6).map((badge) => {
                  const earned = earnedBadges.includes(badge.id);
                  return (
                    <div key={badge.id} className={`rounded-2xl p-4 text-center ${earned ? 'badge-earned' : 'badge-locked'}`}>
                      <div className="mb-2 text-2xl">{badge.icon}</div>
                      <div className={`text-sm font-700 ${earned ? 'text-white' : 'text-slate-500'}`}>{badge.name}</div>
                      <div className={`mt-1 text-xs ${earned ? 'text-bio-100' : 'text-slate-600'}`}>{badge.description}</div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </motion.div>

        <motion.div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]" {...sectionMotion}>
          <SectionCard title="Aktivitet denne uken" description="Viser hvor mye du har registrert per dag. Tomme dager er nyttige fordi de viser nar vanen glipper.">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="studentChart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8dbb95" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8dbb95" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="weight" stroke="#8dbb95" fill="url(#studentChart)" strokeWidth={2.4} dot={{ fill: '#8dbb95', r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Siste registreringer" description="Bruk denne historikken for a kontrollere hva som faktisk ble lagret pa kontoen din.">
            {logs.length === 0 ? (
              <EmptyState
                icon={Leaf}
                title="Ingen registreringer enda"
                description="Forste registrering blir liggende her sammen med vekt, dato og poeng. Start med et kast sa fylles historikken automatisk."
                action={<Link href="/scan" className="btn-primary">Apne skanneren</Link>}
              />
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {logs.slice(0, 5).map((log) => (
                    <motion.div
                      key={log.id}
                      layout
                      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                      className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/3 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-bio-500/15 bg-bio-500/12 text-lg">🥬</div>
                        <div>
                          <div className="text-sm font-600 text-white">{log.weight} kg matavfall</div>
                          <div className="text-xs text-slate-500">
                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleDateString('no-NO') : 'Ukjent dato'}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-600 text-bio-100">+{log.points} p</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </SectionCard>
        </motion.div>

        {userData.groupId && (
          <motion.div {...sectionMotion}>
            <GroupStats groupId={userData.groupId} teacherId={userData?.teacherId} />
          </motion.div>
        )}

        <motion.div className="grid gap-4 xl:grid-cols-2" {...sectionMotion}>
          <WeeklyQuiz userId={user?.uid} />
          <CO2Prognose />
        </motion.div>
      </Page>
    </Layout>
  );
}
