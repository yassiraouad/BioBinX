import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/layout/Layout';
import { getLiveSession, getSessionPlayers, endQuiz, addEcoPoints, addActivityFeedEntry } from '../../firebase/db';
import { Trophy, Users, Loader, ArrowLeft, Home } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HostResults() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { session: sessionId } = router.query;
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (userData?.role !== 'teacher' && userData?.role !== 'admin' && userData?.role !== 'rector'))) {
      router.push('/auth/login');
    }
  }, [user, userData, loading]);

  useEffect(() => {
    if (!sessionId || !user) return;

    const loadSession = async () => {
      const s = await getLiveSession(sessionId);
      if (!s) {
        router.push('/dashboard/teacher');
        return;
      }
      if (s.teacherUid !== user.uid) {
        router.push('/dashboard/teacher');
        return;
      }
      setSession(s);

      const playerList = await getSessionPlayers(sessionId);
      setPlayers(playerList.sort((a, b) => b.totalScore - a.totalScore));
    };
    loadSession();
  }, [sessionId, user]);

  const handleFinish = async () => {
    setFinishing(true);
    try {
      const top3 = await endQuiz(sessionId);

      for (let i = 0; i < top3.length; i++) {
        const player = top3[i];
        const prize = i === 0 ? session.prizes.first : i === 1 ? session.prizes.second : session.prizes.third;
        
        await addEcoPoints(player.uid, prize);
        await addActivityFeedEntry(
          player.uid,
          `🏆 ${player.displayName} vant live-quizen og fikk ${prize} EcoPoints!`,
          'quiz_win',
          prize
        );
      }

      toast.success('Poeng er tildelt!');
      router.push('/dashboard/teacher');
    } catch (err) {
      console.error(err);
      toast.error('Kunne ikke fullføre');
    } finally {
      setFinishing(false);
    }
  };

  if (loading || !session) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader size={32} className="animate-spin text-bio-400" />
        </div>
      </Layout>
    );
  }

  const sortedPlayers = players.sort((a, b) => b.totalScore - a.totalScore);
  const top3 = sortedPlayers.slice(0, 3);
  const rest = sortedPlayers.slice(3);

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/teacher" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-700 text-white text-2xl">Quiz resultater</h1>
            <p className="text-slate-400 text-sm font-body">{session.questions?.length || 0} spørsmål</p>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-earth-400 to-earth-600 flex items-center justify-center mx-auto mb-4">
            <Trophy size={40} className="text-white" />
          </div>
          <h2 className="font-display font-700 text-white text-3xl mb-2">Vinnere!</h2>
        </div>

        <div className="flex items-end justify-center gap-4 mb-8">
          {top3[1] && (
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center mx-auto mb-2 text-2xl">
                🥈
              </div>
              <div className="font-display font-700 text-white text-lg">{top3[1].displayName}</div>
              <div className="text-slate-400 text-sm font-mono">{top3[1].totalScore} p</div>
              <div className="text-earth-300 text-sm font-body mt-1">+{session.prizes.second} EP</div>
            </div>
          )}

          {top3[0] && (
            <div className="text-center animate-slide-up" style={{ animationDelay: '0s' }}>
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-earth-400 to-earth-600 flex items-center justify-center mx-auto mb-2 text-3xl bio-glow">
                🥇
              </div>
              <div className="font-display font-700 text-white text-xl">{top3[0].displayName}</div>
              <div className="text-slate-400 text-sm font-mono">{top3[0].totalScore} p</div>
              <div className="text-earth-300 text-sm font-body mt-1">+{session.prizes.first} EP</div>
            </div>
          )}

          {top3[2] && (
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto mb-2 text-2xl">
                🥉
              </div>
              <div className="font-display font-700 text-white text-lg">{top3[2].displayName}</div>
              <div className="text-slate-400 text-sm font-mono">{top3[2].totalScore} p</div>
              <div className="text-earth-300 text-sm font-body mt-1">+{session.prizes.third} EP</div>
            </div>
          )}
        </div>

        {rest.length > 0 && (
          <div className="bio-card p-6 mb-6">
            <h3 className="font-display font-700 text-white mb-4">Andre plasseringer</h3>
            <div className="space-y-2">
              {rest.map((player, i) => (
                <div key={player.uid} className="flex items-center gap-3 p-3 rounded-xl bg-white/2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-700 bg-white/5 text-slate-500">
                    {i + 4}
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-bio-600 to-moss-700 flex items-center justify-center text-white font-display font-700 text-xs">
                    {player.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="text-white text-sm font-body font-500">{player.displayName}</div>
                  <div className="ml-auto text-bio-400 font-mono text-sm">{player.totalScore} p</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg bg-bio-600"
          >
            {finishing ? <Loader size={20} className="animate-spin" /> : <><Trophy size={20} /> Tildel poeng og avslutt</>}
          </button>
          <Link href="/dashboard/teacher" className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            <Home size={18} /> Tilbake til dashboard
          </Link>
        </div>
      </div>
    </Layout>
  );
}
