import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader2, Sparkles } from 'lucide-react';
import { getAllClasses, getWeeklyWaste, getTeacherClasses, getGroupsByTeacher, getChallenges } from '../firebase/db';

export default function AIAssistant({ teacherId, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hei! Jeg er BioBin X sin dataassistent. Spør meg om klasser, grupper, utfordringer eller statistikk!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getContext = async () => {
    try {
      const classes = await getAllClasses();
      const teacherClasses = teacherId ? await getTeacherClasses(teacherId) : [];
      
      const classStats = await Promise.all(
        (teacherClasses || []).map(async (cls) => {
          const weekly = await getWeeklyWaste(null, cls.id);
          return { name: cls.name, weeklyKg: weekly.toFixed(1) };
        })
      );
      
      const challenges = await getChallenges();
      
      return { classes: classStats, challenges: challenges.length };
    } catch (err) {
      console.error('Error getting context:', err);
      return { classes: [], challenges: 0 };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    
    try {
      const context = await getContext();
      
      const systemPrompt = `Du er BioBin X sin dataassistent. Du har tilgang til følgende skoledata:
- Klasser: ${JSON.stringify(context.classes)}
- Aktive utfordringer denne uken: ${context.challenges}

Svar alltid på norsk og vær kortfattet. Bruk gjerne emoji.`;
      
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          systemPrompt
        })
      });
      
      if (!response.ok) throw new Error('AI request failed');
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      console.error('AI error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, jeg kunne ikke behandle forespørselen akkurat nå. Prøv igjen!' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 md:w-96 bg-dark-800 border border-bio-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-bio-500/10">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-bio-400" />
          <h3 className="font-display font-700 text-white">AI-assistent</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-xl text-sm font-body ${
              msg.role === 'user' 
                ? 'bg-bio-500/20 text-white border border-bio-500/30' 
                : 'bg-white/5 text-slate-200 border border-white/10'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <Loader2 size={16} className="text-bio-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Spør om data..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-body focus:border-bio-500/50 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl bg-bio-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bio-600 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}