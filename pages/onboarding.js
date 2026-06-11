import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { ArrowRight, GraduationCap, School, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db, doc, getDoc, setDoc, updateDoc } from '../lib/firebase';
import { createClass, getAllSchools, getClassByCode, setClassWeeklyGoalKg } from '../firebase/db';
import StudentOnboardingFlow from '../components/onboarding/StudentOnboardingFlow';
import TeacherOnboardingFlow from '../components/onboarding/TeacherOnboardingFlow';
import AdminOnboardingFlow from '../components/onboarding/AdminOnboardingFlow';
import BrandLogo from '../components/ui/BrandLogo';
import { TonePill } from '../components/ui/AppPrimitives';

const DEMO_STORAGE_KEY = 'biobin:onboarding:v2';

function getDashboardByRole(role) {
  if (role === 'teacher') return '/teacher/action-center';
  if (role === 'admin' || role === 'municipality') return '/dashboard/admin';
  return '/dashboard/student';
}

function getDemoDashboardByRole(role) {
  if (role === 'student') return '/dashboard/demo-student';
  return '/dashboard/demo-teacher';
}

function loadDemoState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function saveDemoState(payload) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(payload));
}

export default function OnboardingPage() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState('');
  const [progressStep, setProgressStep] = useState(1);
  const [progressTotal, setProgressTotal] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [schools, setSchools] = useState([]);

  const progress = useMemo(() => Math.min(100, Math.max(0, Math.round((progressStep / progressTotal) * 100))), [progressStep, progressTotal]);

  useEffect(() => {
    if (loading) return;

    const demoState = loadDemoState();
    if (!user && demoState?.onboardingComplete) {
      router.replace(getDemoDashboardByRole(demoState.role || 'student'));
      return;
    }

    if (user && userData?.onboardingComplete) {
      router.replace(getDashboardByRole(userData.role));
    }
  }, [loading, user, userData, router]);

  useEffect(() => {
    async function fetchSchools() {
      try {
        const data = await getAllSchools();
        setSchools(data || []);
      } catch (_) {
        setSchools([]);
      }
    }
    fetchSchools();
  }, []);

  const handleProgress = (step, total) => {
    setProgressStep(step);
    setProgressTotal(total);
  };

  const handleComplete = async (payload) => {
    setSaving(true);
    setError('');

    try {
      if (!user) {
        saveDemoState({
          ...payload,
          onboardingComplete: true,
          completedAt: new Date().toISOString(),
        });
        toast.success('Demo-onboarding fullfort');
        router.push(getDemoDashboardByRole(payload.role));
        return;
      }

      if (payload.role === 'student') {
        const cls = await getClassByCode(payload.classCode);
        if (!cls) throw new Error('Ugyldig klassekode.');

        await updateDoc(doc(db, 'users', user.uid), {
          role: 'student',
          classId: cls.id,
          avatar: payload.avatar,
          onboardingComplete: true,
          onboardingCompletedAt: new Date().toISOString(),
        });
      }

      if (payload.role === 'teacher') {
        let classId = null;
        let generatedCode = payload.generatedCode;

        if (payload.mode === 'join') {
          const existingClass = await getClassByCode(payload.classCode || payload.generatedCode);
          if (!existingClass) throw new Error('Fant ikke klassekoden du oppga.');
          classId = existingClass.id;
          generatedCode = existingClass.code;
        } else {
          const created = await createClass({
            name: payload.className || `Klasse ${new Date().getFullYear()}`,
            teacherId: user.uid,
            schoolId: payload.schoolId || null,
            groupId: null,
          });
          classId = created.id;
          generatedCode = created.code;
        }

        if (payload.weeklyGoalKg > 0) {
          await setClassWeeklyGoalKg(classId, payload.weeklyGoalKg);
        }

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const existingClassIds = userSnap.exists() ? userSnap.data().classIds || [] : [];
        const classIds = [...new Set([...existingClassIds, classId])];

        await setDoc(
          userRef,
          {
            role: 'teacher',
            classId,
            classIds,
            onboardingComplete: true,
            onboardingCompletedAt: new Date().toISOString(),
            latestClassCode: generatedCode,
          },
          { merge: true }
        );
      }

      if (payload.role === 'admin') {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            role: 'admin',
            organization: payload.organization,
            organizationType: payload.organizationType,
            onboardingComplete: true,
            onboardingCompletedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      await refreshUserData();
      toast.success('Onboarding fullfort!');
      router.push(getDashboardByRole(payload.role));
    } catch (completeError) {
      console.error(completeError);
      setError(completeError.message || 'Klarte ikke fullfore onboarding.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bio-gradient flex items-center justify-center px-4">
        <div className="bio-card flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-bio-500/20 border-t-bio-400" />
          <div>
            <div className="text-base font-700 text-white">Setter opp onboarding</div>
            <div className="mt-1 text-sm text-slate-400">Henter rolle, skoler og siste status.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bio-gradient px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="bio-card noise-bg relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="relative flex h-full flex-col gap-8">
              <BrandLogo />
              <div className="space-y-4">
                <div className="app-eyebrow">Onboarding</div>
                <h1 className="text-3xl font-700 tracking-[-0.05em] text-white sm:text-4xl">Vi setter opp riktig arbeidsflate for du gar videre.</h1>
                <p className="max-w-lg text-sm leading-7 text-slate-300 sm:text-[15px]">
                  Onboardingen justerer ikke bare utseendet. Den knytter brukeren til riktig rolle, riktig klasse og riktig oppfolging fra forste besok.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  'Elevflyten kobles til klassekode og personlig progresjon.',
                  'Laererflyten setter opp forste klasse, mal og deling med elever.',
                  'Adminflyten bekrefter organisasjon og modultilgang for dashboard vises.',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm leading-6 text-slate-300">
                    {item}
                  </div>
                ))}
              </div>

              {role ? (
                <div className="mt-auto rounded-[28px] border border-white/8 bg-white/4 p-5 sm:p-6">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Steg {progressStep}/{progressTotal}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-bio-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <TonePill tone="brand">{role === 'student' ? 'Elev' : role === 'teacher' ? 'Laerer' : 'Administrator'}</TonePill>
                    <TonePill>Tilpasses underveis</TonePill>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="bio-card p-6 sm:p-8 lg:p-10">
            {!role && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="app-eyebrow">Velg rolle</div>
                  <h2 className="text-3xl font-700 tracking-[-0.04em] text-white">Hvordan skal du bruke BioBin X?</h2>
                  <p className="text-sm leading-7 text-slate-400">Dette bestemmer hvilke data, hvilke handlinger og hvilke oppsett du far videre i produktet.</p>
                </div>

                <div className="grid gap-3">
                  {[
                    {
                      role: 'student',
                      title: 'Elev',
                      description: 'Registrer kast, folg egen utvikling og se hvordan du bidrar i klassen.',
                      icon: GraduationCap,
                    },
                    {
                      role: 'teacher',
                      title: 'Laerer',
                      description: 'Opprett klasser, del koder og fa oppfolging pa aktivitet, mal og varsler.',
                      icon: School,
                    },
                    {
                      role: 'admin',
                      title: 'Administrator',
                      description: 'Konfigurer organisasjon, skoler og tilgang til drift og rapportering.',
                      icon: ShieldCheck,
                    },
                  ].map(({ role: roleId, title, description, icon: Icon }) => (
                    <button
                      key={roleId}
                      onClick={() => setRole(roleId)}
                      className="flex items-start justify-between rounded-[24px] border border-white/8 bg-white/4 p-5 text-left transition-all hover:border-white/12 hover:bg-white/6"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-base font-600 text-white">
                          <Icon size={18} className="text-bio-200" />
                          {title}
                        </div>
                        <p className="mt-2 max-w-lg text-sm leading-7 text-slate-400">{description}</p>
                      </div>
                      <ArrowRight size={18} className="mt-1 text-slate-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {role === 'student' && (
              <StudentOnboardingFlow
                loading={saving}
                onProgress={handleProgress}
                onBackToRole={() => setRole('')}
                onComplete={handleComplete}
              />
            )}

            {role === 'teacher' && (
              <TeacherOnboardingFlow
                loading={saving}
                schools={schools}
                onProgress={handleProgress}
                onBackToRole={() => setRole('')}
                onComplete={handleComplete}
              />
            )}

            {role === 'admin' && (
              <AdminOnboardingFlow
                loading={saving}
                onProgress={handleProgress}
                onBackToRole={() => setRole('')}
                onComplete={handleComplete}
              />
            )}

            {error && <p className="mt-5 rounded-2xl border border-red-500/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
