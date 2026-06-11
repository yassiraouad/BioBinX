import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherOnboardingFlow({ loading, schools, onProgress, onBackToRole, onComplete }) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState('create');
  const [className, setClassName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [classCode, setClassCode] = useState('');
  const [weeklyGoalKg, setWeeklyGoalKg] = useState('15');
  const [generatedCode, setGeneratedCode] = useState('------');

  useEffect(() => {
    if (!schoolId && schools.length) {
      setSchoolId(schools[0].id);
    }
  }, [schools, schoolId]);

  useEffect(() => onProgress(step, 4), [step, onProgress]);

  const canContinueStep1 = useMemo(() => {
    if (mode === 'join') return classCode.trim().length >= 4;
    return className.trim().length >= 2 && Boolean(schoolId);
  }, [mode, classCode, className, schoolId]);

  const handleNextFromStep1 = () => {
    if (mode === 'join') {
      setGeneratedCode(classCode.trim().toUpperCase());
    }
    setStep(2);
  };

  return (
    <div className="space-y-5">
      {step === 1 && (
        <>
          <button onClick={onBackToRole} className="btn-ghost -ml-3 w-fit"><ArrowLeft size={14} />Tilbake</button>
          <div className="space-y-2">
            <h2 className="text-2xl font-700 tracking-[-0.03em] text-white">Opprett eller koble til klasse</h2>
            <p className="text-sm leading-7 text-slate-400">Start med en klasse du faktisk skal folge opp. Videre steg brukes til a koble elevene til riktig kode og sette forste ukesmal.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode('create')} className={`rounded-2xl border p-4 text-sm transition-all ${mode === 'create' ? 'border-bio-500/30 bg-bio-500/12 text-white' : 'border-white/8 bg-white/4 text-slate-300 hover:border-white/12 hover:bg-white/6'}`}>Opprett klasse</button>
            <button onClick={() => setMode('join')} className={`rounded-2xl border p-4 text-sm transition-all ${mode === 'join' ? 'border-bio-500/30 bg-bio-500/12 text-white' : 'border-white/8 bg-white/4 text-slate-300 hover:border-white/12 hover:bg-white/6'}`}>Koble til med kode</button>
          </div>

          {mode === 'create' ? (
            <div className="space-y-4 rounded-[24px] border border-white/8 bg-white/4 p-4">
              <div>
                <label className="mb-2 block text-sm font-500 text-slate-300">Klassenavn</label>
                <input value={className} onChange={(event) => setClassName(event.target.value)} className="bio-input" placeholder="F.eks. 6B" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-500 text-slate-300">Skole</label>
                <select value={schoolId} onChange={(event) => setSchoolId(event.target.value)} className="bio-input">
                  {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-[24px] border border-white/8 bg-white/4 p-4">
              <div>
                <label className="mb-2 block text-sm font-500 text-slate-300">Klassekode</label>
                <input value={classCode} onChange={(event) => setClassCode(event.target.value.toUpperCase())} className="bio-input text-center tracking-[0.25em] font-mono" placeholder="Klassekode" />
              </div>
              <p className="text-xs leading-5 text-slate-500">Bruk dette hvis klassen allerede finnes og du bare skal koble kontoen din til eksisterende oppsett.</p>
            </div>
          )}

          <button onClick={handleNextFromStep1} disabled={!canContinueStep1} className="btn-primary w-full">Neste <ArrowRight size={16} /></button>
        </>
      )}

      {step === 2 && (
        <>
          <button onClick={() => setStep(1)} className="btn-ghost -ml-3 w-fit"><ArrowLeft size={14} />Tilbake</button>
          <div className="space-y-2">
            <h2 className="text-2xl font-700 tracking-[-0.03em] text-white">Slik far elevene tilgang</h2>
            <p className="text-sm leading-7 text-slate-400">Nar oppsettet er ferdig, bruker elevene klassekode for a bli koblet til riktig klasse og forste ukesmal.</p>
          </div>

          {mode === 'join' ? (
            <div className="rounded-[24px] border border-white/8 bg-white/4 p-5 text-center">
              <div className="text-sm text-slate-400">Eksisterende klassekode</div>
              <div className="my-3 text-3xl tracking-[0.3em] font-mono text-bio-100">{generatedCode}</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                  toast.success('Klassekode kopiert');
                }}
                className="btn-secondary"
              >
                <Copy size={14} /> Kopier kode
              </button>
            </div>
          ) : (
            <div className="rounded-[24px] border border-white/8 bg-white/4 p-5">
              <div className="text-base font-600 text-white">Klassekoden genereres automatisk</div>
              <p className="mt-2 text-sm leading-7 text-slate-400">Etter fullforing oppretter systemet klassen og viser en unik kode i dashboardet ditt. Den kan deles pa tavla, i Teams eller direkte i elevonboardingen.</p>
            </div>
          )}

          <button onClick={() => setStep(3)} className="btn-primary w-full">Neste</button>
        </>
      )}

      {step === 3 && (
        <>
          <button onClick={() => setStep(2)} className="btn-ghost -ml-3 w-fit"><ArrowLeft size={14} />Tilbake</button>
          <div className="space-y-2">
            <h2 className="text-2xl font-700 tracking-[-0.03em] text-white">Sett forste ukesmal</h2>
            <p className="text-sm leading-7 text-slate-400">Et konkret mal gjor det lettere a bruke dashboardet til oppfolging i stedet for bare rapportering.</p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
            <label className="mb-2 block text-sm font-500 text-slate-300">Mal i kilo</label>
            <input value={weeklyGoalKg} onChange={(event) => setWeeklyGoalKg(event.target.value)} className="bio-input" placeholder="F.eks. 15" />
            <p className="mt-3 text-xs leading-5 text-slate-500">Malet kan endres senere, men brukes direkte i klasseoversikten og fremdriftskortene.</p>
          </div>
          <button onClick={() => setStep(4)} className="btn-primary w-full">Neste</button>
        </>
      )}

      {step === 4 && (
        <>
          <div className="rounded-[28px] border border-bio-500/20 bg-bio-500/12 p-6 text-center">
            <div className="mb-3 text-3xl">🏫</div>
            <h2 className="text-2xl font-700 text-white">Klasseoppsettet er klart</h2>
            <p className="mt-2 text-sm text-slate-300">
              {mode === 'create' ? `${className || 'Ny klasse'} opprettes nar du fullforer.` : `Du kobles til klassekoden ${generatedCode}.`}
            </p>
          </div>
          <button
            onClick={() =>
              onComplete({
                role: 'teacher',
                mode,
                className: className.trim(),
                schoolId,
                classCode: classCode.trim().toUpperCase(),
                generatedCode,
                weeklyGoalKg: parseFloat(weeklyGoalKg) || 0,
              })
            }
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
