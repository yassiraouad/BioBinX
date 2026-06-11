import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import { useDemo } from '../../hooks/useDemo';
import { Camera, Trophy, Zap, Wind, Leaf, Star, TrendingUp, Users, CheckCircle, Flame, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const rankFromPoints = (points) => {
  if (points >= 1000) return { name: 'Eco Master', icon: '👑', color: '#f59e0b' };
  if (points >= 500) return { name: 'Eco Pro', icon: '🚀', color: '#22c55e' };
  if (points >= 250) return { name: 'Eco Hero', icon: '🌿', color: '#84cc16' };
  return { name: 'Eco Rookie', icon: '🌱', color: '#22c55e' };
};

const formatRelativeTime = (timestamp) => {
  const diffMs = Date.now() - timestamp;
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'akkurat naa';
  if (mins < 60) return `${mins} min siden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} t siden`;
  const days = Math.floor(hours / 24);
  return `${days} dager siden`;
};

export default function DemoStudentDashboard() {
  const { isDemo, demoUser, demoData, localState, updateLocalState } = useDemo();
  const router = useRouter();

  useEffect(() => {
    if (!isDemo) {
      router.push('/auth/login');
    }
  }, [isDemo, router]);

  const totalWaste = demoData.dashboard?.totalWasteKg ?? localState.totalWeight ?? 0;
  const energy = demoData.dashboard?.energyGeneratedKwh ?? totalWaste * 0.5;
  const co2 = demoData.dashboard?.co2SavedKg ?? totalWaste * 0.8;
  const weeklyGoalKg = demoData.dashboard?.weeklyGoalKg ?? 20;
  const progressPercent = demoData.dashboard?.progressPercent ?? Math.round((totalWaste / weeklyGoalKg) * 100);
  const rank = rankFromPoints(localState.points || 0);

  const weeklyData = useMemo(() => {
    if (demoData.weeklyWasteData?.length) {
      return demoData.weeklyWasteData;
    }

    const days = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
    const dayMap = days.reduce((acc, day) => ({ ...acc, [day]: 0 }), {});

    (localState.recentScans || []).forEach((scan) => {
      const date = new Date(scan.timestamp);
      const dayIndex = (date.getDay() + 6) % 7;
      const dayName = days[dayIndex];
      dayMap[dayName] += scan.weight || 0;
    });

    return days.map((day) => ({ day, weight: Number(dayMap[day].toFixed(2)) }));
  }, [demoData.weeklyWasteData, localState.recentScans]);

  const today = new Date().toDateString();
  const checkedInToday = localState.lastCheckin ? new Date(localState.lastCheckin).toDateString() === today : false;

  if (!isDemo || !demoUser) return null;

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">{rank.icon}</span>
            <h1 className="font-display font-700 text-white text-2xl lg:text-3xl">Hei, {demoUser.name.split(' ')[0]}! 👋</h1>
          </div>
          <p className="text-slate-400 font-body">
             Demo elevprofil i <span className="text-bio-400">{demoUser.className}</span> - {rank.name} med {localState.points || 0} poeng
          </p>
        </div>

        <div className="mb-6 animate-fade-in">
          <div className="bio-card p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-bio-500/15 flex items-center justify-center">
                <Users size={24} className="text-bio-400" />
              </div>
              <div>
                <h3 className="font-display font-700 text-white text-lg">Min gruppe</h3>
                <p className="text-slate-400 text-sm font-body">{demoUser.groupName || 'Arbeidsgruppe 1'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-bio-400 font-mono font-600">{demoUser.className}</p>
              <p className="text-slate-500 text-xs font-body">Klasse</p>
            </div>
          </div>
        </div>

        <div className="mb-6 animate-fade-in">
          <button
            onClick={() => {
              if (checkedInToday) {
                toast('Allerede sjekket inn i dag');
                return;
              }
              updateLocalState((prev) => ({
                streak: (prev.streak || 0) + 1,
                points: (prev.points || 0) + 10,
                lastCheckin: new Date().toISOString(),
              }));
              toast.success('Sjekket inn! +10 poeng');
            }}
            className={`w-full py-4 rounded-xl font-body font-600 flex items-center justify-center gap-3 transition-all ${
              checkedInToday
                ? 'bg-earth-500/20 border border-earth-500/30 text-earth-400'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 border border-orange-400/30 text-white hover:shadow-lg'
            }`}
          >
            {checkedInToday ? <><CheckCircle size={20} /> Sjekket inn i dag</> : <><Flame size={20} /> Sjekk inn i dag (+10 poeng)</>}
            {!checkedInToday && <span className="text-xs bg-orange-400/20 px-2 py-1 rounded-full">🔥 {localState.streak || 0} dager</span>}
          </button>
        </div>

        <Link href="/scan" className="block mb-6 animate-fade-in">
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-bio-600 to-bio-700 border border-bio-500/30 hover:shadow-bio-lg transition-all duration-300 group">
            <div className="relative flex items-center justify-between">
              <div>
                <div className="font-display font-700 text-white text-xl mb-1">Registrer matavfall</div>
                <div className="text-bio-100/70 text-sm font-body">Skann og synk demo-data til alle faner</div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <Camera size={28} className="text-white" />
              </div>
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Poeng', value: (localState.points || 0).toLocaleString('no-NO'), icon: Star, color: 'earth', unit: 'pts' },
            { label: 'Matavfall', value: totalWaste.toFixed(1), icon: Leaf, color: 'bio', unit: 'kg' },
            { label: 'Energi', value: energy.toFixed(1), icon: Zap, color: 'moss', unit: 'kWh' },
            { label: 'CO2 spart', value: co2.toFixed(1), icon: Wind, color: 'bio', unit: 'kg' },
          ].map(({ label, value, icon: Icon, color, unit }) => (
            <div key={label} className="bio-card p-5 animate-fade-in">
              <div className={`w-9 h-9 rounded-xl bg-${color}-500/15 flex items-center justify-center mb-3`}>
                <Icon size={18} className={`text-${color}-400`} />
              </div>
              <div className="font-display font-700 text-white text-2xl leading-tight">{value}</div>
              <div className="text-slate-500 text-xs font-body mt-1">{label} <span className="text-slate-600">({unit})</span></div>
            </div>
          ))}
        </div>

        <div className="bio-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-700 text-white text-lg">Ukesmal klasse 6B</h2>
            <span className="text-bio-300 font-mono text-sm">{progressPercent}%</span>
          </div>
          <div className="text-slate-400 text-sm font-body mb-3">
            {totalWaste.toFixed(1)} / {weeklyGoalKg} kg denne uken
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
            <div className="h-full rounded-full bg-bio-500" style={{ width: `${Math.min(100, progressPercent)}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-white font-display font-700 text-lg">{demoData.impact?.homesPowered ?? 0}</div>
              <div className="text-slate-500 text-xs">hjem drevet</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-white font-display font-700 text-lg">{demoData.impact?.phoneCharges ?? 0}</div>
              <div className="text-slate-500 text-xs">mobil-ladinger</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-white font-display font-700 text-lg">{demoData.impact?.mealsSaved ?? 0}</div>
              <div className="text-slate-500 text-xs">maltider reddet</div>
            </div>
          </div>
        </div>

        <div className="bio-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-700 text-white text-lg">Ukentlig oversikt</h2>
              <p className="text-slate-500 text-sm font-body">Demo skann registrert denne uken</p>
            </div>
            <TrendingUp size={18} className="text-bio-400" />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="bioGradDemo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="weight" stroke="#22c55e" fill="url(#bioGradDemo)" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bio-card p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-700 text-white text-lg">Badges</h2>
            <span className="text-bio-400 text-sm font-mono">
              {demoData.studentBadges.filter((badge) => badge.earned).length}/{demoData.studentBadges.length}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {demoData.studentBadges.map((badge) => (
              <div key={badge.id} className={`p-4 rounded-xl text-center transition-all ${badge.earned ? 'badge-earned' : 'badge-locked'}`}>
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className={`font-display font-700 text-sm ${badge.earned ? 'text-white' : 'text-slate-500'}`}>{badge.name}</div>
                <div className={`text-xs mt-1 font-body ${badge.earned ? 'text-bio-400' : 'text-slate-600'}`}>{badge.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bio-card p-6 mb-6">
          <h2 className="font-display font-700 text-white text-lg mb-5 flex items-center gap-2"><Target size={18} className="text-purple-400" /> Utfordringer</h2>
          <div className="space-y-3">
            {demoData.challenges.map((challenge) => (
              <div key={challenge.id} className="p-4 rounded-xl bg-white/3 border border-white/8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-display font-600">{challenge.title}</p>
                  <p className="text-bio-400 text-sm font-mono">{Math.round(challenge.progress * 100)}%</p>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${challenge.status === 'completed' ? 'bg-earth-500' : 'bg-bio-500'}`}
                    style={{ width: `${Math.round(challenge.progress * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bio-card p-6">
          <h2 className="font-display font-700 text-white text-lg mb-5 flex items-center gap-2"><Trophy size={18} className="text-earth-400" /> Siste registreringer</h2>
          {(localState.recentScans || []).length === 0 ? (
            <div className="text-center py-10 text-slate-500">Ingen registreringer ennå</div>
          ) : (
            <div className="space-y-3">
              {(localState.recentScans || []).slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-bio-500/10 flex items-center justify-center text-lg">🥬</div>
                    <div>
                      <div className="text-white text-sm font-body font-500">{log.weight} kg matavfall</div>
                      <div className="text-slate-500 text-xs font-body">{formatRelativeTime(log.timestamp)} - {log.className}</div>
                    </div>
                  </div>
                  <div className="text-bio-400 font-mono text-sm font-500">+{log.points} p</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
