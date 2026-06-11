import { X, TrendingUp, Leaf, Trophy, Calendar, Award } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function MonthlyRecapModal({ isOpen, onClose, stats }) {
  const { userData } = useAuth();

  if (!isOpen) return null;

  const monthNames = ['Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'];
  const currentMonth = monthNames[new Date().getMonth()];

  const defaultStats = {
    totalScans: 42,
    totalWeight: 12.5,
    co2Saved: 8.5,
    pointsEarned: 450,
    rank: 3,
    classRank: 1,
    challengesCompleted: 5,
    streak: 7,
  };

  const s = stats || defaultStats;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bio-card p-6 w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-bio-400" />
            <h2 className="font-display font-700 text-white text-xl">Månedlig oppsummering</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-bio-500/20 to-moss-500/20 border border-bio-500/30">
            <Leaf size={16} className="text-bio-400" />
            <span className="text-bio-400 font-display font-600">{currentMonth} 2024</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-bio-400 text-2xl font-display font-700">{s.totalScans}</div>
            <div className="text-slate-500 text-xs">Skann</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-moss-400 text-2xl font-display font-700">{s.totalWeight.toFixed(1)}kg</div>
            <div className="text-slate-500 text-xs">Matavfall</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-earth-400 text-2xl font-display font-700">{s.co2Saved.toFixed(1)}kg</div>
            <div className="text-slate-500 text-xs">CO₂ spart</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-amber-400 text-2xl font-display font-700">{s.pointsEarned}</div>
            <div className="text-slate-500 text-xs">Poeng</div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <Trophy size={18} className="text-amber-400" />
              <span className="text-slate-300 font-body text-sm">Klasse-ranking</span>
            </div>
            <span className="text-white font-display font-600">#{s.classRank}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <TrendingUp size={18} className="text-bio-400" />
              <span className="text-slate-300 font-body text-sm">Rekke</span>
            </div>
            <span className="text-white font-display font-600">{s.streak} dager</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <Award size={18} className="text-purple-400" />
              <span className="text-slate-300 font-body text-sm">Utfordringer</span>
            </div>
            <span className="text-white font-display font-600">{s.challengesCompleted}</span>
          </div>
        </div>

        <div className="text-center text-slate-400 text-sm font-body">
          {userData?.name}, du er på rett vei! Fortsett å jobbe mot et grønnere miljø 🌱
        </div>
      </div>
    </div>
  );
}