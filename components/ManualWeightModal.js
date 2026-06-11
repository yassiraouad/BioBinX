import { useState } from 'react';
import { Scale, X, Loader2 } from 'lucide-react';
import { manualWeightEntry } from '../firebase/db';
import toast from 'react-hot-toast';

export default function ManualWeightModal({ isOpen, onClose, userId, classId, bins = [], onSuccess }) {
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [selectedBin, setSelectedBin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!weight || parseFloat(weight) <= 0) {
      toast.error('Skriv inn en gyldig vekt');
      return;
    }

    setSubmitting(true);
    try {
      await manualWeightEntry({
        userId,
        binId: selectedBin || null,
        classId,
        weight,
        note,
      });
      toast.success('Vekt registrert! ✅');
      onSuccess?.();
      onClose();
      setWeight('');
      setNote('');
      setSelectedBin('');
    } catch (err) {
      console.error('Error registering weight:', err);
      toast.error('Klarte ikke registrere vekt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bio-card p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-700 text-white text-xl">Registrer vekt manuelt</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm font-body block mb-2">Vekt (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="F.eks. 1.5"
              className="bio-input text-lg"
              autoFocus
            />
          </div>

          {bins.length > 0 && (
            <div>
              <label className="text-slate-300 text-sm font-body block mb-2">Velg bøtte (valgfritt)</label>
              <select
                value={selectedBin}
                onChange={(e) => setSelectedBin(e.target.value)}
                className="bio-input"
              >
                <option value="">Ingen bøtte</option>
                {bins.map((bin) => (
                  <option key={bin.id} value={bin.id}>{bin.binId}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-slate-300 text-sm font-body block mb-2">Notat (valgfritt)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="F.eks. Rest från middag"
              className="bio-input resize-none"
              rows={2}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !weight}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Scale size={18} />
                Registrer vekt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}