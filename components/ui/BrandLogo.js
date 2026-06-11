import Link from 'next/link';
import clsx from 'clsx';
import { Leaf } from 'lucide-react';

export default function BrandLogo({
  href = '/',
  className,
  compact = false,
  showCaption = true,
  caption = 'Plattform for matavfall i skolen',
}) {
  return (
    <Link href={href} className={clsx('inline-flex items-center gap-3', className)} aria-label="BioBin X home">
      <span className={clsx('flex items-center justify-center rounded-2xl border border-bio-500/20 bg-bio-500/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]', compact ? 'h-10 w-10' : 'h-11 w-11')}>
        <Leaf size={compact ? 18 : 20} className="text-bio-300" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-700 tracking-[0.01em] text-white sm:text-base">BioBin X</span>
        {showCaption && !compact && <span className="block text-[11px] text-slate-500">{caption}</span>}
      </span>
    </Link>
  );
}
