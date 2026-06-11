// pages/about.js
import Link from 'next/link';
import { Leaf, Zap, Wind, Globe, ArrowLeft, Github, Heart } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-dark-900 px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-bio-500/4 rounded-full blur-[100px]" />
        <div className="dot-pattern absolute inset-0 opacity-20" />
      </div>

      <div className="max-w-3xl mx-auto relative">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-body mb-10">
          <ArrowLeft size={16} /> Tilbake
        </Link>

        <div className="text-center mb-12 animate-slide-up">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-bio-500 to-bio-700 flex items-center justify-center mx-auto mb-6 bio-glow">
            <Leaf size={36} className="text-white" />
          </div>
          <h1 className="font-display font-800 text-white text-4xl mb-4">Om BioBin X</h1>
          <p className="text-slate-400 font-body text-lg max-w-xl mx-auto">
            Et skoleprosjekt som gjør matavfallshåndtering til en spennende konkurranse – og bidrar til en grønnere fremtid.
          </p>
        </div>

        <div className="space-y-6 mb-12">
          {[
            {
              icon: Leaf,
              color: 'bio',
              title: 'Hva er BioBin X?',
              text: 'BioBin X er en webapp designet for skoler som ønsker å redusere matavfall. Elever kaster mat i bioavfallsbøtter som omdanner organisk avfall til biogass – og appen gjør hele prosessen synlig, målbar og morsom.',
            },
            {
              icon: Zap,
              color: 'moss',
              title: 'Hvordan fungerer biogass?',
              text: 'Biogass produseres når mikroorganismer bryter ned organisk materiale uten oksygen (anaerob fermentering). 1 kg matavfall kan produsere ca. 0,5 kWh energi. Denne energien kan brukes til oppvarming, elektrisitet eller drivstoff.',
            },
            {
              icon: Wind,
              color: 'earth',
              title: 'CO₂-besparelse',
              text: 'Når matavfall havner på søppeldeponiet, produserer det metan – en klimagass 25 ganger sterkere enn CO₂. Ved å omdanne avfallet til biogass, kan vi spare ca. 0,8 kg CO₂-ekvivalenter per kilo matavfall.',
            },
            {
              icon: Globe,
              color: 'bio',
              title: 'Hvorfor er dette viktig?',
              text: 'Globalt kastes omtrent 1/3 av all mat som produseres. I Norge kaster vi ca. 450 000 tonn mat per år. FNs bærekraftsmål 12.3 krever at vi halverer matavfallet innen 2030. BioBin X hjelper skoler å ta del i denne løsningen.',
            },
          ].map(({ icon: Icon, color, title, text }) => (
            <div key={title} className="bio-card p-6">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl bg-${color}-500/15 flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={`text-${color}-400`} />
                </div>
                <div>
                  <h2 className="font-display font-700 text-white text-lg mb-2">{title}</h2>
                  <p className="text-slate-400 font-body leading-relaxed">{text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tech stack */}
        <div className="bio-card p-6 mb-8">
          <h2 className="font-display font-700 text-white text-lg mb-4">Teknologi</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {['Next.js', 'React', 'Tailwind CSS', 'Firebase Auth', 'Firestore', 'Web Camera API', 'Recharts', 'Framer Motion', 'Vercel'].map(tech => (
              <div key={tech} className="px-3 py-2 rounded-xl bg-white/4 border border-white/8 text-slate-300 text-sm font-mono text-center">
                {tech}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-slate-500 font-body flex items-center justify-center gap-2">
            Laget med <Heart size={14} className="text-red-400" /> for en grønnere fremtid
          </p>
          <Link href="/auth/signup" className="btn-primary inline-flex items-center gap-2 mt-6 px-8 py-3">
            Kom i gang
          </Link>
        </div>
      </div>
    </div>
  );
}
