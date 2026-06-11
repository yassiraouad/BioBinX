import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ArrowRight,
  BellRing,
  Camera,
  CheckCircle2,
  ChevronRight,
  Gamepad2,
  LayoutDashboard,
  School,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';
import { TonePill } from '../components/ui/AppPrimitives';
import { useDemo } from '../hooks/useDemo';

const workflow = [
  {
    title: 'Registrering der maten faktisk kastes',
    description: 'Eleven tar bilde eller registrerer vekt ved bøtta. Resultatet går rett inn i klassens aktivitetslogg.',
    icon: Camera,
  },
  {
    title: 'Læreren får noe konkret å følge opp',
    description: 'Handlingssenteret viser lav aktivitet, bøtter som ikke er tømt og hvilke klasser som trenger en påminnelse.',
    icon: BellRing,
  },
  {
    title: 'Ledelsen ser utvikling på tvers',
    description: 'Skole- og adminvisningen samler klasser, grupper og fremdrift uten å drukne brukeren i pyntede KPI-kort.',
    icon: ShieldCheck,
  },
];

const roleCards = [
  {
    title: 'For elever',
    description: 'En enkel flyt for å registrere matavfall, holde streaken i live og se hvordan egne bidrag påvirker klassen.',
    detail: 'Skanning, poeng, badges og siste registreringer i én sammenhengende opplevelse.',
    icon: Trophy,
  },
  {
    title: 'For lærere',
    description: 'Klassekoder, ukesmål og oppfølging er bygget rundt skoleuken, ikke rundt generiske dashboardmønstre.',
    detail: 'Opprett klasse, del kode, sett mål og følg aktivitet uten manuell rapportering.',
    icon: Users,
  },
  {
    title: 'For administrasjon',
    description: 'Skoler, grupper og bin-drift er organisert som faktiske arbeidsflater for drift og rapportering.',
    detail: 'Hold oversikt over struktur, kapasitet og brukerflyt på tvers av skolen.',
    icon: School,
  },
];

const proofPoints = [
  'Klassekode-basert onboarding',
  'Daglige registreringer med AI-støtte',
  'Ukesmål, varsler og oppfølging per klasse',
];

