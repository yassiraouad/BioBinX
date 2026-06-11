// pages/auth/signup.js
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { registerUser } from '../../firebase/auth';
import { Mail, Lock, User, Hash, Eye, EyeOff, ArrowRight, GraduationCap, School, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from '../../components/ui/AuthShell';

const roles = [
  {
    value: 'student',
    label: 'Elev',
    hint: 'Registrerer kast og folger egen progresjon.',
    icon: GraduationCap,
  },
  {
    value: 'teacher',
    label: 'Laerer',
    hint: 'Oppretter klasser, mal og oppfolging.',
    icon: School,
  },
  {
    value: 'rector',
    label: 'Skoleleder',
    hint: 'Ser aktivitet og utvikling pa tvers.',
    icon: ShieldCheck,
  },
];

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', classCode: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Fyll inn alle felt');
    if (form.password.length < 6) return toast.error('Passordet ma vaere minst 6 tegn');
    if (form.role === 'student' && !form.classCode) return toast.error('Skriv inn klassekoden');
    setLoading(true);
    try {
      await registerUser(form);
      toast.success(`Konto opprettet! Velkommen, ${form.name}!`);
      if (form.role === 'admin') {
        router.push('/dashboard/admin');
      } else if (form.role === 'teacher') {
        router.push('/dashboard/teacher');
      } else {
        router.push('/dashboard/student');
      }
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'E-postadressen er allerede i bruk'
        : err.code === 'auth/email-not-allowed'
        ? 'Denne e-postadressen er ikke tillatt'
        : 'Registrering feilet. Prov igjen.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Ny konto"
      title="Sett opp riktig rolle fra start."
      description="Opprett konto med rollen som matcher hvordan du faktisk skal bruke produktet. Videre onboarding tilpasses klassekode, skoleoppsett og ukentlige mal etterpa."
      sideTitle="Hva som skjer etter registrering"
      sideDescription="Du gar ikke rett inn i et tomt dashboard. Forst kobles du til riktig skolekontekst, sa blir arbeidsflaten satt opp rundt rollen din."
      sideContent={
        <div className="space-y-3 text-sm text-slate-300">
          {[
            'Elev: kobles til klasse via kode og far personlig progresjon.',
            'Laerer: oppretter eller kobler seg til klasse og setter forste ukesmal.',
            'Skoleleder: far oppsett for organisasjon, oversikt og oppfolging.',
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm leading-6 text-slate-300">
              {item}
            </div>
          ))}
        </div>
      }
      footer={
        <p className="text-center text-sm text-slate-400">
          Har du allerede konto?{' '}
          <Link href="/auth/login" className="font-600 text-bio-200 hover:text-white">
            Logg inn
          </Link>
        </p>
      }
    >
      <div className="space-y-2">
        <div className="app-eyebrow">Registrering</div>
        <h2 className="text-3xl font-700 tracking-[-0.04em] text-white">Opprett konto</h2>
        <p className="text-sm leading-7 text-slate-400">Velg rolle, fyll inn grunninformasjon og ga videre til et mer presist onboardinglop.</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
        <div>
          <label className="mb-3 block text-sm font-500 text-slate-300">Jeg registrerer meg som</label>
          <div className="grid gap-3 sm:grid-cols-3">
            {roles.map(({ value, label, hint, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, role: value }))}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  form.role === value
                    ? 'border-bio-500/30 bg-bio-500/12 text-white'
                    : 'border-white/8 bg-white/4 text-slate-300 hover:border-white/12 hover:bg-white/6'
                }`}
              >
                <Icon size={16} className={form.role === value ? 'text-bio-100' : 'text-slate-500'} />
                <div className="mt-3 text-sm font-600">{label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-500 text-slate-300">Fullt navn</label>
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" value={form.name} onChange={update('name')} placeholder="Kari Nordmann" className="bio-input pl-11" required />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-500 text-slate-300">E-post</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="email" value={form.email} onChange={update('email')} placeholder="din@skole.no" className="bio-input pl-11" required />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-500 text-slate-300">Passord</label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={update('password')}
              placeholder="Minst 6 tegn"
              className="bio-input pl-11 pr-12"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {form.role === 'student' && (
          <div>
            <label className="mb-2 block text-sm font-500 text-slate-300">Klassekode</label>
            <div className="relative">
              <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={form.classCode}
                onChange={update('classCode')}
                placeholder="F.eks. XK9A2B"
                className="bio-input pl-11 uppercase"
                maxLength={8}
                required
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Klassekoden far du fra laereren din. Du kan ogsa endre detaljer i onboardingen etterpa.</p>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-4 text-base">
          {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>Opprett konto <ArrowRight size={18} /></>}
        </button>
      </form>
    </AuthShell>
  );
}
