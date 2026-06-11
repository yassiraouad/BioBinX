import { useState, useEffect } from 'react';
import { Wind, Loader2, RefreshCw } from 'lucide-react';
import { getCO2Prognosis } from '../firebase/db';

export default function CO2Prognose() {
  const [prognosis, setPrognosis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    loadPrognosis();
  }, []);

  const loadPrognosis = async () => {
    setLoading(true);
    try {
      const data = await getCO2Prognosis();
      setPrognosis(data);
      
      const prompt = `Basert på disse tallene, lag en kort og engasjerende CO₂-prognose på norsk for skolen. Inkluder sammenligning med noe konkret (f.eks. antall flyreiser Oslo-London, antall trær plantet). Maks 3 setninger.

Data:
- Prognose for neste måned: ${data.co2MonthKg} kg CO₂
- Prognose for neste år: ${data.co2YearKg} kg CO₂
- Basert på ${data.basedOnKg} kg observert data`;

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: prompt,
          systemPrompt: 'Du er en miljøassistent. Lag en kort, engasjerende prognose på norsk. Maks 3 setninger.'
        })
      });

      const data2 = await response.json();
      setSummary(data2.response || '');
    } catch (err) {
      console.error('Error loading prognosis:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bio-card p-6 flex items-center justify-center">
        <Loader2 size={24} className="text-bio-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bio-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <Wind size={20} className="text-moss-400" />
        <h2 className="font-display font-700 text-white text-lg">CO₂-prognose</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-moss-500/10 border border-moss-500/20">
          <div className="text-moss-400 font-display font-700 text-2xl">{prognosis?.co2MonthKg || 0}</div>
          <div className="text-slate-400 text-sm font-body">kg CO₂ spart</div>
          <div className="text-slate-500 text-xs mt-1">Neste 30 dager</div>
        </div>
        
        <div className="p-4 rounded-xl bg-bio-500/10 border border-bio-500/20">
          <div className="text-bio-400 font-display font-700 text-2xl">{prognosis?.co2YearKg || 0}</div>
          <div className="text-slate-400 text-sm font-body">kg CO₂ spart</div>
          <div className="text-slate-500 text-xs mt-1">Neste 12 måneder</div>
        </div>
      </div>

      {summary && (
        <p className="text-slate-300 text-sm font-body whitespace-pre-line">{summary}</p>
      )}

      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-slate-500 text-xs">
          Basert på {prognosis?.basedOnKg || 0} kg observert data
        </p>
      </div>
    </div>
  );
}