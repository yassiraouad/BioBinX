import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useDemo } from '../../hooks/useDemo';
import Layout from '../../components/layout/Layout';
import { getUserProfile, getEcoLevel, getEcoLevelProgress } from '../../firebase/db';
import { calculateCO2Saved } from '../../utils/calculator';
import { ALL_BADGES } from '../../firebase/db';
import { Loader2, Leaf, Wind, Trophy, Clock } from 'lucide-react';

export default function EcoProfilePage() {
  const { user, userData, loading } = useAuth();
  const { isDemo, demoUser, demoData, localState } = useDemo();
  const router = useRouter();
  const { uid } = router.query;
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (isDemo) {
      setProfile({
        name: demoUser.name,
        email: demoUser.email,
        ecoPoints: localState.points,
        points: localState.points,
        totalWaste: localState.totalWeight,
        currentStreak: localState.streak,
        badges: demoUser.badges || [],
        role: demoUser.role,
        className: demoUser.className,
        recentLogs: (demoData.recentScans || []).map((scan) => ({
          id: scan.id,
          weight: scan.weight,
          points: scan.points,
          timestamp: { toDate: () => new Date(scan.timestamp) },
        })),
      });
      setLoadingProfile(false);
      return;
    }
    
    const targetUid = uid || user?.uid;
    if (!targetUid) {
      router.push('/auth/login');
      return;
    }
    
    if (userData?.role === 'student' && uid && uid !== user.uid) {
      router.push('/auth/login');
      return;
    }
    
    loadProfile(targetUid);
  }, [uid, user, userData, loading, isDemo, demoUser, demoData, localState]);

  const loadProfile = async (targetUid) => {
    setLoadingProfile(true);
    try {
      const data = await getUserProfile(targetUid);
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  if (loading || loadingProfile || !profile) {
    return (
      <Layout>
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <Loader2 size={32} className="text-bio-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  const eco = getEcoLevel(profile.ecoPoints || 0);
  const progress = getEcoLevelProgress(profile.ecoPoints || 0);
  const co2Saved = (profile.totalWaste || 0) * 0.8;
  const earnedBadges = profile.badges || [];

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="bio-card p-8 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-bio-600 to-moss-700 flex items-center justify-center text-white font-display font-700 text-3xl">
              {profile.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="font-display font-700 text-white text-2xl">{profile.name}</h1>
              <p className="text-slate-400 font-body">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl">{eco.icon}</span>
                <span className="text-bio-400 font-600">{eco.level}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/5 text-center">
              <div className="font-display font-700 text-white text-xl">{profile.ecoPoints || 0}</div>
              <div className="text-slate-500 text-xs">eco-poeng</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 text-center">
              <div className="font-display font-700 text-white text-xl">{co2Saved.toFixed(1)}</div>
              <div className="text-slate-500 text-xs">kg CO₂ spart</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 text-center">
              <div className="font-display font-700 text-white text-xl">{profile.currentStreak || 0}</div>
              <div className="text-slate-500 text-xs">dager streak</div>
            </div>
          </div>

          {eco.nextThreshold && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Progress til {eco.nextLevel}</span>
                <span className="text-slate-500">{eco.nextThreshold - (profile.ecoPoints || 0)} poeng igjen</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: eco.color }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bio-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Trophy size={20} className="text-yellow-400" />
            <h2 className="font-display font-700 text-white text-lg">Badges</h2>
            <span className="text-slate-500 text-sm ml-auto">{earnedBadges.length}/{ALL_BADGES.length}</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_BADGES.map(badge => {
              const earned = earnedBadges.includes(badge.id);
              return (
                <div 
                  key={badge.id} 
                  className={`p-4 rounded-xl text-center transition-all ${earned ? 'badge-earned' : 'badge-locked'}`}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className={`font-display font-700 text-sm ${earned ? 'text-white' : 'text-slate-500'}`}>
                    {badge.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bio-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <Clock size={20} className="text-bio-400" />
            <h2 className="font-display font-700 text-white text-lg">Aktivitetshistorikk</h2>
          </div>
          
          {profile.recentLogs?.length === 0 ? (
            <p className="text-slate-500 text-center py-8 font-body">Ingen aktivitet ennå</p>
          ) : (
            <div className="space-y-3">
              {profile.recentLogs?.slice(0, 10).map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-bio-500/10 flex items-center justify-center text-lg">🥬</div>
                    <div>
                      <div className="text-white text-sm font-body">
                        {log.type === 'checkin' ? 'Sjekket inn' : `${log.weight} kg matavfall`}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleDateString('no-NO') : 'Ukjent'}
                      </div>
                    </div>
                  </div>
                  {log.points > 0 && (
                    <div className="text-bio-400 font-mono text-sm">+{log.points}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
