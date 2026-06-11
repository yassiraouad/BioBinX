import { useState, useEffect } from 'react';
import { Edit2, Loader2, FileText, Save } from 'lucide-react';
import { getContentBlocks, updateContentBlock } from '../firebase/db';
import toast from 'react-hot-toast';

const DEFAULT_CONTENT = {
  login_welcome: { label: 'Velkomsttekst på innlogging', value: 'Velkommen til BioBin X! Logg inn for å registrere matavfall og bidra til et grønnere miljø.' },
  ecolevel_description: { label: 'Beskrivelse av EcoLevel', value: 'EcoLevel belønner din miljøinnsats! Tjen poeng og levle opp fra Bronse til BioBin Elite.' },
  faq: { label: 'FAQ', value: 'Spørsmål og svar om BioBin X. Hvordan logger jeg matavfall? Hvor mye poeng får jeg? Svar finner du her.' },
  footer_tagline: { label: 'Footer tagline', value: 'BioBin X - Sammen for et grønnere miljø' },
};

export default function ContentEditor({ userId }) {
  const [blocks, setBlocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const dbBlocks = await getContentBlocks();
      const merged = { ...DEFAULT_CONTENT };
      Object.keys(DEFAULT_CONTENT).forEach(key => {
        if (dbBlocks[key]) {
          merged[key] = { ...merged[key], ...dbBlocks[key] };
        }
      });
      setBlocks(merged);
    } catch (err) {
      console.error('Error loading content:', err);
      setBlocks(DEFAULT_CONTENT);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    
    setSaving(true);
    try {
      await updateContentBlock(editing, editValue, userId);
      setBlocks({ ...blocks, [editing]: { ...blocks[editing], value: editValue } });
      setEditing(null);
      toast.success('Innhold oppdatert!');
    } catch (err) {
      console.error('Error saving content:', err);
      toast.error('Klarte ikke lagre');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="text-bio-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(blocks).map(([key, block]) => (
        <div key={key} className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-bio-400" />
              <h3 className="text-white font-body font-500">{block.label}</h3>
            </div>
            <button
              onClick={() => { setEditing(key); setEditValue(block.value || ''); }}
              className="text-xs text-bio-400 hover:underline flex items-center gap-1"
            >
              <Edit2 size={12} /> Rediger
            </button>
          </div>
          
          {editing === key ? (
            <div className="mt-3 space-y-3">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="bio-input resize-none"
                rows={4}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setEditing(null)} className="text-sm text-slate-400 hover:text-white">
                  Avbryt
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1 text-sm py-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Lagre</>}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm font-body">{block.value || '(Innhold ikke satt)'}</p>
          )}
        </div>
      ))}
    </div>
  );
}