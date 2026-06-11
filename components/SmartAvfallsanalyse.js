import { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { getWeeklyInsight } from '../firebase/db';

export default function SmartAvfallsanalyse({ teacherId }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadCachedInsight();
  }, []);

  const loadCachedInsight = async () => {
    setLoading(true);
    const cached = sessionStorage.getItem('biobin_weekly_insight');
    if (cached) {
      const parsed = JSON.parse(cached);
      const cacheDate = new Date(parsed.generatedAt);
      const now = new Date();
      if ((now - cacheDate) / (1000 * 60 * 60 * 24) < 1) {
        setInsight(parsed.insight);
        setLoading(false);
        return;
      }
    }
    await generateInsight();
  };

  const generateInsight = async () => {
    setAnalyzing(true);
    try {
      const summary = await getWeeklyInsight();
      
      const prompt = `Analyser dette kastmønsteret og gi 2-3 konkrete, korte innsikter på norsk som kan hjelpe læreren. Fokoser på uvanlige mønstre, topper og forbedringsmuligheter. Svar kun med en punktliste.

Data:
- Totalt kastet: ${summary.totalKg} kg
- Antall registreringer: ${summary.logCount}
- Fordeling etter dag: ${JSON.stringify(summary.byDayOfWeek)}
- Fordeling etter time: ${JSON.stringify(summary.byHour)}`;

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: prompt,
          systemPrompt: 'Du er en AI som analyserer avfallsdata. Svar kun med 2-3 punkter på norsk. Ikke noe intro eller avslutning.'
        })
      });

      const data = await response.json();
      const insightText = data.response || 'Kunne ikke generere innsikt';

      const result = {
        insight: insightText,
        generatedAt: new Date().toISOString(),
        summary
      };

      setInsight(insightText);
      sessionStorage.setItem('biobin_weekly_insight', JSON.stringify(result));
    } catch (err) {
      console.error('Error generating insight:', err);
      setInsight('Klarte ikke generere innsikt. Prøv igjen senere.');
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  if (loading || analyzing) {
    return (
      <div className="bio-card p-6 flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Loader2 size={32} className="text-bio-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-body text-sm">
            {analyzing ? 'Analyserer kastemønster...' : 'Laster innsikt...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bio-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Lightbulb size={20} className="text-yellow-400" />
          <h2 className="font-display font-700 text-white text-lg">Ukens innsikt</h2>
        </div>
        <button
          onClick={generateInsight}
          disabled={analyzing}
          className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-bio-400 hover:bg-bio-500/10 transition-all"
          title="Oppdater"
        >
          {analyzing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      <div className="prose prose-invert prose-sm max-w-none">
        <p className="text-slate-300 font-body whitespace-pre-line">{insight}</p>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Sparkles size={12} className="text-bio-400" />
        <span>Generert av BioBin AI</span>
      </div>
    </div>
  );
}