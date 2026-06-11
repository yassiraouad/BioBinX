// pages/auth/login.js
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { loginUser } from '../../firebase/auth';
import { useDemo } from '../../hooks/useDemo';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Gamepad2, LayoutDashboard, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from '../../components/ui/AuthShell';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { startDemo, startDemoWithCredentials, demoCredentials } = useDemo();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Fyll inn e-post og passord');
    setLoading(true);
    try {
      const matchedDemoRole = startDemoWithCredentials({ email, password });
      if (matchedDemoRole) {
        toast.success(`Demo innlogget som ${matchedDemoRole === 'teacher' ? 'laerer' : 'elev'}!`);
        router.push(matchedDemoRole === 'teacher' ? '/dashboard/demo-teacher' : '/dashboard/demo-student');
        return;
      }

      const user = await loginUser({ email, password });
      toast.success(`Velkommen tilbake, ${user.name}!`);
      if (user.role === 'admin') {
        router.push('/dashboard/admin');
      } else if (user.role === 'teacher') {
        router.push('/dashboard/teacher');
      } else if (user.role === 'rector') {
        router.push('/dashboard/rector');
      } else {
        router.push('/dashboard/student');
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.message === 'Firebase not configured'
        ? 'Firebase er ikke konfigurert. Sjekk miljøvariabler.'
        : err.code === 'auth/invalid-credential'
        ? 'Feil e-post eller passord'
        : err.code === 'auth/email-not-allowed'
        ? 'Denne e-postadressen er ikke tillatt for registrering'
        : err.code === 'auth/user-not-found'
        ? 'Bruker finnes ikke'
        : err.code === 'auth/email-already-in-use'
        ? 'E-post allerede i bruk'
        : 'Innlogging feilet. Prøv igjen.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role = 'teacher') => {
    startDemo(role);
    router.push(role === 'teacher' ? '/dashboard/demo-teacher' : '/dashboard/demo-student');
  };

  const fillDemoCredentials = (role) => {
    const creds = demoCredentials?.[role];
    if (!creds) return;
    setEmail(creds.email);
    setPassword(creds.password);
    toast.success(`Demo ${role === 'teacher' ? 'laerer' : 'elev'} legitimasjon fylt inn`);
  };

  return (
    <AuthShell
      eyebrow="Eksisterende konto"
      title="Logg inn i arbeidsflaten din."
      description="BioBin X er laget for skoler som trenger en tydelig kobling mellom registrering, elevflyt og oppfolging. Logg inn med skolekontoen din eller bruk demo for a se hele produktet i praksis."
      sideTitle="Demoen viser ekte produktlogikk"
      sideDescription="Ingen markedsforingsmockups. Du gar rett inn i de samme rollene, oppsettene og dataflatene som produktet er bygget rundt."
      sideContent={
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => fillDemoCredentials('teacher')}
            className="flex w-full items-start justify-between rounded-2xl border border-white/8 bg-white/4 p-4 text-left transition-all hover:border-white/12 hover:bg-white/6"
          >
            <div>
              <div className="flex items-center gap-2 text-sm font-600 text-white">
                <LayoutDashboard size={16} className="text-bio-200" />
                Demo laerer
              </div>
              <div className="mt-1 text-xs text-slate-500">{demoCredentials?.teacher?.email}</div>
            </div>
            <span className="text-xs text-slate-500">Fyll inn</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemoCredentials('student')}
            className="flex w-full items-start justify-between rounded-2xl border border-white/8 bg-white/4 p-4 text-left transition-all hover:border-white/12 hover:bg-white/6"
          >
            <div>
              <div className="flex items-center gap-2 text-sm font-600 text-white">
                <Users size={16} className="text-earth-200" />
                Demo elev
              </div>
              <div className="mt-1 text-xs text-slate-500">{demoCredentials?.student?.email}</div>
            </div>
            <span className="text-xs text-slate-500">Fyll inn</span>
          </button>

          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => handleDemoLogin('teacher')} className="btn-secondary w-full justify-start rounded-2xl px-4 py-4 text-left">
              <Gamepad2 size={16} />
              Start laerer-demo
            </button>
            <button type="button" onClick={() => handleDemoLogin('student')} className="btn-secondary w-full justify-start rounded-2xl px-4 py-4 text-left">
              <Gamepad2 size={16} />
              Start elev-demo
            </button>
          </div>
        </div>
      }
      footer={
        <p className="text-center text-sm text-slate-400">
          Har ikke konto?{' '}
          <Link href="/auth/signup" className="font-600 text-bio-200 hover:text-white">
            Opprett konto
          </Link>
        </p>
      }
    >
      <div className="space-y-2">
        <div className="app-eyebrow">Innlogging</div>
        <h2 className="text-3xl font-700 tracking-[-0.04em] text-white">Velkommen tilbake</h2>
        <p className="text-sm leading-7 text-slate-400">Bruk e-post og passord for a apne rollen din, fortsette onboardingen eller ga rett til dashboardet.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-500 text-slate-300">E-post</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="din@skole.no"
              className="bio-input pl-11"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-500 text-slate-300">Passord</label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Skriv inn passordet ditt"
              className="bio-input pl-11 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-4 text-base">
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              Logg inn
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
