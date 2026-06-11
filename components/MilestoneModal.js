import { useState, useEffect } from 'react';
import { X, Trophy, Star, Award, Sparkles, Confetti } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const milestones = {
  first_scan: { title: 'Første skann!', desc: 'Du registrerte din første matavfall', icon: Star, color: 'from-yellow-400 to-orange-500', points: 10 },
  week_streak_1: { title: 'Ukens helt', desc: 'Skannet hver dag denne uken', icon: Trophy, color: 'from-green-400 to-emerald-500', points: 50 },
  week_streak_4: { title: 'Månedsmester', desc: 'Skannet hver dag i en måned', icon: Award, color: 'from-purple-400 to-pink-500', points: 200 },
  points_100: { title: '100 poeng', desc: 'Du har samlet 100 poeng!', icon: Star, color: 'from-blue-400 to-cyan-500', points: 25 },
  points_500: { title: '500 poeng', desc: 'Imponerende! 500 poeng', icon: Award, color: 'from-indigo-400 to-purple-500', points: 50 },
  points_1000: { title: 'Tusenpoeng', desc: 'Fullført 1000 poeng!', icon: Trophy, color: 'from-amber-400 to-yellow-500', points: 100 },
  class_top_1: { title: 'Klasseleder', desc: 'Du er på topp i klassen!', icon: Trophy, color: 'from-red-400 to-rose-500', points: 100 },
  eco_level_up: { title: 'Level opp!', desc: 'Du gikk opp til nytt øko-nivå', icon: Star, color: 'from-bio-400 to-moss-500', points: 75 },
  challenge_complete: { title: 'Utfordring løst!', desc: 'Du fullførte en utfordring', icon: Award, color: 'from-earth-400 to-moss-500', points: 50 },
  perfect_week: { title: 'Perfekt uke', desc: '7 dager med skanning', icon: Sparkles, color: 'from-violet-400 to-purple-500', points: 75 },
};

export default function MilestoneModal({ isOpen, onClose, milestoneKey }) {
  const { userData } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !milestoneKey) return null;

  const milestone = milestones[milestoneKey] || {
    title: 'Milepæl!',
    desc: 'Du har oppnådd en ny milepæl',
    icon: Award,
    color: 'from-bio-400 to-moss-500',
    points: 25,
  };

  const Icon = milestone.icon;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          <Confetti className="absolute top-10 left-1/4 text-yellow-400" />
          <Confetti className="absolute top-20 right-1/4 text-green-400" />
          <Confetti className="absolute top-40 left-1/3 text-purple-400" />
          <Confetti className="absolute top-60 right-1/3 text-blue-400" />
        </div>
      )}
      <div className="bio-card p-8 w-full max-w-sm text-center animate-slide-up relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${milestone.color} opacity-10`} />
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={20} />
        </button>

        <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${milestone.color} flex items-center justify-center bio-glow`}>
          <Icon size={36} className="text-white" />
        </div>

        <h2 className="font-display font-700 text-white text-2xl mb-2">{milestone.title}</h2>
        <p className="text-slate-400 font-body mb-4">{milestone.desc}</p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bio-500/20 border border-bio-500/30">
          <Sparkles size={16} className="text-bio-400" />
          <span className="text-bio-400 font-display font-600">+{milestone.points} poeng</span>
        </div>

        <div className="mt-6 text-slate-500 text-sm font-body">
          {userData?.name}, du er fantastisk! 🌱
        </div>
      </div>
    </div>
  );
}