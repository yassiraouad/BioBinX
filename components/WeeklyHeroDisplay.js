import { useState, useEffect } from 'react';
import { Trophy, Star, Crown, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getWeeklyHero } from '../firebase/db';

export default function WeeklyHeroDisplay({ classId, isTeacher = false }) {
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId) {
      loadWeeklyHero();
    }
  }, [classId]);

  const loadWeeklyHero = async () => {
    try {
      const heroData = await getWeeklyHero(classId);
      setHero(heroData);
    } catch (err) {
      console.error('Error loading weekly hero:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const defaultHero = {
    name: 'Ingen kåret ennå',
    avatar: null,
    points: 0,
    scans: 0,
  };

  const h = hero || defaultHero;

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-xl border border-amber-500/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Crown size={18} className="text-amber-400" />
        <h3 className="font-display font-600 text-white text-sm">Ukens Hel</h3>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-display font-700 text-lg">
          {h.name !== 'Ingen kåret ennå' ? h.name[0].toUpperCase() : '?'}
        </div>
        <div className="flex-1">
          <div className="text-white font-display font-600 text-sm">{h.name}</div>
          {h.name !== 'Ingen kåret ennå' && (
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Trophy size={12} className="text-amber-400" />
                {h.points}p
              </span>
              <span className="flex items-center gap-1">
                <Star size={12} className="text-bio-400" />
                {h.scans} skann
              </span>
            </div>
          )}
        </div>
      </div>

      {isTeacher && h.name === 'Ingen kåret ennå' && (
        <button
          onClick={() => {
            // This would open a modal to select the hero
            toast.success('Velg ukens helt fra klassen!');
          }}
          className="mt-3 w-full py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-display font-500 hover:bg-amber-500/30 transition-colors"
        >
          Kåre ukens helt
        </button>
      )}
    </div>
  );
}