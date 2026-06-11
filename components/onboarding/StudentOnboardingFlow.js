import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Flame } from 'lucide-react';

const AVATARS = ['😀', '😎', '🤖', '🦊', '🐼', '🐯', '🦄', '🐸'];

export default function StudentOnboardingFlow({ loading, onProgress, onBackToRole, onComplete }) {
  const [step, setStep] = useState(1);
  const [classCode, setClassCode] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);

  useEffect(() => onProgress(step, 4), [step, onProgress]);

  return (
    <div className="space-y-5">
      {step === 1 && (
        <>
          <button onClick={onBackToRole} className="btn-ghost -ml-3 w-fit"><ArrowLeft size={14} />Tilbake</button>
          <div className="space-y-2">
            <h2 className="text-2xl font-700 tracking-[-0.03em] text-white">Koble deg til riktig klasse</h2>
            <p className="text-sm leading-7 text-slate-400">Klassekoden far du fra laereren din. Den brukes for a koble registreringene dine til riktig klasse, gruppe og ukesmal.</p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
            <label className="mb-3 block text-sm font-500 text-slate-300">Klassekode</label>
            <input value={classCode} onChange={(event) => setClassCode(event.target.value.toUpperCase())} className="bio-input text-center tracking-[0.3em] font-mono" placeholder="F.eks. ABC123" />
            <p className="mt-3 text-xs leading-5 text-slate-500">Koden star vanligvis pa tavla, i Teams eller i den forste klassebeskjeden fra laereren.</p>
          </div>
          <button onClick={() => setStep(2)} disabled={!classCode.trim()} className="btn-primary w-full">Neste <ArrowRight size={16} /></button>
        </>
      )}

      {step === 2 && (
        <>
          <button onClick={() => setStep(1)} className="btn-ghost -ml-3 w-fit"><ArrowLeft size={14} />Tilbake</button>
          <div className="space-y-2">
            <h2 className="text-2xl font-700 tracking-[-0.03em] text-white">Velg hvordan du vises i klassen</h2>
            <p className="text-sm leading-7 text-slate-400">Avatar brukes i leaderboard, aktivitetshistorikk og streak-oversikt. Den gjor det enklere a kjenne igjen egne registreringer uten ekstra stoy.</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {AVATARS.map((item) => (
              <button key={item} onClick={() => setAvatar(item)} className={`rounded-2xl border p-4 text-2xl transition-all ${avatar === item ? 'border-bio-500/30 bg-bio-500/12' : 'border-white/8 bg-white/4 hover:border-white/12 hover:bg-white/6'}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="rounded-[24px] border border-white/8 bg-white/4 p-4 text-sm text-slate-300">
            Forhandsvisning: <span className="font-600 text-white">{avatar}</span> vises ved siden av poeng, registreringer og klasseaktivitet.
          </div>
          <button onClick={() => setStep(3)} className="btn-primary w-full">Neste</button>
        </>
      )}

      {step === 3 && (
        <>
          <button onClick={() => setStep(2)} className="btn-ghost -ml-3 w-fit"><ArrowLeft size={14} />Tilbake</button>
          <div className="space-y-2">
            <h2 className="text-2xl font-700 tracking-[-0.03em] text-white">Slik ser elevopplevelsen ut</h2>
            <p className="text-sm leading-7 text-slate-400">Poeng og streaks er ikke pynt. De brukes for a vise faktisk aktivitet i klassen og gjore det tydelig nar noen bidrar jevnt over tid.</p>
          </div>
          <div className="space-y-3 rounded-[24px] border border-white/8 bg-white/4 p-5">
            <p className="text-sm text-slate-200">Du tjener EcoPoints hver gang du registrerer matavfall.</p>
            <div className="flex items-center gap-2 text-sm text-orange-300"><Flame size={16} /> Streak = antall dager pa rad du har bidratt.</div>
            <p className="text-sm text-slate-400">Dashboardet ditt viser ogsa siste registreringer, klassemlet og hvilke badges du faktisk har last opp.</p>
          </div>
          <button onClick={() => setStep(4)} className="btn-primary w-full">Jeg forstar</button>
        </>
      )}

      {step === 4 && (
        <>
          <div className="rounded-[28px] border border-bio-500/20 bg-bio-500/12 p-6 text-center">
            <div className="mb-3 text-3xl">🎉</div>
            <h2 className="text-2xl font-700 text-white">Du er klar til a registrere forste kast</h2>
            <p className="mt-2 text-sm text-slate-300">Avatar {avatar} er valgt og kontoen kobles til klassekoden <span className="font-mono text-white">{classCode}</span>.</p>
          </div>
          <button
            onClick={() => onComplete({ role: 'student', classCode: classCode.trim(), avatar })}
            disabled={loading}
            className="btn-primary w-full"
          >
            Fullfor <Check size={16} />
          </button>
        </>
      )}
    </div>
  );
}
