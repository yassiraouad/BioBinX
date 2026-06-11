import { useState, useEffect } from 'react';
import { Check, X, Loader2, Target, Clock, Users as UsersIcon, Calendar } from 'lucide-react';
import { getQuizForWeek, submitQuizAnswer } from '../firebase/db';

export default function WeeklyQuiz({ userId }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [userId]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const q = await getQuizForWeek();
      setQuiz(q);
      
      const userScore = q.completedBy?.[userId]?.score;
      if (userScore !== undefined) {
        setCompleted(true);
        setScore(userScore);
      }
    } catch (err) {
      console.error('Error loading quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answerIndex) => {
    if (!quiz || submitting) return;
    
    const question = quiz.questions[currentQ];
    const isCorrect = answerIndex === question.correctIndex;
    const points = isCorrect ? 5 : 0;
    
    setSubmitting(true);
    try {
      await submitQuizAnswer(userId, quiz.weekId, currentQ, answerIndex, points);
      
      const newAnswers = [...answers, { question: currentQ, answer: answerIndex, correct: isCorrect }];
      setAnswers(newAnswers);
      
      if (currentQ < quiz.questions.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        const totalScore = newAnswers.filter(a => a.correct).length * 5;
        setScore(totalScore);
        setCompleted(true);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const restartQuiz = () => {
    setCurrentQ(0);
    setAnswers([]);
    setCompleted(false);
    setScore(0);
  };

  if (loading) {
    return (
      <div className="bio-card p-6 flex items-center justify-center">
        <Loader2 size={24} className="text-bio-400 animate-spin" />
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="bio-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <Target size={20} className="text-bio-400" />
        <h2 className="font-display font-700 text-white text-lg">Ukens quiz</h2>
        <span className="text-slate-500 text-sm ml-auto">5 spørsmål</span>
      </div>

      {completed ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-earth-500/20 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-earth-400" />
          </div>
          <h3 className="text-white font-display font-700 text-xl mb-2">Quiz fullført!</h3>
          <p className="text-slate-400 font-body mb-4">
            Du fikk {score} eco-poeng denne uken
          </p>
          <button
            onClick={restartQuiz}
            className="text-bio-400 text-sm hover:underline"
          >
            Ta quiz på nytt
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-slate-400 text-sm">
              Spørsmål {currentQ + 1} av {quiz.questions.length}
            </span>
            <span className="text-slate-500 text-xs">
              +5 poeng per riktig
            </span>
          </div>
          
          <div className="h-1 bg-white/10 rounded-full mb-6">
            <div
              className="h-full bg-bio-500 rounded-full transition-all"
              style={{ width: `${((currentQ) / quiz.questions.length) * 100}%` }}
            />
          </div>

          <p className="text-white font-body font-500 mb-6">
            {quiz.questions[currentQ].question}
          </p>

          <div className="space-y-3">
            {quiz.questions[currentQ].options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={submitting}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-left text-white font-body hover:bg-bio-500/10 hover:border-bio-500/30 transition-all disabled:opacity-50"
              >
                <span className="text-slate-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}