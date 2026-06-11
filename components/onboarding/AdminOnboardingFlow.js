import { useEffect, useState } from 'react';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';

export default function AdminOnboardingFlow({ loading, onProgress, onBackToRole, onComplete }) {
  const [step, setStep] = useState(1);
  const [organization, setOrganization] = useState('');
  const [orgType, setOrgType] = useState('kommune');

  useEffect(() => onProgress(step, 3), [step, onProgress]);

  return (
    <div className="space-y-5">
      {step === 1 && (
        <>
          <button onClick={onBackToRole} className="btn-ghost -ml-3 w-fit"><ArrowLeft size={14} />Tilbake</button>
          <div className="space-y-2">
            <h2 className="text-2xl font-700 tracking-[-0.03em] text-white">Bekreft organisasjonen</h2>
            <p className="text-sm leading-7 text-slate-400">Adminoppsettet brukes til a skille skole- og kommuneniva, slik at riktig rapportering og riktig struktur vises senere i produktet.</p>
          </div>
          <div className="space-y-4 rounded-[24px] border border-white/8 bg-white/4 p-4">
            <div>
              <label className="mb-2 block text-sm font-500 text-slate-300">Organisasjonstype</label>
              <select value={orgType} onChange={(event) => setOrgType(event.target.value)} className="bio-input">
                <option value="kommune">Kommune</option>
                <option value="skole">Skole</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-500 text-slate-300">Navn</label>
              <input value={organization} onChange={(event) => setOrganization(event.target.value)} className="bio-input" placeholder={orgType === 'kommune' ? 'Kommunenavn' : 'Skolenavn'} />
            </div>
          </div>
          <button onClick={() => setStep(2)} disabled={!organization.trim()} className="btn-primary w-full">Neste</button>
        </>
      )}

      {step === 2 && (
        <>
          <button onClick={() => setStep(1)} className="btn-ghost -ml-3 w-fit"><ArrowLeft size={14} />Tilbake</button>
          <div className="space-y-2">
            <h2 className="text-2xl font-700 tracking-[-0.03em] text-white">Moduler som aktiveres</h2>
            <p className="text-sm leading-7 text-slate-400">Dette er arbeidsflatene adminrollen far tilgang til i forste versjon av oppsettet.</p>
          </div>
          <div className="space-y-2">
            {['Bøttedrift', 'Rapporter', 'Brukere'].map((module) => (
              <div key={module} className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm text-slate-200">{module}</div>
            ))}
          </div>
          <button onClick={() => setStep(3)} className="btn-primary w-full">Neste</button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="rounded-[28px] border border-bio-500/20 bg-bio-500/12 p-6 text-center">
            <ShieldCheck className="mx-auto mb-3 text-bio-200" size={28} />
            <h2 className="text-2xl font-700 text-white">Adminflate klar</h2>
            <p className="mt-2 text-sm text-slate-300">{organization}</p>
          </div>
          <button onClick={() => onComplete({ role: 'admin', organization: organization.trim(), organizationType: orgType })} disabled={loading} className="btn-primary w-full">Fullfor <Check size={16} /></button>
        </>
      )}
    </div>
  );
}
