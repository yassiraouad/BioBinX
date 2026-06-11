import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useDemo } from '../../hooks/useDemo';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  TrendingUp, Leaf, Award, Target, Users, Trophy,
  Calendar, Zap, MessageSquare, Bell, ChevronRight,
  BarChart3, CheckCircle2, Circle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DemoTeacherDashboard() {
  const { isDemo, demoData, localState, addScan, addReaction } = useDemo();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('oversikt');
  const [selectedClass, setSelectedClass] = useState(demoData.classes[0]);

  useEffect(() => {
    if (!selectedClass && demoData.classes.length > 0) {
      setSelectedClass(demoData.classes[0]);
    }
  }, [demoData.classes, selectedClass]);

  useEffect(() => {
    if (!isDemo) {
      router.push('/auth/login');
    }
  }, [isDemo, router]);

  if (!isDemo) return null;

  const totalWeeklyWeight = demoData.classes.reduce((sum, cls) => sum + (cls.weeklyStats?.weight || 0), 0);

  const stats = [
    { label: 'Total vekt denne uken', value: `${totalWeeklyWeight.toFixed(1)} kg`, icon: TrendingUp, color: 'text-bio-400', bg: 'bg-bio-500/10' },
    { label: 'CO₂ spart', value: `${demoData.dashboard?.co2SavedKg ?? 0} kg`, icon: Leaf, color: 'text-moss-400', bg: 'bg-moss-500/10' },
    { label: 'Poeng totalt', value: demoData.dashboard?.ecoPoints ?? localState.points, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Aktive utfordringer', value: String(demoData.challenges.filter((challenge) => challenge.status !== 'completed').length), icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  const recentScans = (demoData.recentScans || []).slice(0, 4).map((scan) => {
    const diffMins = Math.max(1, Math.round((Date.now() - scan.timestamp) / (1000 * 60)));
    const timeLabel = diffMins < 60 ? `${diffMins} min siden` : `${Math.round(diffMins / 60)} t siden`;
    return {
      id: scan.id,
      class: scan.className,
      weight: scan.weight,
      time: timeLabel,
      user: scan.user,
    };
  });

  const tabs = [
    { id: 'oversikt', label: 'Oversikt' },
    { id: 'utfordringer', label: 'Utfordringer' },
    { id: 'klasseliga', label: 'Klasseliga' },
    { id: 'analyse', label: 'Analyse' },
  ];

  return (
    <Layout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display font-700 text-white text-2xl lg:text-3xl">
              God morgen, {demoData.demoUser.name}! 👋
            </h1>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Trophy size={14} className="text-amber-400" />
              <span className="text-amber-400 text-xs font-display font-600">{demoData.demoUser.ecoLevel}</span>
            </div>
          </div>
          <p className="text-slate-400 font-body">{demoData.school.name} • {demoData.demoUser.className}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bio-card p-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <div className="text-white font-display font-700 text-xl mb-1">{stat.value}</div>
              <div className="text-slate-500 text-xs font-body">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-body font-500 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-bio-500/15 text-bio-400 border border-bio-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'oversikt' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bio-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-600 text-white">Klasser</h2>
                <button className="text-bio-400 text-sm font-body hover:text-bio-300">Se alle</button>
              </div>
              <div className="space-y-3">
                {demoData.classes.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-bio-500/15 flex items-center justify-center">
                        <Users size={18} className="text-bio-400" />
                      </div>
                      <div>
                        <div className="text-white font-display font-600">{cls.name}</div>
                        <div className="text-slate-500 text-xs">{cls.students} elever</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-bio-400 font-display font-600">{cls.weeklyStats.weight}kg</div>
                      <div className="text-slate-500 text-xs">denne uken</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bio-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-600 text-white">Siste skann</h2>
              </div>
              <div className="space-y-3">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-moss-500/15 flex items-center justify-center">
                        <Leaf size={16} className="text-moss-400" />
                      </div>
                      <div>
                        <div className="text-white font-body text-sm">{scan.user} • {scan.class}</div>
                        <div className="text-slate-500 text-xs">{scan.time}</div>
                      </div>
                    </div>
                    <div className="text-moss-400 font-display font-600">{scan.weight}kg</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'utfordringer' && (
          <div className="space-y-4">
            {demoData.challenges.map((challenge) => (
              <div key={challenge.id} className="bio-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-display font-600 text-white">{challenge.title}</h3>
                      {challenge.status === 'completed' && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Fullført</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm font-body">{challenge.description}</p>
                  </div>
                  <Target size={24} className="text-purple-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Framgang</span>
                    <span className="text-white font-display font-600">{Math.round(challenge.progress * 100)}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        challenge.status === 'completed' ? 'bg-green-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${challenge.progress * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0kg</span>
                    <span>{challenge.targetWeight}kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'klasseliga' && (
          <div className="bio-card p-6">
            <h2 className="font-display font-600 text-white mb-6">Klasseligaen</h2>
            <div className="space-y-3">
              {demoData.classRanking.map((entry, index) => (
                <div key={entry.classId} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-700 text-sm ${
                      index === 0 ? 'bg-amber-500/20 text-amber-400' :
                      index === 1 ? 'bg-slate-400/20 text-slate-300' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {entry.rank}
                    </div>
                    <div>
                      <div className="text-white font-display font-600">{entry.className}</div>
                      <div className="text-slate-500 text-xs">Kurland skole</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-bio-400 font-display font-700 text-lg">{entry.score}</div>
                    <div className="text-slate-500 text-xs">ukescore</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analyse' && (
          <div className="space-y-6">
            <div className="bio-card p-6">
              <h2 className="font-display font-600 text-white mb-4">CO₂ Prognose</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-moss-400 text-2xl font-display font-700">{demoData.co2Prognose.nextMonth}kg</div>
                  <div className="text-slate-500 text-xs">Neste måned</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-bio-400 text-2xl font-display font-700">{demoData.co2Prognose.nextYear}kg</div>
                  <div className="text-slate-500 text-xs">Neste år</div>
                </div>
              </div>
              <div className="p-4 bg-moss-500/10 rounded-xl border border-moss-500/20">
                <p className="text-slate-300 text-sm font-body">{demoData.insight || demoData.co2Prognose.aiSummary}</p>
              </div>
            </div>

            <div className="bio-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-600 text-white">Bins status</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {demoData.bins.slice(0, 3).map((bin) => (
                  <div key={bin.id} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-white text-sm font-display font-600">{bin.name}</span>
                    </div>
                    <div className="text-slate-500 text-xs">
                      Sist tømt: {Math.floor((Date.now() - new Date(bin.lastEmptied).getTime()) / (1000 * 60 * 60 * 24))} dager siden
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
