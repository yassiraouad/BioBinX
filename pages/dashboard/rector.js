// pages/dashboard/rector.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/layout/Layout';
import { getSchoolStats } from '../../firebase/db';
import { calculateCO2Saved } from '../../utils/calculator';
import { School, Users, Leaf, Wind, Zap, Trash2, AlertTriangle, Download, Loader2, Trophy } from 'lucide-react';

export default function RectorDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [schoolStats, setSchoolStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'rektor')) {
      router.push('/auth/login');
    }
  }, [user, userData, loading]);

  useEffect(() => {
    if (user && userData?.role === 'rektor' && userData.schoolId) {
      loadSchoolStats();
    }
  }, [user, userData]);

  const loadSchoolStats = async () => {
    setLoadingStats(true);
    try {
      const stats = await getSchoolStats(userData.schoolId);
      setSchoolStats(stats);
    } catch (err) {
      console.error('Error loading school stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats || !schoolStats) {
    return (
      <Layout>
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <Loader2 size={32} className="text-bio-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  const co2SavedAllTime = calculateCO2Saved(schoolStats.totalKgAllTime);
  const mostActiveClass = schoolStats.classes[0];

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display font-700 text-white text-2xl lg:text-3xl mb-1">
            Skole-dashboard 🏫
          </h1>
          <p className="text-slate-400 font-body">Oversikt over {userData.schoolName}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bio-card p-5">
            <Leaf size={18} className="text-bio-400 mb-2" />
            <div className="font-display font-700 text-white text-2xl">{schoolStats.totalKgAllTime.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">kg totalt</div>
          </div>
          <div className="bio-card p-5">
            <Wind size={18} className="text-earth-400 mb-2" />
            <div className="font-display font-700 text-white text-2xl">{co2SavedAllTime.toFixed(0)}</div>
            <div className="text-slate-500 text-xs">kg CO₂ spart</div>
          </div>
          <div className="bio-card p-5">
            <Users size={18} className="text-moss-400 mb-2" />
            <div className="font-display font-700 text-white text-2xl">{schoolStats.totalStudents}</div>
            <div className="text-slate-500 text-xs">elever</div>
          </div>
          <div className="bio-card p-5">
            <Zap size={18} className="text-yellow-400 mb-2" />
            <div className="font-display font-700 text-white text-2xl">{schoolStats.totalEcoPoints.toLocaleString()}</div>
            <div className="text-slate-500 text-xs">eco-poeng</div>
          </div>
        </div>

        {/* Bin Status */}
        <div className="bio-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 size={20} className="text-bio-400" />
            <h2 className="font-display font-700 text-white text-lg">Bøtte-status</h2>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-300">{schoolStats.activeBins} aktive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-slate-300">{schoolStats.inactiveBins} inaktive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-300">{schoolStats.offlineBins} frakoblet</span>
            </div>
          </div>
        </div>

        {/* Class Comparison */}
        <div className="bio-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-earth-400" />
              <h2 className="font-display font-700 text-white text-lg">Klasse-sammenligning</h2>
            </div>
            <button className="btn-primary flex items-center gap-2 text-sm">
              <Download size={16} /> Last ned rapport
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-500 text-sm font-body">
                  <th className="pb-3 font-500">Klasse</th>
                  <th className="pb-3 font-500">Kg denne uken</th>
                  <th className="pb-3 font-500">Elever</th>
                  <th className="pb-3 font-500">Total kg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {schoolStats.classes.map((cls, i) => (
                  <tr key={cls.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="text-lg">🏆</span>}
                        <span className="text-white font-body">{cls.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`font-mono ${i === 0 ? 'text-bio-400' : 'text-slate-300'}`}>
                        {cls.weeklyKg?.toFixed(1) || 0} kg
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{cls.studentCount || 0}</td>
                    <td className="py-3 text-slate-400">{(cls.totalWaste || 0).toFixed(0)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
          <p className="text-slate-500 text-sm">
            Dette dashboardet er skrivebeskyttet. Kontakt administrator for endringer.
          </p>
        </div>
      </div>
    </Layout>
  );
}