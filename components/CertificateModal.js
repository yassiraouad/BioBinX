import { X, Download, Award, Leaf, TreePine, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';

export default function CertificateModal({ isOpen, onClose, stats }) {
  const { userData } = useAuth();
  const { isDemo } = useDemo();

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();

  const defaultStats = {
    totalScans: 520,
    totalWeight: 156.8,
    co2Saved: 94.2,
    rank: 3,
    ecoLevel: 'BioBin Master',
  };

  const s = stats || defaultStats;

  const handlePrint = () => {
    if (isDemo) {
      return;
    }
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bio-card p-6 w-full max-w-md animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award size={20} className="text-amber-400" />
              <h2 className="font-display font-700 text-white text-xl">Års sertifikat</h2>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="text-center mb-6">
            <p className="text-slate-400 font-body text-sm mb-4">
              Gratulerer {userData?.name || 'elev'}! Du har bidratt til å redde miljøet i år.
            </p>
            {isDemo ? (
              <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
                Ikke tilgjengelig i demo-modus
              </div>
            ) : (
              <button onClick={handlePrint} className="btn-primary flex items-center gap-2 mx-auto">
                <Download size={16} />
                Last ned som PDF
              </button>
            )}
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Totalt matavfall spart:</span>
              <span className="text-white font-display font-600">{s.totalWeight.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">CO₂ besparelse:</span>
              <span className="text-moss-400 font-display font-600">{s.co2Saved.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Antall skann:</span>
              <span className="text-bio-400 font-display font-600">{s.totalScans}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .certificate-print, .certificate-print * {
            visibility: visible;
          }
          .certificate-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
          }
        }
      `}</style>

      <div className="certificate-print hidden print:block p-8 bg-white">
        <div className="max-w-2xl mx-auto border-4 border-green-600 rounded-lg p-8 text-center bg-gradient-to-b from-green-50 to-white">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
              <Leaf size={32} className="text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-green-800 mb-2">Miljøsertifikat</h1>
          <p className="text-gray-600 mb-6">BioBin X - År {currentYear}</p>

          <p className="text-xl text-gray-700 mb-2">Dette sertifiserer at</p>
          <h2 className="text-2xl font-bold text-green-700 mb-4">{userData?.name || 'Eleven'}</h2>

          <p className="text-gray-600 mb-6">
            har bidratt til å redde {s.totalWeight.toFixed(1)} kg matavfall og spart {s.co2Saved.toFixed(1)} kg CO₂ i løpet av {currentYear}.
          </p>

          <div className="flex justify-center gap-8 my-8">
            <div className="text-center">
              <TreePine size={32} className="mx-auto text-green-600 mb-2" />
              <span className="text-sm text-gray-600">Miljøhjelper</span>
            </div>
            <div className="text-center">
              <Globe size={32} className="mx-auto text-green-600 mb-2" />
              <span className="text-sm text-gray-600">Klimaverner</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-8">Utstedt av BioBin X - {currentYear}</p>
        </div>
      </div>
    </>
  );
}