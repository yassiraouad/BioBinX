import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/layout/Layout';
import { getLiveSession, getSessionPlayers, startQuestion, showResults } from '../../firebase/db';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ArrowLeft, Users, ArrowRight, Check, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HostQuiz() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { session: sessionId } = router.query;
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answerCounts, setAnswerCounts] = useState({});
  const [transitioning, setTransitioning] = useState(false);

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
        toast.error('Sesjonen ble ikke funnet');
        router.push('/dashboard/teacher');
        return;
      }
      const canAccess = s.teacherUid === user.uid || userData?.role === 'admin';
      if (!canAccess) {
        toast.error('Du har ikke tilgang til denne sesjonen');
        router.push('/dashboard/teacher');
        return;
      }
      setSession(s);
    };
    loadSession();
  }, [sessionId, user, userData]);

  useEffect(() => {
    if (!sessionId || !db) return;

    const sessionRef = doc(db, 'liveSessions', sessionId);
    const unsub = onSnapshot(sessionRef, doc => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() };
        setSession(data);
        if (data.status === 'finished') {
          router.push(`/quiz/host-results?session=${sessionId}`);
        } else if (data.status === 'results') {
          router.push(`/quiz/host-results?session=${sessionId}`);
        } else if (data.questions && data.currentQuestionIndex >= 0) {
          setCurrentQuestion(data.questions[data.currentQuestionIndex]);
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
      setPlayers(playerList.sort((a, b) => b.totalScore - a.totalScore));
    });

    return () => unsub();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !db || !currentQuestion) return;

    const questionIndex = session?.currentQuestionIndex ?? 0;
    const playersRef = collection(db, 'liveSessions', sessionId, 'players');
    const unsub = onSnapshot(playersRef, snapshot => {
      const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const answer = data.answers?.find(a => a.questionIndex === questionIndex);
        if (answer && answer.answerIndex !== undefined) {
          counts[answer.answerIndex]++;
        }
      });
      setAnswerCounts(counts);
    });

    return () => unsub();
  }, [sessionId, currentQuestion, session?.currentQuestionIndex]);

  const handleNext = async () => {
    setTransitioning(true);
    try {
      const nextIndex = (session.currentQuestionIndex || 0) + 1;
      if (nextIndex >= session.questions.length) {
        await showResults(sessionId);
        router.push(`/quiz/host-results?session=${sessionId}`);
      } else {
        await startQuestion(sessionId, nextIndex);
      }
    } catch (err) {
      toast.error('Kunne ikke gå videre');
    } finally {
      setTransitioning(false);
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

  const totalPlayers = players.length;
  const answeredCount = Object.values(answerCounts).reduce((a, b) => a + b, 0);
  const progress = totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/teacher" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="font-display font-700 text-white text-xl">Quiz-host</h1>
              <p className="text-slate-400 text-sm font-body">Spørsmål {session.currentQuestionIndex + 1} av {session.questions?.length || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Users size={16} />
            <span className="font-mono">{answeredCount}/{totalPlayers} svart</span>
          </div>
        </div>

        {currentQuestion && (
          <>
            <div className="bio-card p-6 mb-6">
              <h2 className="font-display font-600 text-white text-xl leading-snug">{currentQuestion.question}</h2>
            </div>

            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((opt, idx) => {
                const count = answerCounts[idx] || 0;
                const pct = totalPlayers > 0 ? (count / totalPlayers) * 100 : 0;
                const isCorrect = idx === currentQuestion.correctIndex;

                return (
                  <div key={idx} className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div
                        className={`h-full rounded-xl transition-all duration-500 ${
                          isCorrect ? 'bg-bio-500/20' : 'bg-white/5'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="relative flex items-center gap-4 p-4 rounded-xl border border-white/10">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-700 text-sm ${
                        isCorrect ? 'bg-bio-500 text-white' : 'bg-white/8 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                        {isCorrect && <Check size={14} className="ml-0.5" />}
                      </div>
                      <span className={`font-body font-500 ${isCorrect ? 'text-bio-300' : 'text-slate-200'}`}>
                        {opt}
                      </span>
                      <span className="ml-auto font-mono text-slate-400 text-sm">
                        {count} ({Math.round(pct)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm font-body">Fremgang</span>
                <span className="text-slate-400 text-sm font-mono">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-bio-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </>
        )}

        <button
          onClick={handleNext}
          disabled={transitioning}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
        >
          {transitioning ? (
            <Loader size={20} className="animate-spin" />
          ) : (
            <>
              {session.currentQuestionIndex + 1 >= session.questions.length ? 'Vis resultater' : 'Neste spørsmål'}
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </Layout>
  );
}
