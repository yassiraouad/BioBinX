import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { getLiveSession, submitAnswer, getSessionPlayers } from '../../firebase/db';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Loader, Check, X, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlayQuiz() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { session: sessionId } = router.query;
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [currentRank, setCurrentRank] = useState(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

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
      if (s.questions && s.currentQuestionIndex >= 0) {
        setCurrentQuestion(s.questions[s.currentQuestionIndex]);
      }
    };
    loadSession();
  }, [sessionId, user]);

  useEffect(() => {
    if (!sessionId || !db) return;

    const sessionRef = doc(db, 'liveSessions', sessionId);
    const unsub = onSnapshot(sessionRef, async docSnap => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setSession(data);

        if (data.status === 'finished' || data.status === 'results') {
          router.push(`/quiz/player-results?session=${sessionId}`);
        } else if (data.status === 'lobby') {
          router.push(`/quiz/lobby-student?session=${sessionId}`);
        } else if (data.currentQuestionIndex >= 0 && data.questions) {
          const newQ = data.questions[data.currentQuestionIndex];
          if (newQ && (!currentQuestion || newQ.question !== currentQuestion.question)) {
            setCurrentQuestion(newQ);
            setSelectedAnswer(null);
            setAnswered(false);
            setShowResult(false);
            setQuestionStartTime(new Date(data.questionStartedAt?.toDate?.() || Date.now()));
            setTimeLeft(newQ.timeLimit || 20);
          }
        }
      }
    });

    return () => unsub();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !db) return;

    const playersRef = collection(db, 'liveSessions', sessionId, 'players');
    const unsub = onSnapshot(playersRef, async snapshot => {
      const playerList = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
      const sorted = playerList.sort((a, b) => b.totalScore - a.totalScore);
      setTotalPlayers(sorted.length);
      const rank = sorted.findIndex(p => p.uid === user?.uid) + 1;
      setCurrentRank(rank > 0 ? rank : null);
    });

    return () => unsub();
  }, [sessionId, user]);

  useEffect(() => {
    if (answered || !questionStartTime) return;

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
      const remaining = Math.max(0, (currentQuestion?.timeLimit || 20) - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0 && !answered) {
        handleTimeout();
      }
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [questionStartTime, answered, currentQuestion]);

  const handleAnswer = async (answerIndex) => {
    if (answered || !questionStartTime) return;

    clearInterval(timerRef.current);
    setSelectedAnswer(answerIndex);
    setAnswered(true);

    const timeMs = Date.now() - questionStartTime;

    try {
      const res = await fetch('/api/quiz/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          uid: user.uid,
          questionIndex: session.currentQuestionIndex,
          answerIndex,
        }),
      });
      
      if (res.ok) {
        const result = await res.json();
        setPointsEarned(result.pointsEarned || 0);
      }
    } catch (err) {
      console.error(err);
    }

    setShowResult(true);
  };

  const handleTimeout = async () => {
    if (!answered) {
      setSelectedAnswer(-1);
      setAnswered(true);
      setShowResult(true);

      try {
        await fetch('/api/quiz/submit-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            uid: user.uid,
            questionIndex: session.currentQuestionIndex,
            answerIndex: -1,
          }),
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading || !session || !currentQuestion) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader size={32} className="animate-spin text-bio-400" />
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentQuestion.correctIndex;
  const pct = currentQuestion.timeLimit > 0 ? (timeLeft / currentQuestion.timeLimit) * 100 : 100;

  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="text-slate-400 font-body text-sm">
            Spørsmål {session.currentQuestionIndex + 1}/{session.questions?.length || 0}
          </div>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-bio-400" />
            <span className="text-bio-400 font-mono font-700">
              {currentRank ? `#${currentRank}` : '-'}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-body">{timeLeft}s</span>
            <span className={`font-mono font-700 ${timeLeft <= 5 ? 'text-red-400' : 'text-bio-400'}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                timeLeft <= 5 ? 'bg-red-500' : 'bg-bio-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="bio-card p-6 mb-6">
          <h1 className="font-display font-600 text-white text-xl leading-snug">
            {currentQuestion.question}
          </h1>
        </div>

        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrectAnswer = idx === currentQuestion.correctIndex;

            let style = 'border border-bio-border hover:border-bio-500/50';
            if (showResult) {
              if (isCorrectAnswer) {
                style = 'bg-bio-500/20 border-bio-500';
              } else if (isSelected && !isCorrectAnswer) {
                style = 'bg-red-500/10 border-red-500';
              } else {
                style = 'opacity-40';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered}
                className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-4 ${style} ${
                  !answered ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-700 text-lg ${
                  showResult && isCorrectAnswer ? 'bg-bio-500 text-white' :
                  showResult && isSelected && !isCorrectAnswer ? 'bg-red-500 text-white' :
                  'bg-white/8 text-slate-400'
                }`}>
                  {showResult && isCorrectAnswer ? <Check size={20} /> :
                   showResult && isSelected && !isCorrectAnswer ? <X size={20} /> :
                   String.fromCharCode(65 + idx)}
                </div>
                <span className={`font-body font-500 ${
                  showResult && isCorrectAnswer ? 'text-bio-300' :
                  showResult && isSelected ? 'text-red-300' : 'text-white'
                }`}>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className={`bio-card p-6 text-center animate-slide-up ${
            isCorrect ? 'border-earth-500/30 bg-earth-500/5' : 'border-red-500/30 bg-red-500/5'
          }`}>
            <div className={`text-4xl mb-3 ${isCorrect ? 'text-earth-400' : 'text-red-400'}`}>
              {isCorrect ? '✓ Riktig!' : '✗ Feil'}
            </div>
            {isCorrect && pointsEarned > 0 && (
              <div className="text-bio-400 font-mono font-700 text-xl">
                +{pointsEarned} poeng
              </div>
            )}
            {isCorrect && currentRank && (
              <div className="text-slate-400 text-sm font-body mt-2">
                Du er #{currentRank} av {totalPlayers}
              </div>
            )}
            {!isCorrect && (
              <div className="text-slate-400 text-sm font-body mt-2">
                Riktig svar: {currentQuestion.options[currentQuestion.correctIndex]}
              </div>
            )}
          </div>
        )}

        <div className="text-center text-slate-500 text-sm font-body mt-6">
          {showResult ? 'Vent på neste spørsmål...' : 'Vent på at alle skal svare...'}
        </div>
      </div>
    </div>
  );
}
