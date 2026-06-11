// pages/quiz.js
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { quizQuestions, categoryColors } from '../utils/quizData';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import { Brain, CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Zap } from 'lucide-react';

export default function Quiz() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading]);

  const question = quizQuestions[currentQ];

  const handleAnswer = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === question.correct;
    if (correct) setScore(s => s + 10);
    setAnswers(prev => [...prev, { questionId: question.id, selected: idx, correct }]);
  };

  const handleNext = () => {
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setStarted(false);
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
    setAnswers([]);
  };

  const pct = Math.round((score / quizQuestions.length) * 100);
  const grade = pct >= 80 ? { emoji: '🏆', text: 'Utmerket!', color: 'text-earth-300' }
    : pct >= 60 ? { emoji: '🌿', text: 'Bra jobba!', color: 'text-bio-300' }
    : { emoji: '📚', text: 'Øv mer!', color: 'text-slate-300' };

  if (!started) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="text-center py-10 animate-slide-up">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-bio-600 to-moss-700 flex items-center justify-center mx-auto mb-6 bio-glow">
              <Brain size={44} className="text-white" />
            </div>
            <h1 className="font-display font-700 text-white text-3xl mb-3">Miljøquiz</h1>
            <p className="text-slate-400 font-body text-lg max-w-sm mx-auto mb-8">
              Test kunnskapen din om matavfall, biogass og klima. {quizQuestions.length} spørsmål venter!
            </p>

            <div className="grid grid-cols-3 gap-4 mb-10 max-w-sm mx-auto">
              {[
                { label: 'Spørsmål', value: quizQuestions.length },
                { label: 'Kategorier', value: 3 },
                { label: 'Poeng mulig', value: quizQuestions.length * 10 },
              ].map(({ label, value }) => (
                <div key={label} className="bio-card p-4 text-center">
                  <div className="font-display font-700 text-white text-2xl">{value}</div>
                  <div className="text-slate-500 text-xs font-body mt-1">{label}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setStarted(true)} className="btn-primary flex items-center gap-2 mx-auto text-base px-8 py-4">
              Start quiz <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (finished) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto animate-slide-up">
          <div className="bio-card p-8 text-center mb-6">
            <div className="text-5xl mb-4">{grade.emoji}</div>
            <h2 className="font-display font-700 text-white text-3xl mb-2">{grade.text}</h2>
            <p className={`font-body text-lg ${grade.color} mb-2`}>
              Du fikk {score} poeng ({answers.filter(a => a.correct).length} av {quizQuestions.length} riktige)
            </p>
            <div className="w-full h-3 bg-white/8 rounded-full overflow-hidden my-6">
              <div
                className="h-full bg-gradient-to-r from-bio-600 to-bio-400 rounded-full transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="font-mono font-700 text-bio-400 text-4xl">{pct}%</div>
          </div>

          {/* Review answers */}
          <div className="space-y-3 mb-6">
            {quizQuestions.map((q, i) => {
              const ans = answers[i];
              const correct = ans?.correct;
              return (
                <div key={q.id} className={`bio-card p-4 flex items-start gap-3 border ${correct ? 'border-bio-500/20' : 'border-red-500/20'}`}>
                  {correct ? <CheckCircle size={18} className="text-bio-400 flex-shrink-0 mt-0.5" /> : <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-white text-sm font-body font-500">{q.question}</p>
                    {!correct && <p className="text-slate-400 text-xs mt-1">✓ Riktig svar: {q.options[q.correct]}</p>}
                    <p className="text-slate-500 text-xs mt-1 italic">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={restart} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base">
            <RotateCcw size={18} /> Prøv igjen
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-body">Spørsmål {currentQ + 1} av {quizQuestions.length}</span>
            <span className="text-bio-400 font-mono text-sm">{score} poeng</span>
          </div>
          <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-bio-600 to-bio-400 rounded-full transition-all duration-500"
              style={{ width: `${((currentQ) / quizQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Category tag */}
        <div className="mb-5 animate-slide-up">
          <span
            className="text-xs font-mono font-600 px-3 py-1 rounded-full border uppercase tracking-wider"
            style={{ color: categoryColors[question.category], borderColor: `${categoryColors[question.category]}30`, background: `${categoryColors[question.category]}12` }}
          >
            {question.category}
          </span>
        </div>

        {/* Question */}
        <div key={currentQ} className="bio-card p-6 mb-5 animate-slide-up">
          <h2 className="font-display font-600 text-white text-xl leading-snug">{question.question}</h2>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {question.options.map((opt, idx) => {
            let style = 'bio-card border border-bio-border hover:border-bio-500/30 cursor-pointer';
            if (answered) {
              if (idx === question.correct) style = 'bg-bio-500/15 border border-bio-500/40 cursor-default';
              else if (idx === selected) style = 'bg-red-500/10 border border-red-500/30 cursor-default';
              else style = 'bio-card opacity-50 cursor-default';
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center gap-3 ${style}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-700 text-xs flex-shrink-0 ${
                  answered && idx === question.correct ? 'bg-bio-500 text-white' :
                  answered && idx === selected ? 'bg-red-500 text-white' :
                  'bg-white/8 text-slate-400'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className={`font-body text-sm ${answered && idx === question.correct ? 'text-bio-300 font-600' : 'text-slate-200'}`}>
                  {opt}
                </span>
                {answered && idx === question.correct && <CheckCircle size={16} className="text-bio-400 ml-auto" />}
                {answered && idx === selected && idx !== question.correct && <XCircle size={16} className="text-red-400 ml-auto" />}
              </button>
            );
          })}
        </div>

        {/* Explanation + Next */}
        {answered && (
          <div className="animate-slide-up space-y-4">
            <div className="p-4 rounded-xl bg-white/4 border border-white/8">
              <p className="text-slate-300 text-sm font-body">
                <span className="text-bio-400 font-600">💡 Forklaring: </span>
                {question.explanation}
              </p>
            </div>
            <button onClick={handleNext} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base">
              {currentQ < quizQuestions.length - 1 ? 'Neste spørsmål' : 'Se resultat'}
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
