import { useState, useEffect } from 'react';
import { Trophy, Flame, Loader2 } from 'lucide-react';
import { getClassLeaderboardWithStreak, getEcoLevel } from '../firebase/db';

export default function Klasseligaen({ userData }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getClassLeaderboardWithStreak();
      setClasses(data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
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

  return (
    <div className="bio-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={20} className="text-earth-400" />
        <h2 className="font-display font-700 text-white text-lg">Klasse-ligaen</h2>
        <span className="text-slate-500 text-sm font-body ml-auto">Denne uken</span>
      </div>

      <div className="space-y-3">
        {classes.map((cls, index) => {
          const isHighlighted = userData?.classId === cls.id;
          const rank = index + 1;
          
          return (
            <div
              key={cls.id}
              className={`p-4 rounded-xl flex items-center gap-4 transition-all ${
                isHighlighted 
                  ? 'bg-bio-500/10 border border-bio-500/30' 
                  : rank <= 3 
                    ? 'bg-white/4 border border-white/8' 
                    : 'bg-white/2 border border-white/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-700 text-lg ${
                rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                rank === 3 ? 'bg-orange-400/20 text-orange-300' :
                'bg-white/5 text-slate-500'
              }`}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-body font-600 ${isHighlighted ? 'text-bio-400' : 'text-white'}`}>
                    {cls.name}
                  </h3>
                  {cls.streak && (
                    <span className="flex items-center gap-1 text-xs text-orange-400">
                      <Flame size={12} className="fill-orange-400" />
                      🔥
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs">
                  {cls.studentCount} elever · {cls.ecoIcon} {cls.ecoLevel}
                </p>
              </div>

              <div className="text-right">
                <div className="font-display font-700 text-white text-xl">{cls.weeklyKg}</div>
                <div className="text-slate-500 text-xs">kg denne uken</div>
              </div>
            </div>
          );
        })}
      </div>

      {classes.length === 0 && (
        <p className="text-center text-slate-500 py-8 font-body">
          Ingen klasser registrert ennå
        </p>
      )}
    </div>
  );
}