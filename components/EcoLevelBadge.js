import { useState, useEffect } from 'react';
import { getEcoLevel, getEcoLevelProgress, addEcoPoints } from '../firebase/db';

export default function EcoLevelBadge({ userData }) {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(null);
  
  const points = userData?.ecoPoints || 0;
  const eco = getEcoLevel(points);
  const progress = getEcoLevelProgress(points);

  useEffect(() => {
    if (prevLevel && prevLevel !== eco.level) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    setPrevLevel(eco.level);
  }, [eco.level]);

  return (
    <>
      <div className="bio-card p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: eco.color, filter: 'blur(20px)' }} />
        
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: `${eco.color}20` }}
          >
            {eco.icon}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg" style={{ color: eco.color }}>{eco.icon}</span>
              <h3 className="font-display font-700 text-white text-lg">{eco.level}</h3>
            </div>
            <p className="text-slate-400 text-sm font-body">
              {points} eco-poeng
            </p>
          </div>
        </div>

        {eco.nextThreshold && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Fremdrift</span>
              <span>{eco.nextThreshold - points} poeng til {eco.nextLevel}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progress}%`,
                  background: eco.color
                }}
              />
            </div>
          </div>
        )}
      </div>

      {showLevelUp && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-bio-500/90 backdrop-blur-sm px-8 py-4 rounded-2xl animate-bounce">
            <p className="text-white font-display font-700 text-xl text-center">
              🎉 Gratulerer! Du nådde {eco.level}! 🎉
            </p>
          </div>
        </div>
      )}
    </>
  );
}