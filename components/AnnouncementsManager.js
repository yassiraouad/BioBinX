import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Loader2, Bell, Calendar } from 'lucide-react';
import { createAnnouncement, getAnnouncementsByClass, updateAnnouncement, deleteAnnouncement } from '../firebase/db';
import toast from 'react-hot-toast';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export default function AnnouncementsManager({ isOpen, onClose, classId, teacherId, className }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ title: '', body: '', scheduledAt: '' });
  const [saving, setSaving] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen && classId) {
      loadAnnouncements();
    }
  }, [isOpen, classId]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await getAnnouncementsByClass(classId);
      setAnnouncements(data);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error('Fyll ut tittel og melding');
      return;
    }

    setSaving(true);
    try {
      const scheduledAt = formData.scheduledAt ? new Date(formData.scheduledAt) : null;
      
      if (editing) {
        await updateAnnouncement(editing.id, {
          title: formData.title,
          body: formData.body,
          scheduledAt: scheduledAt?.toISOString() || null,
          status: scheduledAt ? 'scheduled' : 'published',
        });
        toast.success('Kunngjøring oppdatert!');
      } else {
        await createAnnouncement({
          classId,
          authorUid: teacherId,
          authorName: '',
          title: formData.title,
          body: formData.body,
          scheduledAt,
        });
        toast.success('Kunngjøring publisert!');
      }
      
      setFormData({ title: '', body: '', scheduledAt: '' });
      setShowForm(false);
      setEditing(null);
      loadAnnouncements();
    } catch (err) {
      console.error('Error saving announcement:', err);
      toast.error('Klarte ikke lagre');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (announcement) => {
    setEditing(announcement);
    setFormData({
      title: announcement.title,
      body: announcement.body,
      scheduledAt: announcement.scheduledAt ? announcement.scheduledAt.substring(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Er du sikker på at du vil slette denne kunngjøringen?')) return;
    
    try {
      await deleteAnnouncement(id);
      toast.success('Kunngjøring slettet');
      loadAnnouncements();
    } catch (err) {
      toast.error('Klarte ikke slette');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      published: 'bg-bio-500/20 text-bio-400',
      scheduled: 'bg-yellow-500/20 text-yellow-400',
      draft: 'bg-slate-500/20 text-slate-400',
    };
    const labels = { published: 'Publisert', scheduled: 'Planlagt', draft: 'Utkast' };
    return <span className={`text-xs px-2 py-1 rounded-full ${styles[status]}`}>{labels[status]}</span>;
  };

  return (
    <AnimatePresence>
      {isOpen && (
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1 }}
        exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.98 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.99 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="bio-card w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-display font-700 text-white text-xl">Kunngjøringer - {className}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {!showForm ? (
          <>
            <div className="p-4 border-b border-white/10">
              <button
                onClick={() => { setShowForm(true); setEditing(null); setFormData({ title: '', body: '', scheduledAt: '' }); }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={16} /> Ny kunngjøring
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="text-bio-400 animate-spin" />
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Ingen kunngjøringer ennå</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann) => (
                    <motion.div
                      key={ann.id}
                      layout
                      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-body font-500">{ann.title}</h3>
                          <p className="text-slate-500 text-xs">
                            {ann.authorName} • {ann.createdAt?.toDate ? ann.createdAt.toDate().toLocaleDateString('no-NO') : ''}
                          </p>
                        </div>
                        {getStatusBadge(ann.status)}
                      </div>
                      <p className="text-slate-300 text-sm font-body mb-3">{ann.body}</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(ann)} className="text-xs text-bio-400 hover:underline">Rediger</button>
                        <button onClick={() => handleDelete(ann.id)} className="text-xs text-red-400 hover:underline">Slett</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-4 space-y-4">
            <div>
              <label className="text-slate-300 text-sm font-body block mb-2">Tittel</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="F.eks. Viktig info om..."
                className="bio-input"
              />
            </div>
            
            <div>
              <label className="text-slate-300 text-sm font-body block mb-2">Melding</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Skriv kunngjøringen..."
                className="bio-input resize-none"
                rows={4}
              />
            </div>
            
            <div>
              <label className="text-slate-300 text-sm font-body block mb-2 flex items-center gap-2">
                <Calendar size={14} />
                Planlegg (valgfritt)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="bio-input"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white">
                Avbryt
              </button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <><Bell size={16} /> {editing ? 'Oppdater' : 'Publiser'}</>}
              </button>
            </div>
          </div>
        )}
      </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
