// components/layout/Layout.js
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useDemo } from '../../hooks/useDemo';
import { logoutUser } from '../../firebase/auth';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  LayoutDashboard, Leaf, Trophy, Brain, BarChart3,
  Camera, Users, LogOut, Shield, Zap, Bell
} from 'lucide-react';
import DemoBanner from '../DemoBanner';
import { motion, useReducedMotion } from 'framer-motion';
import BrandLogo from '../ui/BrandLogo';
import { TonePill } from '../ui/AppPrimitives';

const studentNav = [
  { href: '/dashboard/student', icon: LayoutDashboard, label: 'Oversikt' },
  { href: '/scan', icon: Camera, label: 'Skann mat' },
  { href: '/achievements', icon: Zap, label: 'Prestasjoner' },
  { href: '/leaderboard', icon: Trophy, label: 'Rangering' },
  { href: '/quiz', icon: Brain, label: 'Quiz' },
  { href: '/stats', icon: BarChart3, label: 'Statistikk' },
];

const teacherNav = [
  { href: '/dashboard/teacher', icon: LayoutDashboard, label: 'Oversikt' },
  { href: '/teacher/action-center', icon: Bell, label: 'Handlingssenter' },
  { href: '/leaderboard', icon: Trophy, label: 'Rangering' },
  { href: '/stats', icon: BarChart3, label: 'Statistikk' },
  { href: '/dashboard/classes', icon: Users, label: 'Klasser' },
];

const adminNav = [
  { href: '/dashboard/admin', icon: Shield, label: 'Administrator' },
  { href: '/admin/bin-operations', icon: Bell, label: 'Bøttedrift' },
  { href: '/dashboard/student', icon: LayoutDashboard, label: 'Elev-visning' },
  { href: '/dashboard/teacher', icon: LayoutDashboard, label: 'Lærer-visning' },
  { href: '/leaderboard', icon: Trophy, label: 'Rangering' },
  { href: '/stats', icon: BarChart3, label: 'Statistikk' },
];

const rectorNav = [
  { href: '/dashboard/rector', icon: LayoutDashboard, label: 'Oversikt' },
  { href: '/leaderboard', icon: Trophy, label: 'Rangering' },
  { href: '/stats', icon: BarChart3, label: 'Statistikk' },
  { href: '/dashboard/classes', icon: Users, label: 'Klasser' },
];

const demoTeacherNav = [
  { href: '/dashboard/demo-teacher', icon: LayoutDashboard, label: 'Oversikt' },
  { href: '/leaderboard', icon: Trophy, label: 'Rangering' },
  { href: '/stats', icon: BarChart3, label: 'Statistikk' },
  { href: '/dashboard/classes', icon: Users, label: 'Klasser' },
];

const demoStudentNav = [
  { href: '/dashboard/demo-student', icon: LayoutDashboard, label: 'Oversikt' },
  { href: '/scan', icon: Camera, label: 'Skann mat' },
  { href: '/leaderboard', icon: Trophy, label: 'Rangering' },
  { href: '/stats', icon: BarChart3, label: 'Statistikk' },
];

const routeLabels = {
  '/dashboard/student': 'Elevoversikt',
  '/dashboard/teacher': 'Læreroversikt',
  '/dashboard/admin': 'Adminoversikt',
  '/dashboard/rector': 'Skoleoversikt',
  '/dashboard/demo-student': 'Demo elev',
  '/dashboard/demo-teacher': 'Demo lærer',
  '/dashboard/classes': 'Klasser',
  '/teacher/action-center': 'Handlingssenter',
  '/scan': 'Registrer kast',
  '/stats': 'Statistikk',
  '/leaderboard': 'Rangering',
  '/quiz': 'Quiz',
  '/achievements': 'Prestasjoner',
  '/admin/bin-operations': 'Bøttedrift',
};

