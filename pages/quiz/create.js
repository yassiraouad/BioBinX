import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/layout/Layout';
import { getTeacherClasses, createLiveSession, createQuizNotification } from '../../firebase/db';
import { quizQuestions } from '../../utils/quizData';
import { Brain, ArrowLeft, ArrowRight, Sparkles, Plus, Trash2, GripVertical, Loader, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { arrayMove } from '../../utils/helpers';

export default function CreateQuiz() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [prizes, setPrizes] = useState({ first: 100, second: 75, third: 50 });
  const [timeLimit, setTimeLimit] = useState(20);
  const [aiCount, setAiCount] = useState(5);

  useEffect(() => {
    if (!loading && (!user || (userData?.role !== 'teacher' && userData?.role !== 'admin' && userData?.role !== 'rector'))) {
      router.push('/auth/login');
    }
  }, [user, userData, loading]);

  useEffect(() => {
    if (user && userData?.role === 'teacher') {
      getTeacherClasses(user.uid).then(cls => {
        setClasses(cls || []);
        if (cls && cls.length > 0) setSelectedClass(cls[0]);
      });
    }
  }, [user, userData]);

  const handleGenerateQuestions = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: aiCount }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQuestions(prev => [...prev, ...data.questions]);
      toast.success(`${data.questions.length} spørsmål generert!`);
    } catch (err) {
      toast.error(err.message || 'Kunne ikke generere spørsmål');
    } finally {
      setGenerating(false);
    }
  };

  const addDefaultQuestion = () => {
    const newQ = {
      id: `manual_${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      category: 'manual',
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      if (field === 'question') {
        updated[index] = { ...updated[index], question: value };
      } else if (field.startsWith('option_')) {
        const optIdx = parseInt(field.split('_')[1]);
        updated[index] = {
          ...updated[index],
          options: updated[index].options.map((o, i) => i === optIdx ? value : o),
        };
      } else if (field === 'correctIndex') {
        updated[index] = { ...updated[index], correctIndex: parseInt(value) };
      }
      return updated;
    });
  };

  const removeQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const moveQuestion = (index, direction) => {
    if (direction === 'up' && index > 0) {
      setQuestions(arrayMove(questions, index, index - 1));
    } else if (direction === 'down' && index < questions.length - 1) {
      setQuestions(arrayMove(questions, index, index + 1));
    }
  };

  const addFromDefaults = (count) => {
    const toAdd = quizQuestions.slice(0, count).map((q, i) => ({
      id: `default_${Date.now()}_${i}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correct,
      category: q.category,
    }));
    setQuestions(prev => [...prev, ...toAdd]);
  };

  const handleCreateSession = async () => {
    if (!selectedClass) return toast.error('Velg en klasse');
    if (questions.length === 0) return toast.error('Legg til minst ett spørsmål');

    const validQuestions = questions.filter(q => q.question && q.options.every(o => o));
    if (validQuestions.length === 0) return toast.error('Alle spørsmål må ha spørsmålstekst og 4 svaralternativ');

    setCreating(true);
    try {
      const { sessionId, pin } = await createLiveSession({
        teacherUid: user.uid,
        classId: selectedClass.id,
        questions: validQuestions,
        prizes,
        timeLimit,
      });

      await createQuizNotification({
        classId: selectedClass.id,
        teacherUid: user.uid,
        teacherName: userData?.name || 'Lærer',
        sessionId,
        pin,
      });

      toast.success('Quiz opprettet!');
      router.push(`/quiz/lobby-teacher?session=${sessionId}`);
    } catch (err) {
      console.error(err);
      toast.error('Kunne ikke opprette quiz');
    } finally {
      setCreating(false);
    }
  };

  if (loading || !user) return null;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/teacher" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-700 text-white text-2xl">Opprett live quiz</h1>
            <p className="text-slate-400 text-sm font-body">Steg {step} av 3</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-700 text-sm ${
                s < step ? 'bg-bio-500 text-white' : s === step ? 'bg-bio-500/20 border-2 border-bio-500 text-bio-400' : 'bg-white/5 text-slate-500'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 mx-1 ${s < step ? 'bg-bio-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-slide-up">
            <div className="bio-card p-6">
              <h2 className="font-display font-700 text-white text-xl mb-4">1. Velg klasse</h2>
              {classes.length === 0 ? (
                <p className="text-slate-400 font-body">Du har ingen klasser. <Link href="/dashboard/teacher" className="text-bio-400">Opprett en klasse først.</Link></p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {classes.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedClass?.id === cls.id ? 'bg-bio-500/15 border-bio-500/40' : 'bg-white/3 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="font-body font-600 text-white">{cls.name}</div>
                      <div className="text-slate-500 text-sm font-body">{cls.studentCount || 0} elever</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bio-card p-6">
              <h2 className="font-display font-700 text-white text-xl mb-4">2. Legg til spørsmål</h2>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <button onClick={handleGenerateQuestions} disabled={generating} className="btn-primary flex items-center gap-2">
                  {generating ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Generer med AI
                </button>
                <select
                  onChange={e => { if (e.target.value) { addFromDefaults(parseInt(e.target.value)); e.target.value = ''; } }}
                  className="bio-input"
                >
                  <option value="">+ Fra standardbibliotek</option>
                  <option value="5">5 spørsmål</option>
                  <option value="10">10 spørsmål</option>
                  <option value="20">Alle 20</option>
                </select>
                <button onClick={addDefaultQuestion} className="btn-primary flex items-center gap-2 bg-moss-600">
                  <Plus size={16} /> Manuelt
                </button>
              </div>

              {generating && (
                <div className="flex items-center gap-3 text-bio-400 mb-4">
                  <Loader size={18} className="animate-spin" />
                  <span className="font-body">Groq genererer spørsmål...</span>
                </div>
              )}

              {questions.length === 0 && !generating && (
                <div className="text-center py-12 text-slate-500">
                  <Brain size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="font-body">Ingen spørsmål ennå</p>
                  <p className="text-sm font-body mt-1">Generer med AI eller legg til manuelt</p>
                </div>
              )}

              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="bio-card p-4 border border-bio-border">
                    <div className="flex items-start gap-3">
                      <div className="text-slate-500 cursor-grab mt-1">
                        <GripVertical size={16} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-bio-400 font-mono text-sm">#{idx + 1}</span>
                          {q.category && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-body">{q.category}</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={q.question}
                          onChange={e => updateQuestion(idx, 'question', e.target.value)}
                          placeholder="Skriv spørsmålet her..."
                          className="bio-input w-full"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-700 ${
                                q.correctIndex === optIdx ? 'bg-bio-500 text-white' : 'bg-white/8 text-slate-400'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <input
                                type="text"
                                value={opt}
                                onChange={e => updateQuestion(idx, `option_${optIdx}`, e.target.value)}
                                placeholder={`Svar ${String.fromCharCode(65 + optIdx)}`}
                                className="bio-input flex-1"
                              />
                              <input
                                type="radio"
                                name={`correct_${q.id}`}
                                checked={q.correctIndex === optIdx}
                                onChange={() => updateQuestion(idx, 'correctIndex', optIdx)}
                                className="accent-bio-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveQuestion(idx, 'up')} className="p-1 text-slate-500 hover:text-white">
                          <ArrowLeft size={14} className="rotate-90" />
                        </button>
                        <button onClick={() => moveQuestion(idx, 'down')} className="p-1 text-slate-500 hover:text-white">
                          <ArrowLeft size={14} className="-rotate-90" />
                        </button>
                        <button onClick={() => removeQuestion(idx)} className="p-1 text-red-400 hover:text-red-300">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedClass || questions.length === 0}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4"
            >
              Neste <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-slide-up">
            <div className="bio-card p-6">
              <h2 className="font-display font-700 text-white text-xl mb-4">Tid per spørsmål</h2>
              <div className="flex gap-3">
                {[10, 20, 30].map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeLimit(t)}
                    className={`flex-1 p-4 rounded-xl border transition-all ${
                      timeLimit === t ? 'bg-bio-500/15 border-bio-500/40 text-bio-400' : 'bg-white/3 border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="font-display font-700 text-2xl">{t}</div>
                    <div className="text-sm font-body">sekunder</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bio-card p-6">
              <h2 className="font-display font-700 text-white text-xl mb-4">Premiepoeng</h2>
              <p className="text-slate-400 text-sm font-body mb-4">Topp 3 får tildelt EcoPoints etter quizen</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 text-sm font-body block mb-2">1. plass 🥇</label>
                  <div className="relative">
                    <Zap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
                    <input
                      type="number"
                      value={prizes.first}
                      onChange={e => setPrizes(p => ({ ...p, first: parseInt(e.target.value) || 0 }))}
                      className="bio-input pl-10 w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm font-body block mb-2">2. plass 🥈</label>
                  <div className="relative">
                    <Zap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      value={prizes.second}
                      onChange={e => setPrizes(p => ({ ...p, second: parseInt(e.target.value) || 0 }))}
                      className="bio-input pl-10 w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm font-body block mb-2">3. plass 🥉</label>
                  <div className="relative">
                    <Zap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" />
                    <input
                      type="number"
                      value={prizes.third}
                      onChange={e => setPrizes(p => ({ ...p, third: parseInt(e.target.value) || 0 }))}
                      className="bio-input pl-10 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-primary flex items-center gap-2 px-6 py-4">
                <ArrowLeft size={18} /> Tilbake
              </button>
              <button onClick={handleCreateSession} disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 bg-bio-600">
                {creating ? <Loader size={18} className="animate-spin" /> : <><Brain size={18} /> Opprett sesjon</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
