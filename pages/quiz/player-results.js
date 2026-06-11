import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { getLiveSession, getSessionPlayers } from '../../firebase/db';
import { Trophy, Home, Loader } from 'lucide-react';

export default function PlayerResults() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { session: sessionId } = router.query;
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(null);
  const [myPrize, setMyPrize] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading]);

  useEffect(() => {
    if (!sessionId || !user) return;

    const loadResults = async () => {
      const s = await getLiveSession(sessionId);
      if (!s) {
        router.push('/dashboard/student');
        return;
      }
      setSession(s);

      const playerList = await getSessionPlayers(sessionId);
      const sorted = playerList.sort((a, b) => b.totalScore - a.totalScore);
      setPlayers(sorted);

      const me = sorted.find(p => p.uid === user.uid);
      if (me) {
        setMyScore(me.totalScore);
        const rank = sorted.findIndex(p => p.uid === user.uid) + 1;
        setMyRank(rank);

        if (rank === 1) setMyPrize(s.prizes.first);
        else if (rank === 2) setMyPrize(s.prizes.second);
        else if (rank === 3) setMyPrize(s.prizes.third);
      }
    };
    loadResults();
  }, [sessionId, user]);

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader size={32} className="animate-spin text-bio-400" />
      </div>
    );
  }

  const top3 = players.slice(0, 3);
  const isTop3 = myRank && myRank <= 3;

  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-bio-500 to-bio-700 flex items-center justify-center mx-auto mb-4 bio-glow">
            <Trophy size={40} className="text-white" />
          </div>
          <h1 className="font-display font-700 text-white text-3xl mb-2">Quiz avsluttet!</h1>
          <p className="text-slate-400 font-body">Her er resultatene</p>
        </div>

        {isTop3 && (
          <div className="bio-card p-6 mb-6 text-center border-earth-500/30 bg-earth-500/5 animate-slide-up">
            <div className="text-5xl mb-3">
              {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : '🥉'}
            </div>
            <h2 className="font-display font-700 text-white text-2xl mb-2">
              Gratulerer, {userData?.name || 'Elev'}!
            </h2>
            <div className="text-earth-400 font-mono font-700 text-3xl mb-2">
              #{myRank}
            </div>
            <div className="text-bio-400 font-mono text-xl">
              +{myPrize} EcoPoints
            </div>
          </div>
        )}

        {!isTop3 && (
          <div className="bio-card p-6 mb-6 text-center animate-slide-up">
            <div className="text-slate-400 text-sm font-body mb-2">Din plassering</div>
            <div className="font-display font-700 text-white text-5xl mb-2">#{myRank}</div>
            <div className="text-bio-400 font-mono text-xl">{myScore} poeng</div>
          </div>
        )}

        <div className="bio-card p-6 mb-6">
          <h3 className="font-display font-700 text-white mb-4">Topp 3</h3>
          <div className="space-y-3">
            {top3.map((player, i) => (
              <div
                key={player.uid}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  player.uid === user?.uid ? 'bg-bio-500/10 border border-bio-500/30' : 'bg-white/2'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                  i === 0 ? 'bg-earth-400/20' : i === 1 ? 'bg-slate-400/20' : 'bg-orange-400/20'
                }`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-body font-500 truncate">
                    {player.uid === user?.uid ? 'Deg' : player.displayName}
                  </div>
                  <div className="text-slate-500 text-sm font-body">
                    {player.uid === user?.uid && `+${i === 0 ? session.prizes.first : i === 1 ? session.prizes.second : session.prizes.third} EP`}
                  </div>
                </div>
                <div className="text-bio-400 font-mono font-700">{player.totalScore}</div>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/dashboard/student"
          className="btn-primary w-full flex items-center justify-center gap-2 py-4"
        >
          <Home size={18} /> Tilbake til dashboard
        </Link>
      </div>
    </div>
  );
}
