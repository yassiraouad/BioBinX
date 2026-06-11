import { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { requestNotificationPermission } from '../../firebase/messaging';

export default function NotificationToggle({ classId, onEnabled }) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (Notification.permission === 'granted') {
        toast.success('Varsler er aktivert!');
        setEnabled(true);
        if (onEnabled) onEnabled(true);
      } else if (Notification.permission === 'denied') {
        toast.error('Varsler er blokkert. Skru på i nettleserinnstillinger.');
      } else {
        const token = await requestNotificationPermission();
        if (token) {
          toast.success('Varsler er aktivert!');
          setEnabled(true);
          if (onEnabled) onEnabled(true);
        } else {
          toast.error('Kunne ikke aktivere varsler');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Kunne ikke aktivere varsler');
    } finally {
      setLoading(false);
    }
  };

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-body transition-all ${
        enabled
          ? 'bg-bio-500/15 text-bio-400 border border-bio-500/30'
          : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white hover:border-white/20'
      }`}
      title={enabled ? 'Varsler er på' : 'Slå på varsler'}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : enabled ? (
        <Bell size={16} />
      ) : (
        <BellOff size={16} />
      )}
      <span>{enabled ? 'Varsler på' : 'Slå på varsler'}</span>
    </button>
  );
}
