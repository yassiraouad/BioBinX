import { useState, useEffect } from 'react';
import { Loader2, Leaf, Wind, Zap, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getGroupStats } from '../firebase/db';

export default function GroupStats({ groupId, teacherId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (groupId) {
      loadStats();
    }
  }, [groupId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const groupStats = await getGroupStats(groupId);
      setStats(groupStats);
    } catch (err) {
      console.error('Error loading group stats:', err);
      setError('Klarte ikke laste gruppestatistikk');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bio-card p-6 flex items-center justify-center">
        <Loader2 size={24} className="text-bio-400 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const chartData = stats.comparison.map(g => ({
    name: g.groupName.length > 12 ? g.groupName.substring(0, 12) + '...' : g.groupName,
    kg: parseFloat(g.totalWaste.toFixed(1)),
    isCurrent: g.isCurrent,
  }));

  const maxWaste = Math.max(...chartData.map(d => d.kg), 1);

  return (
    <div className="space-y-6">
      <div className="bio-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart2 size={20} className="text-bio-400" />
          <h2 className="font-display font-700 text-white text-lg">Statistikk: {stats.groupName}</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/4">
            <Leaf size={18} className="text-bio-400 mb-2" />
            <div className="font-display font-700 text-white text-xl">{stats.totalWaste.toFixed(1)}</div>
            <div className="text-slate-500 text-xs">kg matavfall</div>
          </div>
          <div className="p-4 rounded-xl bg-white/4">
            <Zap size={18} className="text-moss-400 mb-2" />
            <div className="font-display font-700 text-white text-xl">{stats.energyKwh.toFixed(1)}</div>
            <div className="text-slate-500 text-xs">kWh energi</div>
          </div>
          <div className="p-4 rounded-xl bg-white/4">
            <Wind size={18} className="text-earth-400 mb-2" />
            <div className="font-display font-700 text-white text-xl">{stats.co2Saved.toFixed(1)}</div>
            <div className="text-slate-500 text-xs">kg CO₂ spart</div>
          </div>
          <div className="p-4 rounded-xl bg-white/4">
            <div className="w-9 h-9 rounded-lg bg-bio-500/15 flex items-center justify-center mb-2">
              <span className="text-bio-400 font-600 text-lg">{stats.memberCount}</span>
            </div>
            <div className="text-slate-500 text-xs">medlemmer</div>
          </div>
        </div>

        {chartData.length > 1 && (
          <div>
            <h3 className="text-slate-400 text-sm font-body font-500 mb-4">Sammenligning med andre grupper i {stats.className}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{ background: '#1a2d1f', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', fontFamily: 'DM Sans' }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#4ade80' }}
                  formatter={(value) => [`${value} kg`, 'Matavfall']}
                />
                <Bar dataKey="kg" fill="#22c55e" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}