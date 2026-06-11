// pages/scan.js
import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Camera,
  Check,
  RefreshCcw,
  Scale,
  Sparkles,
  Upload,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';
import Layout from '../components/layout/Layout';
import { logWaste } from '../firebase/db';
import { classifyWasteFromDataUrl, loadModel } from '../utils/wasteClassifier';
import { LoadingScreen, Page, PageHeader, SectionCard, TonePill } from '../components/ui/AppPrimitives';

export default function ScanPage() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const { isDemo, demoUser, addScan } = useDemo();
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const modelRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setShowManualInput(false);
      }
    } catch (err) {
      toast.error('Kamera ikke tilgjengelig. Du kan fortsatt registrere manuelt.');
      setShowManualInput(true);
      setCameraActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user && !isDemo) {
      router.push('/auth/login');
    }
  }, [user, loading, isDemo, router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (loading || !user) && !isDemo) return;

    loadModel()
      .then((model) => {
        modelRef.current = model;
        setModelLoaded(true);
        startCamera();
      })
      .catch((err) => {
        console.error('Failed to load model:', err);
        setModelLoaded(true);
        setShowManualInput(true);
      });

    return () => {
      stopCamera();
      if (modelRef.current && typeof modelRef.current.dispose === 'function') {
        modelRef.current.dispose();
        modelRef.current = null;
      }
    };
  }, [loading, user, isDemo, startCamera, stopCamera]);

  useEffect(() => {
    if (cameraActive) {
      stopCamera();
      startCamera();
    }
  }, [facingMode, cameraActive, startCamera, stopCamera]);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    setAiError(false);
    stopCamera();

    setAnalyzing(true);
    try {
      const analysis = await classifyWasteFromDataUrl(imageData);
      setAiAnalysis(analysis);
    } catch (err) {
      console.error('AI analysis failed:', err);
      setAiAnalysis({ isOrganic: true, confidence: 0, label: 'Kunne ikke analysere' });
      setAiError(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setResult(null);
    setWeight('');
    setAiAnalysis(null);
    setAiError(false);
    startCamera();
  };

  const handleSave = async () => {
    const weightNum = parseFloat(weight);
    if (!weight || Number.isNaN(weightNum) || weightNum <= 0) {
      return toast.error('Skriv inn en gyldig vekt storre enn 0');
    }
    if (weightNum > 100) {
      return toast.error('Vekten kan ikke vaere over 100 kg');
    }
    if (!user && !isDemo) return;

    if (capturedImage && aiAnalysis && !aiAnalysis.isOrganic && !aiError) {
      toast.error('Dette ser ut til a vaere ikke-organisk avfall. BioBin godtar kun matavfall.');
      return;
    }

    setSaving(true);
    try {
      if (isDemo) {
        const points = Math.round(weightNum * 10);
        const energy = weightNum * 0.5;
        const co2 = weightNum * 0.8;

        addScan(weightNum, { user: demoUser?.name?.split(' ')[0], className: demoUser?.className });

        setResult({
          points,
          energyKwh: energy,
          co2Saved: co2,
          totalWaste: weightNum,
        });
      } else {
        const data = await logWaste({
          userId: user.uid,
          weight: weightNum,
          imageUrl: null,
          classId: userData?.classId || null,
          aiClassification: capturedImage ? aiAnalysis : null,
        });
        setResult(data);
        await refreshUserData();
      }
    } catch (err) {
      toast.error('Klarte ikke lagre. Prov igjen.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || (!user && !isDemo)) {
    return (
      <Layout>
        <LoadingScreen title="Forbereder registrering" description="Starter kamera, modell og lagringsflyt." />
      </Layout>
    );
  }

  if (result) {
    return (
      <Layout>
        <Page width="max-w-3xl" className="space-y-6">
          <motion.div
            className="bio-card p-8 text-center"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-bio-500/18 bg-bio-500/12">
              <Check size={34} className="text-bio-100" />
            </div>
            <h2 className="text-3xl font-700 tracking-[-0.04em] text-white">Registrering lagret</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">Kastet er registrert og poengene er lagt til. Resultatet teller mot personlig progresjon og, dersom du er i klasse, videre opp mot ukesmalet.</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Poeng', value: `+${result.points}`, icon: Zap },
                { label: 'Energi', value: `${result.energyKwh.toFixed(2)} kWh`, icon: Sparkles },
                { label: 'CO2 spart', value: `${result.co2Saved.toFixed(2)} kg`, icon: Wind },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <Icon size={18} className="mx-auto mb-2 text-bio-100" />
                  <div className="text-lg font-700 text-white">{value}</div>
                  <div className="mt-1 text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button onClick={retake} className="btn-secondary px-5 py-3"><Camera size={16} /> Registrer nytt kast</button>
              <button
                onClick={() => router.push(isDemo ? (demoUser?.role === 'teacher' ? '/dashboard/demo-teacher' : '/dashboard/demo-student') : '/dashboard/student')}
                className="btn-primary px-5 py-3"
              >
                Tilbake til oversikt
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </Page>
      </Layout>
    );
  }

  const canSave = Boolean(weight) && !(capturedImage && aiAnalysis && !aiAnalysis.isOrganic && !aiError);

  return (
    <Layout>
      <Page className="space-y-6" width="max-w-6xl">
        <PageHeader
          eyebrow="Registrer kast"
          title="Lag en registrering som faktisk kan brukes"
          description="Bildet hjelper med kvalitetssikring. Vekten er det som til slutt driver poeng, historikk og klasseoppfolging. Hvis kamera ikke er tilgjengelig, kan du fortsatt lagre manuelt."
          meta={[
            modelLoaded ? 'AI klar' : 'Laster AI-modell',
            showManualInput ? 'Manuell fallback aktiv' : 'Kameraflyt aktiv',
          ]}
          actions={modelLoaded ? <TonePill tone="brand"><Brain size={14} /> AI klar</TonePill> : <TonePill>Laster modell</TonePill>}
        />

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <SectionCard title="1. Fang eller last opp situasjonen" description="Ta bilde ved botten for best kvalitet. Hvis kameraet ikke fungerer, kan du bruke manuell registrering.">
            <div className="space-y-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-white/8 bg-dark-800">
                {!capturedImage && !showManualInput ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="h-52 w-52 rounded-[28px] border-2 border-bio-400/45" />
                    </div>
                    <button
                      onClick={() => setFacingMode((current) => (current === 'environment' ? 'user' : 'environment'))}
                      className="absolute right-3 top-3 rounded-2xl border border-white/10 bg-black/35 p-3 text-white transition-all hover:bg-black/55"
                    >
                      <RefreshCcw size={16} />
                    </button>
                  </>
                ) : capturedImage ? (
                  <>
                    <img src={capturedImage} alt="Captured" className="h-full w-full object-cover" />
                    {aiAnalysis && !aiAnalysis.isOrganic && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/80">
                          <X size={42} className="text-white" />
                        </div>
                      </div>
                    )}
                    <button onClick={retake} className="absolute right-3 top-3 rounded-2xl border border-white/10 bg-black/35 p-3 text-white transition-all hover:bg-black/55">
                      <RefreshCcw size={16} />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-bio-100">
                      <Upload size={26} />
                    </div>
                    <div className="text-lg font-700 text-white">Manuell registrering er aktiv</div>
                    <p className="mt-2 max-w-sm text-sm leading-7 text-slate-400">Kamera eller modell er ikke tilgjengelig akkurat na. Du kan fortsatt registrere vekt og lagre kastet, sa aktiviteten ikke gar tapt.</p>
                    <button onClick={startCamera} className="btn-secondary mt-5 px-5 py-3">Prov kamera igjen</button>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {!capturedImage && !showManualInput && (
                <div className="flex flex-col items-center gap-3">
                  <motion.button
                    onClick={capturePhoto}
                    disabled={!modelLoaded}
                    className={`flex h-16 w-16 items-center justify-center rounded-full border border-bio-500/20 bg-bio-500/12 text-bio-100 ${!modelLoaded ? 'cursor-not-allowed opacity-50' : ''}`}
                    whileTap={prefersReducedMotion ? {} : { scale: 0.94 }}
                  >
                    <Camera size={26} />
                  </motion.button>
                  {!modelLoaded ? <p className="text-xs text-slate-500">Venter pa at AI-modellen skal bli klar</p> : null}
                </div>
              )}
            </div>
          </SectionCard>

          <div className="space-y-4">
            <SectionCard title="2. Kvalitetssjekk" description="AI brukes som et stottelag, ikke som pynt. Ved usikkerhet kan du fortsatt fullfore manuelt.">
              <AnimatePresence mode="wait">
                {capturedImage && analyzing ? (
                  <motion.div
                    key="analyzing"
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                    className="rounded-[24px] border border-bio-500/15 bg-bio-500/12 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-bio-500/15 bg-bio-500/12">
                        <Brain size={20} className="animate-pulse text-bio-100" />
                      </div>
                      <div>
                        <p className="text-sm font-600 text-white">AI analyserer bildet</p>
                        <p className="text-xs text-slate-500">Ser etter om dette ligner organisk matavfall.</p>
                      </div>
                    </div>
                  </motion.div>
                ) : capturedImage && aiAnalysis ? (
                  aiAnalysis.isOrganic ? (
                    <motion.div key="organic" initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }} animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }} exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }} className="rounded-[24px] border border-bio-500/15 bg-bio-500/12 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-bio-500/15 bg-bio-500/12">
                          <Sparkles size={20} className="text-bio-100" />
                        </div>
                        <div>
                          <p className="text-sm font-600 text-white">Ser ut som organisk matavfall</p>
                          <p className="text-xs text-slate-500">{aiAnalysis.label} {aiAnalysis.confidence ? `· ${(aiAnalysis.confidence * 100).toFixed(0)}% sikkerhet` : ''}</p>
                        </div>
                      </div>
                      {aiError ? <p className="mt-3 text-xs text-slate-400">Modellen er usikker, sa du kan fullfore manuelt likevel.</p> : null}
                    </motion.div>
                  ) : (
                    <motion.div key="non-organic" initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }} animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }} exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }} className="rounded-[24px] border border-red-500/18 bg-red-500/10 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/18 bg-red-500/12">
                          <AlertTriangle size={20} className="text-red-300" />
                        </div>
                        <div>
                          <p className="text-sm font-600 text-red-100">Dette ligner ikke matavfall</p>
                          <p className="text-xs text-red-100/70">{aiAnalysis.label} · {(aiAnalysis.confidence * 100).toFixed(0)}% sikkerhet</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-red-100/80">Ta et nytt bilde dersom dette faktisk er matavfall. Systemet blokkerer lagring nar analysen virker tydelig negativ.</p>
                    </motion.div>
                  )
                ) : (
                  <div className="rounded-[24px] border border-white/8 bg-white/4 p-4 text-sm leading-7 text-slate-400">
                    Ta bilde for a fa en rask kvalitetssjekk. Hvis kamera eller analyse ikke er tilgjengelig, kan du fortsette med manuell registrering.
                  </div>
                )}
              </AnimatePresence>
            </SectionCard>

            <SectionCard title="3. Vekt og lagring" description="Det er vekten som blir lagret i historikken og brukt videre i poeng, klasseoversikt og estimater.">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-500 text-slate-300">Vekt (kg)</label>
                  <div className="relative">
                    <Scale size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="number" step="0.1" min="0.1" max="50" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="F.eks. 0.8" className="bio-input pl-11" />
                  </div>
                  {weight && parseFloat(weight) > 0 ? (
                    <div className="mt-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-xs text-slate-300">
                      Omtrentlig resultat: +{Math.round(parseFloat(weight) * 10)} poeng · {(parseFloat(weight) * 0.5).toFixed(2)} kWh · {(parseFloat(weight) * 0.8).toFixed(2)} kg CO2 spart
                    </div>
                  ) : null}
                </div>

                <button onClick={handleSave} disabled={saving || !canSave} className={`btn-primary w-full py-4 ${!canSave ? 'opacity-60' : ''}`}>
                  {saving ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Check size={18} /> Lagre registrering</>}
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Tips" description="Små detaljer som gjor registreringene mer troverdige over tid.">
              <div className="space-y-3 text-sm leading-7 text-slate-300">
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">Bruk helst kjokkenvekt eller kjent beholder for a unnga store utslag i vekten.</div>
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">Hvis AI er usikker, er det fortsatt bedre a lagre en korrekt manuell vekt enn a hoppe over registreringen.</div>
              </div>
            </SectionCard>
          </div>
        </div>
      </Page>
    </Layout>
  );
}
