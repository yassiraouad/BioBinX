import { useRouter } from 'next/router';
import Link from 'next/link';
import { useDemo } from '../hooks/useDemo';
import { Gamepad2, X } from 'lucide-react';

export default function DemoBanner() {
  const { isDemo, exitDemo } = useDemo();
  const router = useRouter();

  if (!isDemo) return null;

  const handleRegister = () => {
    exitDemo();
    router.push('/auth/signup');
  };

  const handleLogin = () => {
    exitDemo();
    router.push('/auth/login');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500/90 to-yellow-500/90 backdrop-blur-sm border-b border-amber-400/30">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 size={18} className="text-white" />
          <span className="text-white text-sm font-body font-500">
            Du er i demo-modus — data lagres ikke. Opprett konto for å komme i gang.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogin}
            className="text-white/80 hover:text-white text-sm font-body font-500 underline"
          >
            Logg inn
          </button>
          <button
            onClick={handleRegister}
            className="px-3 py-1 bg-white text-amber-600 rounded-lg text-sm font-display font-600 hover:bg-white/90 transition-colors"
          >
            Registrer deg
          </button>
        </div>
      </div>
    </div>
  );
}