export default function Landing() {
  const { startDemo } = useDemo();
  const router = useRouter();

  const handleDemoLogin = (role) => {
    startDemo(role);
    router.push(role === 'teacher' ? '/dashboard/demo-teacher' : '/dashboard/demo-student');
  };

  return (
    <div className="min-h-screen bg-bio-gradient text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[rgba(12,16,18,0.82)] backdrop-blur-xl">
        <div className="page-shell flex h-16 items-center justify-between">
          <BrandLogo />

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/auth/login" className="btn-ghost">
              Logg inn
            </Link>
            <Link href="/auth/signup" className="btn-primary">
              Be om tilgang
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="page-shell py-14 sm:py-18 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <div className="max-w-2xl space-y-7">
              <div className="space-y-4">
                <TonePill tone="brand">
                  <CheckCircle2 size={14} />
                  Bygget for norske skoler og kantineflyt
                </TonePill>
                <h1 className="text-balance text-4xl font-700 leading-[1.02] tracking-[-0.06em] text-white sm:text-5xl lg:text-[3.65rem]">
                  Et skoleprodukt for matavfall, ikke enda en generisk app med grønne kort.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
                  BioBin X samler registrering, elevengasjement og oppfølging i en faktisk arbeidsflate for lærere, elever og administrasjon. Resultatet er mindre manuelt arbeid og bedre beslutninger i hverdagen.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/auth/signup" className="btn-primary px-5 py-3">
                  Opprett skolekonto
                  <ArrowRight size={16} />
                </Link>
                <div className="flex gap-2">
                  <button onClick={() => handleDemoLogin('teacher')} className="btn-secondary px-4 py-3 text-sm">
                    <Gamepad2 size={16} />
                    Prøv lærer-demo
                  </button>
                  <button onClick={() => handleDemoLogin('student')} className="btn-secondary px-4 py-3 text-sm">
                    <Gamepad2 size={16} />
                    Prøv elev-demo
                  </button>
                </div>
              </div>
              <div className="flex gap-3 text-sm text-slate-500">
                <span>Har du allerede en konto?</span>
                <Link href="/auth/login" className="font-500 text-bio-200 hover:text-white">
                  Logg inn
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {proofPoints.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-bio-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="gradient-border">
              <div className="bio-card noise-bg relative overflow-hidden rounded-[30px] p-5 sm:p-6">
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between gap-4 rounded-[24px] border border-white/8 bg-white/4 px-4 py-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.08em] text-slate-500">Lærerflate</div>
                      <div className="mt-1 text-xl font-700 text-white">Handlingssenter for 6B</div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">Mandag 10:42. To elever mangler registrering denne uken og en bøtte bør følges opp før fredag.</p>
                    </div>
                    <div className="hidden rounded-2xl border border-bio-500/15 bg-bio-500/12 p-3 text-bio-100 sm:block">
                      <LayoutDashboard size={20} />
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-white/8 bg-white/3 p-4">
                        <div className="flex items-center justify-between text-sm text-slate-400">
                          <span>Ukesmål for klassen</span>
                          <span>14,2 / 20 kg</span>
                        </div>
                        <div className="mt-4 h-2.5 rounded-full bg-white/8">
                          <div className="h-full w-[71%] rounded-full bg-bio-400" />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>Fem registreringer siden mandag</span>
                          <span>5,8 kg igjen</span>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-white/8 bg-white/3 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-600 text-white">Siste aktivitet</div>
                            <div className="text-xs text-slate-500">Automatisk sortert per klasse</div>
                          </div>
                          <Sparkles size={16} className="text-bio-200" />
                        </div>
                        <div className="space-y-3">
                          {[
                            ['Sara registrerte 0,8 kg matavfall', 'for 4 min siden'],
                            ['Varsel: BioBin 6A-3 er ikke tømt på 72 timer', 'for 19 min siden'],
                            ['Ukens quiz ble sendt til 6B og 6A', 'for 31 min siden'],
                          ].map(([title, meta]) => (
                            <div key={title} className="flex items-start justify-between gap-3 rounded-2xl border border-white/6 bg-white/3 px-3 py-3">
                              <div>
                                <div className="text-sm text-white">{title}</div>
                                <div className="mt-1 text-xs text-slate-500">{meta}</div>
                              </div>
                              <ChevronRight size={16} className="mt-0.5 text-slate-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-white/8 bg-white/3 p-4">
                        <div className="text-sm font-600 text-white">Skolerangering</div>
                        <div className="mt-3 space-y-3">
                          {[
                            ['6B', '124 poeng', true],
                            ['6A', '118 poeng', false],
                            ['5C', '97 poeng', false],
                          ].map(([name, points, active]) => (
                            <div key={name} className={`flex items-center justify-between rounded-2xl px-3 py-3 text-sm ${active ? 'border border-bio-500/20 bg-bio-500/12 text-white' : 'border border-white/6 bg-white/3 text-slate-300'}`}>
                              <span>{name}</span>
                              <span className="font-600">{points}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-white/8 bg-white/3 p-4">
                        <div className="text-sm font-600 text-white">Elevopplevelse</div>
                        <div className="mt-3 rounded-2xl border border-white/6 bg-[rgba(12,16,18,0.55)] p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-600 text-white">Registrer kast</div>
                              <div className="text-xs text-slate-500">Ta bilde, vurder avfallet, lagre vekten</div>
                            </div>
                            <div className="rounded-2xl border border-bio-500/15 bg-bio-500/12 p-3 text-bio-100">
                              <Camera size={18} />
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="text-slate-400">Forventet belønning</span>
                            <span className="font-600 text-white">+8 poeng ved 0,8 kg</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-shell pb-14 sm:pb-18 lg:pb-24">
          <div className="grid gap-4 lg:grid-cols-3">
            {workflow.map(({ title, description, icon: Icon }) => (
              <article key={title} className="surface p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-bio-500/20 bg-bio-500/10 text-bio-200">
                  <Icon size={20} />
                </div>
                <h2 className="text-lg font-700 text-white">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="page-shell pb-16 sm:pb-24">
          <div className="mb-8 max-w-2xl space-y-3">
            <div className="app-eyebrow">Tilpasset faktiske roller</div>
            <h2 className="text-3xl font-700 tracking-[-0.04em] text-white">Hver arbeidsflate har et tydelig ansvar.</h2>
            <p className="text-sm leading-7 text-slate-400 sm:text-[15px]">
              I stedet for å vise de samme kortene til alle, bygger BioBin X egne flyter for eleven som registrerer, læreren som følger opp og administrasjonen som organiserer driften.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {roleCards.map(({ title, description, detail, icon: Icon }) => (
              <article key={title} className="bio-card p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-bio-500/18 bg-bio-500/10 text-bio-200">
                  <Icon size={19} />
                </div>
                <h3 className="text-xl font-700 text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
                <p className="mt-5 border-t border-white/8 pt-5 text-sm leading-7 text-slate-500">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="page-shell pb-16 sm:pb-24">
          <div className="bio-card overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-2xl space-y-4">
                <div className="app-eyebrow">Klar for pilot</div>
                <h2 className="text-3xl font-700 tracking-[-0.04em] text-white">Sett opp en skoleflate som faktisk tåler daglig bruk.</h2>
                <p className="text-sm leading-7 text-slate-400 sm:text-[15px]">
                  Start med lærer- eller elevdemo, eller gå rett til opprettelse av konto og onboarding. Oppsettet er laget for klassekoder, ukesmål og løpende oppfølging fra første dag.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex gap-2">
                  <button onClick={() => handleDemoLogin('teacher')} className="btn-secondary px-4 py-3 text-sm">
                    <Gamepad2 size={16} />
                    Prøv lærer-demo
                  </button>
                  <button onClick={() => handleDemoLogin('student')} className="btn-secondary px-4 py-3 text-sm">
                    <Gamepad2 size={16} />
                    Prøv elev-demo
                  </button>
                </div>
                <Link href="/auth/signup" className="btn-primary px-5 py-3">
                  Kom i gang
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
