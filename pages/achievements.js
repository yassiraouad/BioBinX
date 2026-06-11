import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { checkAndGrantAchievements, getUserAchievementsProgress } from '../lib/achievements';
import { Loader2, Lock, Trophy } from 'lucide-react';

function formatUnlockedDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('nb-NO', { day: '2-digit', month: 'long' });
}

export default function AchievementsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [achievements, setAchievements] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [error, setError] = useState('');
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function loadAchievements() {
      if (!user) return;

      setLoadingAchievements(true);
      setError('');
      try {
        const before = await getUserAchievementsProgress(user.uid);
        await checkAndGrantAchievements(user.uid);
        const after = await getUserAchievementsProgress(user.uid);

        const beforeUnlocked = new Set(before.filter((item) => item.unlocked).map((item) => item.id));
        const unlockedNow = after.filter((item) => item.unlocked && !beforeUnlocked.has(item.id)).map((item) => item.id);

        setAchievements(after);
        setNewlyUnlocked(unlockedNow);
      } catch (loadError) {
        console.error(loadError);
        setError('Klarte ikke laste prestasjoner.');
      } finally {
        setLoadingAchievements(false);
      }
    }

    loadAchievements();
  }, [user]);

  const unlockedCount = useMemo(() => achievements.filter((item) => item.unlocked).length, [achievements]);

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-bio-500/30 border-t-bio-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="bio-card p-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-700 text-white text-2xl">Prestasjonssenter</h1>
            <p className="text-slate-400 text-sm">Lås opp trofeer ved å bygge gode avfallsvaner og hjelpe klassen.</p>
          </div>
          <div className="text-right">
            <div className="text-bio-300 font-display text-2xl">{unlockedCount}/{achievements.length}</div>
            <div className="text-slate-500 text-xs">ulåste prestasjoner</div>
          </div>
        </div>

        {error && <div className="bio-card p-4 text-red-300 border border-red-500/20">{error}</div>}

        {loadingAchievements ? (
          <div className="bio-card p-10 flex items-center justify-center gap-3 text-slate-300"><Loader2 className="animate-spin" size={18} />Laster prestasjoner...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {achievements.map((item) => {
              const unlockedDate = formatUnlockedDate(item.unlockedAt);
              const isNew = newlyUnlocked.includes(item.id);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`relative rounded-2xl border p-4 ${item.unlocked ? 'bg-bio-500/10 border-bio-500/30' : 'bg-white/5 border-white/10'}`}
                >
                  <AnimatePresence>
                    {isNew && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-2xl border-2 border-earth-400/70 pointer-events-none"
                      />
                    )}
                  </AnimatePresence>

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="text-2xl">{item.icon || '🏅'}</div>
                    {item.unlocked ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-earth-500/20 text-earth-300">Ulåst</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-700/70 text-slate-300 flex items-center gap-1"><Lock size={11} /> Låst</span>
                    )}
                  </div>

                  <h3 className="text-white font-display font-700 text-base leading-tight">{item.name}</h3>
                  <p className="text-slate-400 text-sm mt-1 min-h-10">{item.description}</p>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Fremdrift</span>
                      <span>{Math.min(item.progress.current, item.progress.threshold)} / {item.progress.threshold}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-bio-500 to-earth-400" style={{ width: `${item.unlocked ? 100 : item.progress.percent}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
                    <Trophy size={12} />
                    {unlockedDate ? `Ulåst ${unlockedDate}` : 'Ikke ulåst enda'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
