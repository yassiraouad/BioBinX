import { useState, useRef, useEffect } from 'react';
import { X, Camera, Bluetooth, Loader2, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { addBin, getTeacherClasses } from '../firebase/db';
import { useAuth } from '../hooks/useAuth';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export default function AddBinModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [scanMethod, setScanMethod] = useState('qr');
  const [scanning, setScanning] = useState(false);
  const [scannedId, setScannedId] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [btScanning, setBtScanning] = useState(false);
  const [btDevices, setBtDevices] = useState([]);
  const [btError, setBtError] = useState('');
  const prefersReducedMotion = useReducedMotion();
  
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadClasses();
      setScannedId('');
      setError('');
      setBtDevices([]);
      setBtError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && scanMethod === 'qr' && scannedId) {
      startQrScanner();
    }
    return () => {
      stopQrScanner();
    };
  }, [isOpen, scanMethod, scannedId]);

  const loadClasses = async () => {
    try {
      const teacherClasses = await getTeacherClasses();
      setClasses(teacherClasses || []);
      if (teacherClasses && teacherClasses.length > 0) {
        setSelectedClass(teacherClasses[0].id);
      }
    } catch (err) {
      console.error('Error loading classes:', err);
      setError('Klarte ikke laste klasser');
    }
  };

  const parseQrCode = (data) => {
    const trimmed = data.trim();
    if (trimmed.startsWith('BIOBIN-') || /^[A-Z]{2,}-\d{4}-\d{3,}$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  };

  const startQrScanner = async () => {
    if (!scannedId) {
      setScanning(true);
      setError('');
      try {
        if (!html5QrcodeRef.current) {
          html5QrcodeRef.current = new Html5Qrcode('qr-reader');
        }
        await html5QrcodeRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            const binId = parseQrCode(decodedText);
            if (binId) {
              setScannedId(binId);
              stopQrScanner();
            } else {
              setError('Ugyldig QR-kode, prøv igjen');
            }
          },
          () => {}
        );
      } catch (err) {
        console.error('QR scanner error:', err);
        if (err.toString().includes('Permission')) {
          setError('Kameratillatelse nektet. Vennligst gi tilgang i nettleserinnstillinger.');
        } else {
          setError('Klarte ikke starte kamera');
        }
        setScanning(false);
      }
    }
  };

  const stopQrScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (e) {}
    }
    setScanning(false);
  };

  const resetScanner = () => {
    setScannedId('');
    setError('');
    setBtDevices([]);
  };

  const startBtScan = async () => {
    if (!navigator.bluetooth) {
      setBtError('Bluetooth er ikke støttet av denne nettleseren. Prøv Chrome eller Edge.');
      return;
    }

    setBtScanning(true);
    setBtError('');
    setBtDevices([]);

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
      });
      
      const deviceInfo = {
        id: device.id,
        name: device.name || 'Ukjent enhet',
        rssi: null,
      };
      
      setBtDevices([deviceInfo]);
      setScannedId(device.name || device.id);
      setBtScanning(false);
    } catch (err) {
      console.error('Bluetooth error:', err);
      if (err.toString().includes('Permission')) {
        setBtError('Bluetooth-tillatelse nektet. Vennligst gi tilgang i nettleserinnstillinger.');
      } else {
        setBtError('Klarte ikke søke etter Bluetooth-enheter');
      }
      setBtScanning(false);
    }
  };

  const selectBtDevice = (device) => {
    const binId = device.name || `BT-${device.id.substring(0, 8)}`;
    setScannedId(binId);
    setBtDevices([]);
  };

  const handleSubmit = async () => {
    if (!scannedId) return;
    if (!selectedClass) {
      setError('Velg en klasse');
      return;
    }

    const selectedClassData = classes.find(c => c.id === selectedClass);
    if (!selectedClassData) {
      setError('Klarte ikke finne valgt klasse');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addBin({
        binId: scannedId,
        classId: selectedClass,
        className: selectedClassData.name,
        teacherId: user.uid,
      });
      toast.success('Bøtte lagt til!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error adding bin:', err);
      if (err.message === 'BIN_ALREADY_EXISTS') {
        setError('Denne bøtten er allerede registrert');
      } else {
        setError('Klarte ikke legge til bøtte. Prøv igjen.');
      }
    } finally {
      setSubmitting(false);
    }
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
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.99 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="bio-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-700 text-white text-xl">Legg til bøtte</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {!scannedId ? (
          <>
            <div className="flex gap-2 mb-6">
              <motion.button
                onClick={() => { setScanMethod('qr'); resetScanner(); }}
                className={`flex-1 py-3 px-4 rounded-xl font-body font-500 flex items-center justify-center gap-2 transition-all ${
                  scanMethod === 'qr'
                    ? 'bg-bio-500/15 border border-bio-500/30 text-bio-400'
                    : 'bg-white/4 border border-white/8 text-slate-400 hover:text-white'
                }`}
                whileTap={prefersReducedMotion ? {} : { scale: 0.99 }}
              >
                <Camera size={18} />
                QR-kode
              </motion.button>
              <motion.button
                onClick={() => { setScanMethod('bt'); resetScanner(); }}
                className={`flex-1 py-3 px-4 rounded-xl font-body font-500 flex items-center justify-center gap-2 transition-all ${
                  scanMethod === 'bt'
                    ? 'bg-bio-500/15 border border-bio-500/30 text-bio-400'
                    : 'bg-white/4 border border-white/8 text-slate-400 hover:text-white'
                }`}
                whileTap={prefersReducedMotion ? {} : { scale: 0.99 }}
              >
                <Bluetooth size={18} />
                Bluetooth
              </motion.button>
            </div>

            {scanMethod === 'qr' && (
              <div className="mb-6">
                {scanning ? (
                  <div className="relative aspect-square bg-dark-800 rounded-2xl border border-bio-border overflow-hidden">
                    <div id="qr-reader" className="w-full h-full" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-bio-400/50 rounded-2xl animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-dark-800 rounded-2xl border border-bio-border flex flex-col items-center justify-center p-6 text-center">
                    <Camera size={48} className="text-slate-600 mb-4" />
                    <p className="text-slate-400 font-body mb-4">Skann QR-koden på bøtten</p>
                    <button onClick={startQrScanner} className="btn-primary">
                      Start kamera
                    </button>
                  </div>
                )}
              </div>
            )}

            {scanMethod === 'bt' && (
              <div className="mb-6">
                {btScanning ? (
                  <div className="aspect-square bg-dark-800 rounded-2xl border border-bio-border flex flex-col items-center justify-center p-6">
                    <Loader2 size={48} className="text-bio-400 animate-spin mb-4" />
                    <p className="text-slate-400 font-body">Søker etter enheter...</p>
                  </div>
                ) : btDevices.length > 0 ? (
                  <div className="bg-dark-800 rounded-2xl border border-bio-border divide-y divide-white/5">
                    {btDevices.map((device) => (
                      <button
                        key={device.id}
                        onClick={() => selectBtDevice(device)}
                        className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                      >
                        <Bluetooth size={20} className="text-bio-400" />
                        <div className="flex-1">
                          <div className="text-white font-body font-500">{device.name}</div>
                          <div className="text-slate-500 text-xs">{device.id.substring(0, 20)}...</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-square bg-dark-800 rounded-2xl border border-bio-border flex flex-col items-center justify-center p-6 text-center">
                    <Bluetooth size={48} className="text-slate-600 mb-4" />
                    <p className="text-slate-400 font-body mb-4">Søk etter bøtter via Bluetooth</p>
                    <button onClick={startBtScan} className="btn-primary">
                      Start Bluetooth-søk
                    </button>
                  </div>
                )}
              </div>
            )}

            {(error || btError) && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm font-body">{error || btError}</p>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          >
            <div className="p-4 rounded-xl bg-bio-500/10 border border-bio-500/20 flex items-center gap-3 mb-6">
              <CheckCircle size={20} className="text-bio-400 flex-shrink-0" />
              <div>
                <p className="text-bio-300 font-body font-500">Bøtte funnet!</p>
                <p className="text-slate-400 text-sm font-mono">{scannedId}</p>
              </div>
            </div>

            {classes.length === 0 ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm font-body">Du har ingen klasser tilknyttet kontoen din</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-slate-300 text-sm font-body font-500 block mb-2">
                    Tilknyttet klasse
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="bio-input"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                        {cls.schoolName && ` - ${cls.schoolName}`}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm font-body">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedClass}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Legg til bøtte
                    </>
                  )}
                </button>

                <button
                  onClick={resetScanner}
                  className="w-full py-3 text-slate-400 hover:text-white font-body text-sm transition-colors"
                >
                  Scan på nytt
                </button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