export default function Layout({ children }) {
  const { userData } = useAuth();
  const { isDemo, demoUser, exitDemo } = useDemo();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  
  const activeUser = isDemo ? demoUser : userData;
  
  const getNav = () => {
    if (isDemo) {
      if (demoUser?.role === 'student') return demoStudentNav;
      return demoTeacherNav;
    }
    if (activeUser?.role === 'admin') return adminNav;
    if (activeUser?.role === 'teacher') return teacherNav;
    if (activeUser?.role === 'rector') return rectorNav;
    return studentNav;
  };
  
  const nav = getNav();

  const handleLogout = async () => {
    if (isDemo) {
      exitDemo();
    } else {
      await logoutUser();
    }
    toast.success('Logget ut!');
    router.push('/');
  };

  const getRoleLabel = () => {
    if (activeUser?.role === 'admin') return 'Administrator';
    if (activeUser?.role === 'teacher') return 'Lærer';
    if (activeUser?.role === 'rector') return 'Rektor';
    return 'Elev';
  };

  const getRoleColor = () => {
    if (activeUser?.role === 'admin') return 'danger';
    if (activeUser?.role === 'teacher') return 'brand';
    if (activeUser?.role === 'rector') return 'earth';
    return 'default';
  };

  const currentArea = routeLabels[router.pathname] || 'BioBin X';

  return (
    <div className="flex min-h-screen bg-bio-gradient text-slate-100">
      <DemoBanner />
      <aside className={clsx('fixed left-0 z-40 hidden h-full w-[280px] flex-col border-r border-white/8 bg-[rgba(12,16,18,0.88)] backdrop-blur-2xl lg:flex', isDemo ? 'top-10' : 'top-0')}>
        <div className="border-b border-white/8 px-6 py-5">
          <BrandLogo compact={false} showCaption />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] font-600 uppercase tracking-[0.08em] text-slate-500">Arbeidsflate</span>
            <TonePill tone="brand">{currentArea}</TonePill>
          </div>
        </div>

        {activeUser && (
          <div className="border-b border-white/8 px-5 py-5">
            <div className="bio-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-sm font-700 text-white">
                  {activeUser.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <div className="truncate text-sm font-700 text-white">{activeUser.name}</div>
                    <div className="mt-1">
                      <TonePill tone={getRoleColor()}>{getRoleLabel()}</TonePill>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                    {activeUser.className ? <span>{activeUser.className}</span> : null}
                    {activeUser.schoolName ? <span>{activeUser.schoolName}</span> : null}
                  </div>
                </div>
                {activeUser.role === 'student' && (
                  <div className="rounded-2xl border border-white/8 bg-white/4 px-3 py-2 text-right">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Poeng</div>
                    <div className="text-sm font-700 text-white">{activeUser.points || 0}</div>
                  </div>
                )}
              </div>
            </div>
            {isDemo && (
              <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-200">
                Demo-modus
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 space-y-1 px-4 py-5">
          {nav.map(({ href, icon: Icon, label }) => {
            const isActive = router.pathname === href;
            return (
              <motion.div key={href} whileHover={prefersReducedMotion ? {} : { x: 2 }} whileTap={prefersReducedMotion ? {} : { scale: 0.99 }}>
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'group flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm font-600 transition-all duration-200',
                    isActive
                      ? 'border-white/10 bg-white/7 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                      : 'border-transparent text-slate-400 hover:border-white/8 hover:bg-white/4 hover:text-slate-200'
                  )}
                >
                  <span className={clsx('flex h-9 w-9 items-center justify-center rounded-xl border transition-colors', isActive ? 'border-bio-500/20 bg-bio-500/14 text-bio-200' : 'border-white/8 bg-white/4 text-slate-500 group-hover:border-white/10 group-hover:text-slate-300')}>
                    <Icon size={17} />
                  </span>
                  <span className="flex-1">{label}</span>
                  {isActive ? (
                    <motion.span className="text-slate-600" layoutId="active-nav-chevron" transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </motion.span>
                  ) : null}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="border-t border-white/8 p-4">
          <motion.button
            onClick={handleLogout}
            className="btn-secondary w-full justify-start border-white/8 bg-white/4 text-slate-300 hover:text-white"
            whileTap={prefersReducedMotion ? {} : { scale: 0.99 }}
          >
            <LogOut size={18} />
            Logg ut
          </motion.button>
        </div>
      </aside>

      <div className={clsx('fixed left-0 right-0 z-30 border-b border-white/8 bg-[rgba(12,16,18,0.9)] px-4 backdrop-blur-xl lg:hidden', isDemo ? 'top-10' : 'top-0')}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
          <BrandLogo compact showCaption={false} />
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.08em] text-slate-500">{getRoleLabel()}</div>
            <div className="text-sm font-600 text-white">{currentArea}</div>
          </div>
        </div>
      </div>

      <main className={clsx('flex-1 pb-24 pt-16 lg:ml-[280px] lg:pb-0 lg:pt-0', isDemo ? 'lg:pt-10' : '', isDemo ? 'pt-[6.5rem]' : 'pt-16')}>
        {children}
      </main>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 mobile-nav z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {nav.slice(0, 5).map(({ href, icon: Icon, label }) => {
            const isActive = router.pathname === href;
            return (
              <motion.div whileTap={prefersReducedMotion ? {} : { scale: 0.96 }} key={href}>
                <Link
                  href={href}
                  className={clsx(
                    'flex min-w-[62px] flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-all',
                    isActive
                      ? 'bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  <Icon size={19} className={isActive ? 'text-bio-200' : undefined} />
                  <span className="text-[11px] font-500">{label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
