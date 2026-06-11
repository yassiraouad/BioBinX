// pages/stats.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2, Globe, Leaf, TrendingUp, Wind, Zap } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';
import { getUserLogs, getGlobalStats } from '../firebase/db';
import { calculateEnergy, calculateCO2Saved, getWeeklyData } from '../utils/calculator';
import { EmptyState, LoadingScreen, MetricCard, Page, PageHeader, SectionCard, SegmentedControl, TonePill } from '../components/ui/AppPrimitives';

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

export default function Stats() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { isDemo, demoData, localState } = useDemo();
  const [logs, setLogs] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [tab, setTab] = useState('personal');

  useEffect(() => {
    if (!loading && !user && !isDemo) {
      router.push('/auth/login');
    }
  }, [user, loading, isDemo, router]);

  useEffect(() => {
    if (isDemo) {
      const demoLogs = (demoData.weeklyWasteData || []).map((entry, index) => ({
        timestamp: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000),
        weight: entry.weight,
      }));
      setLogs(demoLogs);
      setWeeklyData(demoData.weeklyWasteData || getWeeklyData(demoLogs));
      setGlobalStats({
        totalWaste: demoData.classes.reduce((sum, current) => sum + current.weeklyStats.weight, 0),
        totalEnergy: demoData.classes.reduce((sum, current) => sum + current.weeklyStats.weight * 0.5, 0),
        totalCO2: demoData.classes.reduce((sum, current) => sum + current.weeklyStats.weight * 0.8, 0),
        activeUsers: demoData.classes.reduce((sum, current) => sum + current.students, 0),
        totalScans: demoData.classes.reduce((sum, current) => sum + current.weeklyStats.empties * 10, 0),
        totalLogs: demoData.classes.reduce((sum, current) => sum + current.weeklyStats.empties * 10, 0),
      });
      return;
    }

    if (user) {
      getUserLogs(user.uid)
        .then((userLogs) => {
          setLogs(userLogs || []);
          setWeeklyData(getWeeklyData(userLogs || []));
        })
        .catch(() => {
          setLogs([]);
          setWeeklyData([]);
        });
    }
    getGlobalStats().then((stats) => setGlobalStats(stats)).catch(() => setGlobalStats(null));
  }, [user, isDemo, demoData]);

  if (loading) {
    return (
      <Layout>
        <LoadingScreen title="Laster statistikk" description="Henter aktivitet, klimapavirkning og skoleoversikt." />
      </Layout>
    );
  }

  const totalWaste = isDemo ? localState.totalWeight : (userData?.totalWaste || 0);
  const energy = isDemo ? (demoData.dashboard?.energyGeneratedKwh || 0) : calculateEnergy(totalWaste);
  const co2 = isDemo ? (demoData.dashboard?.co2SavedKg || 0) : calculateCO2Saved(totalWaste);

  return (
    <Layout>
      <Page className="space-y-6" width="max-w-6xl">
        <PageHeader
          eyebrow="Statistikk"
          title="Gor registreringer om til forstaelige signaler"
          description="Her kan du se bade egen utvikling og den storre skolekonteksten. Maalet er ikke flest mulig kort, men nok innsikt til a kunne handle pa den."
          meta={[`${logs.length} registreringer`, isDemo ? 'Demo-data' : 'Live-data']}
          actions={
            <SegmentedControl
              value={tab}
              onChange={setTab}
              items={[
                { id: 'personal', label: 'Min aktivitet' },
                { id: 'global', label: 'Skoleoversikt' },
              ]}
            />
          }
        />

        {tab === 'personal' ? (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <MetricCard icon={Leaf} tone="brand" label="Matavfall totalt" value={`${totalWaste.toFixed(1)} kg`} meta={`${logs.length} registreringer pa kontoen din`} />
              <MetricCard icon={Zap} tone="moss" label="Energi produsert" value={`${energy.toFixed(2)} kWh`} meta="Omtrentlig biogasspotensial fra registrert mengde" />
              <MetricCard icon={Wind} tone="neutral" label="CO2 spart" value={`${co2.toFixed(2)} kg`} meta="Sammenlignet med at avfallet ikke blir utnyttet" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <SectionCard title="Ukentlig utvikling" description="Viser hvilke dager du faktisk har registrert aktivitet. Tomme dager er viktige fordi de viser nar rutinen stopper opp.">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="statsChart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8dbb95" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8dbb95" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="weight" stroke="#8dbb95" fill="url(#statsChart)" strokeWidth={2.4} dot={{ fill: '#8dbb95', r: 4, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </SectionCard>

              <SectionCard title="Datakvalitet" description="Ikke all innsikt er tilgjengelig bare fordi det finnes et fint diagram. Denne delen forklarer hva som faktisk er klart i datagrunnlaget ditt.">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-600 text-white">Kategorifordeling av matavfall</div>
                        <div className="mt-1 text-xs text-slate-500">Krever flere AI-merkede kast for a bli presis.</div>
                      </div>
                      <TonePill>Under oppbygging</TonePill>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm leading-7 text-slate-300">
                    Fortsett a registrere med bilde og vekt. Nar flere kast er analysert, kan produktet vise mer troverdig fordeling av typer matavfall i stedet for faste prosentkort.
                  </div>
                </div>
              </SectionCard>
            </div>
          </>
        ) : globalStats ? (
          <>
            <div className="grid gap-4 lg:grid-cols-4">
              <MetricCard icon={Leaf} tone="brand" label="Total avfallsmengde" value={`${(globalStats.totalWaste || 0).toFixed(0)} kg`} meta="Registrert pa tvers av skolen" />
              <MetricCard icon={Zap} tone="moss" label="Energi totalt" value={`${(globalStats.totalEnergy || 0).toFixed(0)} kWh`} meta="Samlet omtrentlig energiutbytte" />
              <MetricCard icon={Wind} tone="neutral" label="CO2 spart" value={`${(globalStats.totalCO2 || 0).toFixed(0)} kg`} meta="Samlet klimaeffekt basert pa registreringer" />
              <MetricCard icon={Globe} tone="earth" label="Registreringer" value={globalStats.totalLogs || 0} meta={`${globalStats.activeUsers || 0} aktive brukere i datagrunnlaget`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <SectionCard title="Skoleoversikt" description="Dette er tallene som er mest nyttige i oppfolgingen: hvor mye som er registrert, hvor stor aktiviteten er og om datagrunnlaget virker levende.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Aktive brukere', value: globalStats.activeUsers || 0 },
                    { label: 'Loggførte kast', value: globalStats.totalLogs || 0 },
                    { label: 'Estimert bilkjøring spart', value: `${((globalStats.totalCO2 || 0) * 4).toFixed(0)} km` },
                    { label: 'Tilsvarende trær per ar', value: `${Math.round((globalStats.totalCO2 || 0) / 21)} traer` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <div className="text-xs uppercase tracking-[0.08em] text-slate-500">{item.label}</div>
                      <div className="mt-2 text-2xl font-700 text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Les dette riktig" description="Skolefanen er laget for sammenheng, ikke pynt. Bruk tallene som grunnlag for oppfolging og sammenligning over tid.">
                <div className="space-y-3 text-sm leading-7 text-slate-300">
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                    Flere registreringer betyr ikke automatisk bedre kvalitet. Det viktigste er jevn aktivitet pa tvers av klasser og at registreringene faktisk stemmer med hverdagen.
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                    Hvis tallene her ser lave ut, er det et signal om at onboarding, klassekoder eller oppfolging i laererflaten trenger justering.
                  </div>
                </div>
              </SectionCard>
            </div>
          </>
        ) : (
          <EmptyState
            icon={BarChart2}
            title="Ingen skoledata tilgjengelig enda"
            description="Nar flere brukere og klasser registrerer aktivitet, dukker skoleoversikten opp her med mer relevant sammenligning."
          />
        )}
      </Page>
    </Layout>
  );
}
