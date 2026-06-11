import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/layout/Layout';
import { getLiveSession, updateSessionStatus, getSessionPlayers } from '../../firebase/db';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ArrowLeft, Users, Play, X, Copy, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LobbyTeacher() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { session: sessionId } = router.query;
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (userData?.role !== 'teacher' && userData?.role !== 'admin' && userData?.role !== 'rector'))) {
      router.push('/auth/login');
    }
  }, [user, userData, loading]);

  useEffect(() => {
    if (!sessionId) return;

    const loadSession = async () => {
      const s = await getLiveSession(sessionId);
      if (!s) {
        toast.error('Sesjonen ble ikke funnet');
        router.push('/dashboard/teacher');
        return;
      }
      if (s.teacherUid !== user?.uid) {
        toast.error('Du har ikke tilgang til denne sesjonen');
        router.push('/dashboard/teacher');
        return;
      }
      setSession(s);
    };
    loadSession();
  }, [sessionId, user]);

  useEffect(() => {
    if (!sessionId || !db) return;

    const playersRef = collection(db, 'liveSessions', sessionId, 'players');
    const unsub = onSnapshot(playersRef, snapshot => {
      const playerList = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
      setPlayers(playerList.sort((a, b) => b.totalScore - a.totalScore));
    });

    return () => unsub();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !db) return;

    const sessionRef = doc(db, 'liveSessions', sessionId);
    const unsub = onSnapshot(sessionRef, doc => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() };
        setSession(data);
        if (data.status === 'question' || data.status === 'results') {
          router.push(`/quiz/host?session=${sessionId}`);
        }
      }
    });

    return () => unsub();
  }, [sessionId]);

  const handleStartQuiz = async () => {
    if (players.length === 0) {
      toast.error('Vent til minst én elev har blitt med');
      return;
    }
    setStarting(true);
    try {
      await updateSessionStatus(sessionId, 'question', { currentQuestionIndex: 0, questionStartedAt: new Date().toISOString() });
      router.push(`/quiz/host?session=${sessionId}`);
    } catch (err) {
      toast.error('Kunne ikke starte quiz');
    } finally {
      setStarting(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm('Er du sikker på at du vil avslutte sesjonen?')) return;
    try {
      await updateSessionStatus(sessionId, 'finished');
      router.push('/dashboard/teacher');
    } catch (err) {
      toast.error('Kunne ikke avslutte sesjonen');
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

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/teacher" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-700 text-white text-2xl">Quiz lobby</h1>
            <p className="text-slate-400 text-sm font-body">Vent på at elevene blir med</p>
          </div>
        </div>

        <div className="bio-card p-8 text-center mb-6">
          <p className="text-slate-400 text-sm font-body mb-2">PIN-kode for elevene</p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="font-mono font-700 text-5xl text-bio-400 tracking-widest">{session.pin}</div>
            <button
              onClick={() => { navigator.clipboard.writeText(session.pin); toast.success('PIN kopiert!'); }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
            >
              <Copy size={20} />
            </button>
          </div>
          <p className="text-slate-500 text-sm font-body">Del denne koden med elevene dine</p>
        </div>

        <div className="bio-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users size={20} className="text-bio-400" />
              <h2 className="font-display font-700 text-white">Elever i quizen</h2>
            </div>
            <span className="text-bio-400 font-mono font-700 text-xl">{players.length}</span>
          </div>

          {players.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users size={48} className="mx-auto mb-3 opacity-50" />
              <p className="font-body">Ingen elever har blitt med ennå</p>
              <p className="text-sm font-body mt-1">Elever blir med via /quiz/join</p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player, i) => (
                <div key={player.uid} className="flex items-center gap-3 p-3 rounded-xl bg-white/2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-700 ${
                    i === 0 ? 'bg-earth-400/20 text-earth-300' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-400/20 text-orange-300' : 'bg-white/5 text-slate-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-bio-600 to-moss-700 flex items-center justify-center text-white font-display font-700 text-xs">
                    {player.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="text-white text-sm font-body font-500">{player.displayName}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleStartQuiz}
            disabled={players.length === 0 || starting}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg bg-bio-600 disabled:opacity-50"
          >
            {starting ? <Loader size={20} className="animate-spin" /> : <Play size={20} />}
            Start quiz ({session.questions?.length || 0} spørsmål)
          </button>
          <button
            onClick={handleEndSession}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            <X size={18} /> Avslutt sesjon
          </button>
        </div>
      </div>
    </Layout>
  );
}
