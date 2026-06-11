import { useState, useEffect } from 'react';
import { Target, CheckCircle, Loader2, Trophy } from 'lucide-react';
import { getChallenges, checkChallengeCompletion, seedWeeklyChallenges, getClassTrophies } from '../firebase/db';

export default function Challenges({ classId, teacherId }) {
  const [challenges, setChallenges] = useState([]);
  const [trophies, setTrophies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await seedWeeklyChallenges();
      const data = await getChallenges();
      setChallenges(data);
      
      if (classId) {
        await checkChallengeCompletion(classId);
        const classTrophies = await getClassTrophies(classId);
        setTrophies(classTrophies);
      }
    } catch (err) {
      console.error('Error loading challenges:', err);
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

  const isCompleted = (challenge) => {
    return challenge.completedBy?.includes(classId);
  };

  return (
    <div className="space-y-6">
      <div className="bio-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Target size={20} className="text-bio-400" />
          <h2 className="font-display font-700 text-white text-lg">Ukens utfordringer</h2>
        </div>

        {challenges.length === 0 ? (
          <p className="text-slate-500 text-center py-4 font-body">
            Ingen utfordringer denne uken
          </p>
        ) : (
          <div className="space-y-3">
            {challenges.map(challenge => {
              const completed = isCompleted(challenge);
              
              return (
                <div
                  key={challenge.id}
                  className={`p-4 rounded-xl border ${
                    completed 
                      ? 'bg-earth-500/10 border-earth-500/30' 
                      : 'bg-white/4 border-white/8'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-body font-600 ${completed ? 'text-earth-400' : 'text-white'}`}>
                          {challenge.title}
                        </h3>
                        {completed && (
                          <CheckCircle size={16} className="text-earth-400" />
                        )}
                      </div>
                      <p className="text-slate-400 text-sm font-body mt-1">
                        {challenge.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    {challenge.targetKg && (
                      <span className="text-xs text-slate-500 font-mono">
                        Mål: {challenge.targetKg} kg
                      </span>
                    )}
                    {challenge.targetStreak && (
                      <span className="text-xs text-slate-500 font-mono">
                        Mål: {challenge.targetStreak} dager
                      </span>
                    )}
                    {completed && (
                      <span className="text-xs text-earth-400 font-medium">
                        Fullført! +25 eco-poeng
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {trophies.length > 0 && (
        <div className="bio-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={20} className="text-yellow-400" />
            <h2 className="font-display font-700 text-white text-lg">Troféer</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {trophies.map((trophy, index) => (
              <div key={index} className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                <Trophy size={24} className="mx-auto text-yellow-400 mb-2" />
                <p className="text-white text-sm font-body font-500">{trophy.name}</p>
                <p className="text-slate-500 text-xs">
                  {trophy.week ? new Date(trophy.week).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' }) : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}