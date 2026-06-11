import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Target, HelpCircle } from 'lucide-react';
import { getAllChallenges, updateChallenge, getAllQuizzes, createQuiz, updateQuiz, deleteQuiz } from '../firebase/db';
import toast from 'react-hot-toast';

export default function ChallengeQuizEditor({ userId }) {
  const [tab, setTab] = useState('challenges');
  const [challenges, setChallenges] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', targetType: 'kg', targetValue: '' });
  const [quizForm, setQuizForm] = useState({ weekId: '', questions: [{ question: '', options: ['', '', '', ''], correctIndex: 0 }] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chs, qzs] = await Promise.all([getAllChallenges(), getAllQuizzes()]);
      setChallenges(chs);
      setQuizzes(qzs);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChallenge = async () => {
    if (!formData.title.trim() || !formData.targetValue) {
      toast.error('Fyll ut tittel og målverdi');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await updateChallenge(editingItem.id, {
          title: formData.title,
          description: formData.description,
          targetType: formData.targetType,
          targetValue: parseFloat(formData.targetValue),
        });
        toast.success('Utfordring oppdatert!');
      } else {
        const { createChallenge } = await import('../../firebase/db');
        await createChallenge({
          title: formData.title,
          description: formData.description,
          targetKg: formData.targetType === 'kg' ? parseFloat(formData.targetValue) : null,
          targetStreak: formData.targetType === 'streak' ? parseInt(formData.targetValue) : null,
          weekStart: new Date(),
        });
        toast.success('Utfordring opprettet!');
      }
      loadData();
      setShowForm(false);
      setEditingItem(null);
      setFormData({ title: '', description: '', targetType: 'kg', targetValue: '' });
    } catch (err) {
      console.error('Error saving challenge:', err);
      toast.error('Klarte ikke lagre');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.weekId.trim() || quizForm.questions.length === 0) {
      toast.error('Fyll ut uke og minst ett spørsmål');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await updateQuiz(editingItem.id, quizForm.questions);
        toast.success('Quiz oppdatert!');
      } else {
        await createQuiz(quizForm.weekId, quizForm.questions);
        toast.success('Quiz opprettet!');
      }
      loadData();
      setShowForm(false);
      setEditingItem(null);
      setQuizForm({ weekId: '', questions: [{ question: '', options: ['', '', '', ''], correctIndex: 0 }] });
    } catch (err) {
      console.error('Error saving quiz:', err);
      toast.error('Klarte ikke lagre');
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    setQuizForm({
      ...quizForm,
      questions: [...quizForm.questions, { question: '', options: ['', '', '', ''], correctIndex: 0 }],
    });
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...quizForm.questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuizForm({ ...quizForm, questions: updated });
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...quizForm.questions];
    updated[qIndex].options[oIndex] = value;
    setQuizForm({ ...quizForm, questions: updated });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 size={24} className="text-bio-400 animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('challenges')}
          className={`flex-1 py-2 px-4 rounded-xl font-body font-500 flex items-center justify-center gap-2 ${
            tab === 'challenges' ? 'bg-bio-500/20 text-bio-400 border border-bio-500/30' : 'bg-white/5 text-slate-400'
          }`}
        >
          <Target size={16} /> Utfordringer
        </button>
        <button
          onClick={() => setTab('quizzes')}
          className={`flex-1 py-2 px-4 rounded-xl font-body font-500 flex items-center justify-center gap-2 ${
            tab === 'quizzes' ? 'bg-bio-500/20 text-bio-400 border border-bio-500/30' : 'bg-white/5 text-slate-400'
          }`}
        >
          <HelpCircle size={16} /> Quiz
        </button>
      </div>

      {tab === 'challenges' && (
        <>
          {!showForm && (
            <button onClick={() => { setShowForm(true); setEditingItem(null); }} className="btn-primary flex items-center gap-2 mb-4">
              <Plus size={16} /> Ny utfordring
            </button>
          )}

          {showForm ? (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Tittel" className="bio-input" />
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Beskrivelse" className="bio-input" rows={2} />
              <div className="flex gap-2">
                <select value={formData.targetType} onChange={(e) => setFormData({ ...formData, targetType: e.target.value })} className="bio-input">
                  <option value="kg">Kilo</option>
                  <option value="streak">Dager streak</option>
                </select>
                <input type="number" value={formData.targetValue} onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })} placeholder="Målverdi" className="bio-input" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400">Avbryt</button>
                <button onClick={handleSaveChallenge} disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lagre
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {challenges.map((ch) => (
                <div key={ch.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-white font-body">{ch.title}</p>
                    <p className="text-slate-500 text-xs">{ch.targetKg ? `${ch.targetKg} kg` : ch.targetStreak ? `${ch.targetStreak} dager` : ''}</p>
                  </div>
                  <button onClick={() => { setEditingItem(ch); setFormData({ title: ch.title, description: ch.description || '', targetType: ch.targetKg ? 'kg' : 'streak', targetValue: ch.targetKg || ch.targetStreak || '' }); setShowForm(true); }} className="text-bio-400 hover:underline text-sm">Rediger</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'quizzes' && (
        <>
          {!showForm && (
            <button onClick={() => { setShowForm(true); setEditingItem(null); }} className="btn-primary flex items-center gap-2 mb-4">
              <Plus size={16} /> Ny quiz
            </button>
          )}

          {showForm ? (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
              <input type="text" value={quizForm.weekId} onChange={(e) => setQuizForm({ ...quizForm, weekId: e.target.value })} placeholder="Uke-ID (f.eks. uke-2024-12)" className="bio-input" />
              
              {quizForm.questions.map((q, qi) => (
                <div key={qi} className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                  <input type="text" value={q.question} onChange={(e) => updateQuestion(qi, 'question', e.target.value)} placeholder={`Spørsmål ${qi + 1}`} className="bio-input" />
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${qi}`} checked={q.correctIndex === oi} onChange={() => updateQuestion(qi, 'correctIndex', oi)} />
                      <input type="text" value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Svar ${oi + 1}`} className="bio-input flex-1" />
                    </div>
                  ))}
                </div>
              ))}
              
              <button onClick={addQuestion} className="text-bio-400 text-sm hover:underline">+ Legg til spørsmål</button>
              
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400">Avbryt</button>
                <button onClick={handleSaveQuiz} disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lagre
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {quizzes.map((qz) => (
                <div key={qz.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-white font-body">{qz.weekId}</p>
                    <p className="text-slate-500 text-xs">{qz.questions?.length || 0} spørsmål</p>
                  </div>
                  <button onClick={() => { setEditingItem(qz); setQuizForm({ weekId: qz.weekId, questions: qz.questions || [] }); setShowForm(true); }} className="text-bio-400 hover:underline text-sm">Rediger</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Save(props) {
  return <span {...props}><Save size={props.size || 16} /></span>;
}