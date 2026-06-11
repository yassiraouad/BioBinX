import { useState, useEffect } from 'react';
import { Sparkles, Snowflake, Sun, Leaf, X, Clock } from 'lucide-react';

const campaigns = {
  verdensMiljodag: {
    id: 'verdensMiljodag',
    title: 'Verdens Miljødag! 🎉',
    subtitle: '5. juni - Dobbel poeng i dag!',
    icon: Globe,
    color: 'from-green-400 to-emerald-600',
    bgPattern: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    isActive: (date) => date.getMonth() === 5 && date.getDate() === 5,
  },
  skolestart: {
    id: 'skolestart',
    title: 'Skolestart 2024! 📚',
    subtitle: 'August - Start sesongen sterkt!',
    icon: Sun,
    color: 'from-amber-400 to-orange-500',
    bgPattern: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    isActive: (date) => date.getMonth() === 7,
  },
  halloween: {
    id: 'halloween',
    title: 'Spooky Halloween 🎃',
    subtitle: 'Oktober - Spøkelseffekt på poeng!',
    icon: Moon,
    color: 'from-purple-400 to-indigo-600',
    bgPattern: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    isActive: (date) => date.getMonth() === 9,
  },
  jul: {
    id: 'jul',
    title: 'Grønn Jul 🎄',
    subtitle: 'Desember - Juleutfordring!',
    icon: Snowflake,
    color: 'from-red-400 to-green-500',
    bgPattern: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    isActive: (date) => date.getMonth() === 11,
  },
  vinter: {
    id: 'vinter',
    title: 'Vinterutfordring ❄️',
    subtitle: 'Januar-Februar - Bli med!',
    icon: Snowflake,
    color: 'from-blue-400 to-cyan-500',
    bgPattern: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    isActive: (date) => date.getMonth() === 0 || date.getMonth() === 1,
  },
  vår: {
    id: 'vår',
    title: 'Vårflor 🌸',
    subtitle: 'Mars-Mai - Vekst og poeng!',
    icon: Leaf,
    color: 'from-pink-400 to-rose-500',
    bgPattern: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    isActive: (date) => date.getMonth() >= 2 && date.getMonth() <= 4,
  },
};

function Globe({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function Moon({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function SeasonalCampaignBanner({ onDismiss }) {
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const now = new Date();
    const active = Object.values(campaigns).find(c => c.isActive(now));
    setActiveCampaign(active || null);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    onDismiss?.();
  };

  if (!activeCampaign || dismissed || !showBanner) return null;

  const Icon = activeCampaign.icon;

  return (
    <div className={`mb-4 p-4 rounded-xl border ${activeCampaign.bgPattern} ${activeCampaign.borderColor} animate-slide-up`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${activeCampaign.color} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-600 text-white text-sm">{activeCampaign.title}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bio-500/20 text-bio-400 text-xs">
              <Sparkles size={10} />
              Aktiv
            </span>
          </div>
          <p className="text-slate-400 text-xs">{activeCampaign.subtitle}</p>
        </div>
        <button onClick={handleDismiss} className="text-slate-500 hover:text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function CampaignBadge({ size = 'sm' }) {
  const [activeCampaign, setActiveCampaign] = useState(null);

  useEffect(() => {
    const now = new Date();
    const active = Object.values(campaigns).find(c => c.isActive(now));
    setActiveCampaign(active || null);
  }, []);

  if (!activeCampaign) return null;

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${activeCampaign.color} text-white font-display font-500 ${sizes[size]}`}>
      <Sparkles size={size === 'sm' ? 10 : 14} />
      {activeCampaign.title.split(' ')[0]}
    </span>
  );
}