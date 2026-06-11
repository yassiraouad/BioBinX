import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { getLiveSession } from '../../firebase/db';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Loader, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LobbyStudent() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { session: sessionId } = router.query;
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading]);

  useEffect(() => {
    if (!sessionId || !user) return;

    const loadSession = async () => {
      const s = await getLiveSession(sessionId);
      if (!s) {
        toast.error('Sesjonen ble ikke funnet');
        router.push('/quiz/join');
        return;
      }
      setSession(s);
    };
    loadSession();
  }, [sessionId, user]);

  useEffect(() => {
    if (!sessionId || !db) return;

    const sessionRef = doc(db, 'liveSessions', sessionId);
    const unsub = onSnapshot(sessionRef, doc => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() };
        setSession(data);
        if (data.status === 'question') {
          router.push(`/quiz/play?session=${sessionId}`);
        } else if (data.status === 'results' || data.status === 'finished') {
          router.push(`/quiz/player-results?session=${sessionId}`);
        }
      }
    });

    return () => unsub();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !db) return;

    const playersRef = collection(db, 'liveSessions', sessionId, 'players');
    const unsub = onSnapshot(playersRef, snapshot => {
      const playerList = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
      setPlayers(playerList);
    });

    return () => unsub();
  }, [sessionId]);

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader size={32} className="animate-spin text-bio-400" />
      </div>
    );
  }

  const isJoined = players.some(p => p.uid === user?.uid);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-bio-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative text-center animate-slide-up">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-bio-500 to-bio-700 flex items-center justify-center mx-auto mb-6 bio-glow">
          <Users size={40} className="text-white" />
        </div>

        <h1 className="font-display font-700 text-white text-3xl mb-2">Quiz lobby</h1>
        <p className="text-slate-400 font-body mb-2">
          {isJoined ? 'Du er med!' : 'Du blir med...'}
        </p>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-2 h-2 bg-bio-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-bio-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-bio-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>

        <div className="text-slate-500 text-sm font-body mb-8">
          Venter på at læreren starter...
        </div>

        <div className="bio-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-body">Antall spillere</span>
            <span className="text-bio-400 font-mono font-700 text-xl">{players.length}</span>
          </div>
        </div>

        <Link href="/dashboard/student" className="text-slate-500 hover:text-slate-400 text-sm font-body mt-6 inline-block">
          Forlat quiz
        </Link>
      </div>
    </div>
  );
}
