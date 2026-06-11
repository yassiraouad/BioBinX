import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { getLiveSessionByPIN, joinLiveSession } from '../../firebase/db';
import { Brain, ArrowLeft, Loader, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JoinQuiz() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!pin || pin.length !== 6) {
      toast.error('PIN må være 6 siffer');
      return;
    }
    if (!user) {
      router.push('/auth/login?redirect=/quiz/join');
      return;
    }

    setJoining(true);
    try {
      const session = await getLiveSessionByPIN(pin);
      if (!session) {
        toast.error('ingen quiz funnet med denne PIN-koden');
        return;
      }

      if (session.status !== 'lobby') {
        toast.error('Denne quizen er allerede i gang eller er avsluttet');
        return;
      }

      await joinLiveSession({
        sessionId: session.id,
        uid: user.uid,
        displayName: userData?.name || user.email?.split('@')[0] || 'Elev',
      });

      router.push(`/quiz/lobby-student?session=${session.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Kunne ikke bli med i quiz');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-bio-500/5 rounded-full blur-[120px]" />
        <div className="dot-pattern absolute inset-0 opacity-20" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-bio-500 to-bio-700 flex items-center justify-center bio-glow">
              <Brain size={22} className="text-white" />
            </div>
            <span className="font-display font-800 text-white text-2xl">BioBin X</span>
          </Link>
          <h1 className="font-display font-700 text-white text-3xl mb-2">Bli med i quiz</h1>
          <p className="text-slate-400 font-body">Skriv inn PIN-koden fra læreren din</p>
        </div>

        <form onSubmit={handleJoin} className="bio-card p-8">
          <div className="mb-6">
            <label className="text-slate-300 text-sm font-body font-500 block mb-2">PIN-kode</label>
            <div className="relative">
              <Hash size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="bio-input pl-12 text-center text-2xl font-mono tracking-[0.5em]"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={joining || pin.length !== 6}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50"
          >
            {joining ? <Loader size={18} className="animate-spin" /> : 'Bli med'}
          </button>
        </form>

        <p className="text-center text-slate-400 mt-6 font-body">
          <Link href="/auth/login" className="text-bio-400 hover:text-bio-300">Logg inn</Link> for å bli med i quiz
        </p>
      </div>
    </div>
  );
}
