// pages/dashboard/parent.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/layout/Layout';
import { getParentChildData } from '../../firebase/db';
import { getEcoLevel, calculateCO2Saved } from '../../firebase/db';
import { Users, Leaf, Zap, Wind, Trophy, Loader2, Flame } from 'lucide-react';
import { ALL_BADGES } from '../../firebase/db';

export default function ParentDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [childData, setChildData] = useState(null);
  const [loadingChild, setLoadingChild] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'parent')) {
      router.push('/auth/login');
    }
  }, [user, userData, loading]);

  useEffect(() => {
    if (user && userData?.role === 'parent') {
      loadChildData();
    }
  }, [user]);

  const loadChildData = async () => {
    setLoadingChild(true);
    try {
      const data = await getParentChildData(user.uid);
      setChildData(data);
    } catch (err) {
      console.error('Error loading child data:', err);
    } finally {
      setLoadingChild(false);
    }
  };

  if (loading || loadingChild) {
    return (
      <Layout>
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <Loader2 size={32} className="text-bio-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!childData) {
    return (
      <Layout>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="bio-card p-8 text-center">
            <Users size={48} className="text-slate-600 mx-auto mb-4" />
            <h2 className="font-display font-700 text-white text-xl mb-2">Ingen barn tilknyttet</h2>
            <p className="text-slate-400 font-body">
              Kontakt barnets skole for å koble til kontoen din.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const eco = getEcoLevel(childData.ecoPoints || 0);
  const co2Saved = (childData.totalWaste || 0) * 0.8;
  const earnedBadges = childData.badges || [];

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display font-700 text-white text-2xl lg:text-3xl mb-1">
            Foreldre-dashboard 👨‍👩‍👧
          </h1>
          <p className="text-slate-400 font-body">Oversikt over {childData.name}</p>
        </div>

        <div className="bio-card p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bio-600 to-moss-700 flex items-center justify-center text-white font-display font-700 text-2xl">
              {childData.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="font-display font-700 text-white text-xl">{childData.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl">{eco.icon}</span>
                <span className="text-bio-400 font-600">{eco.level}</span>
                {childData.currentStreak > 0 && (
                  <span className="flex items-center gap-1 text-orange-400 text-sm">
                    <Flame size={14} className="fill-orange-400" />
                    {childData.currentStreak} dager
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bio-card p-5">
            <Leaf size={18} className="text-bio-400 mb-2" />
            <div className="font-display font-700 text-white text-xl">{(childData.totalWaste || 0).toFixed(1)}</div>
            <div className="text-slate-500 text-xs">kg matavfall</div>
          </div>
          <div className="bio-card p-5">
            <Zap size={18} className="text-moss-400 mb-2" />
            <div className="font-display font-700 text-white text-xl">{((childData.totalWaste || 0) * 0.5).toFixed(1)}</div>
            <div className="text-slate-500 text-xs">kWh energi</div>
          </div>
          <div className="bio-card p-5">
            <Wind size={18} className="text-earth-400 mb-2" />
            <div className="font-display font-700 text-white text-xl">{co2Saved.toFixed(1)}</div>
            <div className="text-slate-500 text-xs">kg CO₂ spart</div>
          </div>
          <div className="bio-card p-5">
            <Trophy size={18} className="text-yellow-400 mb-2" />
            <div className="font-display font-700 text-white text-xl">{earnedBadges.length}</div>
            <div className="text-slate-500 text-xs">badges</div>
          </div>
        </div>

        <div className="bio-card p-6">
          <h3 className="font-display font-700 text-white text-lg mb-4">Earned Badges</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_BADGES.map(badge => {
              const earned = earnedBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl text-center ${earned ? 'badge-earned' : 'badge-locked'}`}
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
      </div>
    </Layout>
  );
}