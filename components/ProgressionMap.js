import { MapPin, Mountain, Building2, Trees, Flag } from 'lucide-react';

const STAGES = [
  { threshold: 0, name: 'Nybegynner-skogen', icon: '🌱', desc: 'Start reisen din mot et grønnere liv!' },
  { threshold: 100, name: 'Gjenvinnings-dalen', icon: '♻️', desc: 'Du har kommet i gang med resirkulering!' },
  { threshold: 300, name: 'Bærekraft-byen', icon: '🏙️', desc: 'Du bidrar aktivt til bærekraft!' },
  { threshold: 700, name: 'Eco-fjellet', icon: '⛰️', desc: 'Du er på vei mot toppen!' },
  { threshold: 1500, name: 'BioBin Elite-toppen', icon: '🏔️', desc: 'Du er en ekte miljøhelt!' },
];

export default function ProgressionMap({ ecoPoints }) {
  const currentStageIndex = STAGES.findIndex((s, i) => {
    const next = STAGES[i + 1];
    if (!next) return ecoPoints >= s.threshold;
    return ecoPoints >= s.threshold && ecoPoints < next.threshold;
  });

  const currentStage = STAGES[currentStageIndex];
  const nextStage = STAGES[currentStageIndex + 1];
  const progress = nextStage 
    ? ((ecoPoints - currentStage.threshold) / (nextStage.threshold - currentStage.threshold)) * 100
    : 100;

  return (
    <div className="bio-card p-6">
      <h2 className="font-display font-700 text-white text-lg mb-6">Min reise 🗺️</h2>
      
      <div className="relative">
        <div className="absolute top-0 bottom-0 left-6 w-1 bg-slate-700" />
        
        <div className="space-y-6">
          {STAGES.map((stage, i) => {
            const isUnlocked = ecoPoints >= stage.threshold;
            const isCurrent = i === currentStageIndex;
            const Icon = isUnlocked ? MapPin : () => null;
            
            return (
              <div key={stage.threshold} className="flex items-start gap-4">
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                  isUnlocked 
                    ? isCurrent 
                      ? 'bg-bio-500 text-white animate-pulse' 
                      : 'bg-bio-500/30 text-bio-400'
                    : 'bg-slate-700 text-slate-500'
                }`}>
                  {isUnlocked ? stage.icon : '🔒'}
                </div>
                <div className={`flex-1 ${isUnlocked ? '' : 'opacity-40'}`}>
                  <h3 className={`font-body font-600 ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                    {stage.name}
                  </h3>
                  <p className="text-slate-500 text-sm">{stage.desc}</p>
                  {!isUnlocked && nextStage && (
                    <p className="text-slate-600 text-xs mt-1">
                      {nextStage.threshold - ecoPoints} poeng igjen
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {nextStage && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Progress til {nextStage.name}</span>
            <span className="text-bio-400 font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-bio-500 to-moss-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}