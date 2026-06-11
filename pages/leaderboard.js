// pages/leaderboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Crown, Star, Trophy, Users } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { getStudentLeaderboard, getClassLeaderboard, getAllSchools, getSchoolStudentLeaderboard, getSchoolLeaderboard } from '../firebase/db';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';
import { EmptyState, LoadingScreen, Page, PageHeader, SectionCard, SegmentedControl, TonePill } from '../components/ui/AppPrimitives';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { isDemo, demoData } = useDemo();
  const [tab, setTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('all');

  useEffect(() => {
    if (!authLoading && !user && !isDemo) {
      router.push('/auth/login');
    }
  }, [user, authLoading, isDemo, router]);

  useEffect(() => {
    if (isDemo) {
      setSchools([demoData.school]);
      setSelectedSchool(demoData.school.id);
      setLoading(false);
      return;
    }
    getAllSchools().then((data) => setSchools(data || [])).catch(() => setSchools([]));
  }, [isDemo, demoData.school]);

  useEffect(() => {
    setLoading(true);

    if (isDemo) {
      const demoClasses = demoData.classRanking.map((entry) => {
        const matchingClass = demoData.classes.find((cls) => cls.id === entry.classId);
        return {
          id: entry.classId,
          name: entry.className,
          totalWaste: matchingClass?.weeklyStats?.weight || 0,
          totalPoints: entry.score,
        };
      });

      setStudents(demoData.studentLeaderboard || []);
      setClasses(demoClasses);
      setLoading(false);
      return;
    }

    const request = selectedSchool === 'all'
      ? Promise.all([getStudentLeaderboard(), getClassLeaderboard()])
      : Promise.all([getSchoolStudentLeaderboard(selectedSchool), getSchoolLeaderboard(selectedSchool)]);

    request
      .then(([studentData, classData]) => {
        setStudents(studentData || []);
        setClasses(classData || []);
        setLoading(false);
      })
      .catch(() => {
        setStudents([]);
        setClasses([]);
        setLoading(false);
      });
  }, [selectedSchool, isDemo, demoData]);

  if (authLoading) {
    return (
      <Layout>
        <LoadingScreen title="Laster rangering" description="Henter siste poeng og klasseaktivitet." />
      </Layout>
    );
  }

  const activeList = tab === 'students' ? students : classes;

  return (
    <Layout>
      <Page className="space-y-6" width="max-w-4xl">
        <PageHeader
          eyebrow="Rangering"
          title="Synlig progresjon, ikke bare pyntet konkurranse"
          description="Rangeringen fungerer best nar den viser faktisk aktivitet. Bruk den til a skape retning, ikke bare for a pynte dashboardet med medaljer."
          meta={[selectedSchool === 'all' ? 'Alle skoler' : 'Filtrert visning', isDemo ? 'Demo-data' : 'Live-data']}
          actions={<SegmentedControl value={tab} onChange={setTab} items={[{ id: 'students', label: 'Elever', icon: Star }, { id: 'classes', label: 'Klasser', icon: Users }]} />}
        />

        {schools.length > 0 && (
          <SectionCard title="Skolefilter" description="Begrens rangeringen til en skole nar du vil sammenligne innenfor samme kontekst.">
            <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} className="bio-input max-w-sm">
              <option value="all">Alle skoler</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </SectionCard>
        )}

        <SectionCard
          title={tab === 'students' ? 'Elevrangering' : 'Klasserangering'}
          description={tab === 'students' ? 'Viser hvilke elever som registrerer jevnt og holder aktiviteten oppe.' : 'Viser hvilke klasser som faktisk bidrar mest denne perioden.'}
        >
          {loading ? (
            <LoadingScreen title="Oppdaterer rangering" description="Sorterer poeng og vekter for valgt visning." />
          ) : activeList.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Ingen data enda"
              description="Nar elever og klasser begynner a registrere aktivitet, dukker rangeringen opp her med reelle poeng og mengder."
            />
          ) : (
            <div className="space-y-3">
              {activeList.map((item, index) => {
                const itemId = item.uid || item.id;
                const isMe = tab === 'students' && itemId === user?.uid;
                const points = (tab === 'students' ? item.points : item.totalPoints) || 0;
                const waste = (item.totalWaste || 0).toFixed(1);

                return (
                  <div
                    key={itemId}
                    className={`flex items-center gap-4 rounded-[24px] border px-4 py-4 ${index < 3 ? 'border-white/8 bg-white/6' : 'border-white/6 bg-white/3'} ${isMe ? 'ring-1 ring-bio-500/35' : ''}`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/4 text-lg text-white">
                      {index < 3 ? RANK_MEDALS[index] : index + 1}
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-sm font-700 text-white">
                      {item.name?.[0]?.toUpperCase() || '?'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`truncate text-sm font-600 ${isMe ? 'text-bio-100' : 'text-white'}`}>{item.name}</div>
                        {index === 0 ? <TonePill tone="earth"><Crown size={12} /> Leder</TonePill> : null}
                        {isMe ? <TonePill tone="brand">Deg</TonePill> : null}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {tab === 'students' ? `${waste} kg registrert` : `${waste} kg · ${points.toLocaleString('no-NO')} poeng`}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-700 text-white">{points.toLocaleString('no-NO')}</div>
                      <div className="text-xs text-slate-500">poeng</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </Page>
    </Layout>
  );
}
