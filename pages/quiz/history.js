import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/layout/Layout';
import { getQuizHistory } from '../../firebase/db';
import { ArrowLeft, Trophy, Users, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuizHistory() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || (userData?.role !== 'teacher' && userData?.role !== 'admin' && userData?.role !== 'rector'))) {
      router.push('/auth/login');
    }
  }, [user, userData, loading]);

  useEffect(() => {
    if (user && userData?.role === 'teacher') {
      loadHistory();
    }
  }, [user, userData]);

  const loadHistory = async () => {
    setLoadingData(true);
    try {
      const history = await getQuizHistory(user.uid, 50);
      setSessions(history);
    } catch (err) {
      console.error(err);
      toast.error('Kunne ikke laste historikk');
    } finally {
      setLoadingData(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('no-NO', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !userData) return null;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/teacher" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-700 text-white text-2xl">Quiz-historikk</h1>
            <p className="text-slate-400 text-sm font-body">Tidligere avholdte quizzer</p>
          </div>
        </div>

        {loadingData ? (
          <div className="bio-card p-12 text-center">
            <div className="w-10 h-10 border-2 border-bio-500/30 border-t-bio-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-body">Laster historikk...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bio-card p-12 text-center">
            <Trophy size={48} className="mx-auto text-slate-600 mb-4" />
            <h2 className="font-display font-700 text-white text-xl mb-2">Ingen quizzer ennå</h2>
            <p className="text-slate-400 font-body mb-6">Start din første live quiz for å se historikk her.</p>
            <Link href="/quiz/create" className="btn-primary inline-flex items-center gap-2">
              <Trophy size={16} /> Opprett quiz
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <div key={session.id} className="bio-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy size={18} className="text-earth-400" />
                      <span className="font-display font-700 text-white">Quiz</span>
                      <span className="font-mono text-bio-400 text-sm">PIN: {session.pin}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 text-sm font-body">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(session.finishedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        {session.finalRankings?.length || 0} deltakere
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-xs font-body mb-1">Poeng til topp 3</div>
                    <div className="flex items-center gap-2 text-sm font-mono">
                      <span className="text-earth-400">🥇 {session.prizes?.first || 0}</span>
                      <span className="text-slate-400">🥈 {session.prizes?.second || 0}</span>
                      <span className="text-orange-400">🥉 {session.prizes?.third || 0}</span>
                    </div>
                  </div>
                </div>

                {session.finalRankings && session.finalRankings.length > 0 && (
                  <div className="border-t border-white/5 pt-4">
                    <div className="text-slate-400 text-xs font-body mb-2">Vinnere</div>
                    <div className="flex items-center gap-4">
                      {session.finalRankings.slice(0, 3).map((player, i) => (
                        <div key={player.uid} className="flex items-center gap-2">
                          <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                          <span className="text-white text-sm font-body">{player.displayName}</span>
                          <span className="text-bio-400 text-xs font-mono">{player.totalScore} p</span>
                        </div>
                      ))}
                      {session.finalRankings.length > 3 && (
                        <span className="text-slate-500 text-xs font-body">+{session.finalRankings.length - 3} flere</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
