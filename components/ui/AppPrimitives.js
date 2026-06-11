import clsx from 'clsx';

const pillToneClasses = {
  default: 'app-pill',
  brand: 'app-pill app-pill-brand',
  earth: 'app-pill app-pill-earth',
  danger: 'app-pill app-pill-danger',
};

const metricToneClasses = {
  brand: 'bg-bio-500/12 text-bio-100 border border-bio-500/15',
  earth: 'bg-earth-500/12 text-earth-100 border border-earth-500/15',
  moss: 'bg-moss-500/12 text-moss-100 border border-moss-500/15',
  neutral: 'bg-white/5 text-white border border-white/8',
};

export function Page({ children, className, width = 'max-w-6xl' }) {
  return <div className={clsx('app-page', width, className)}>{children}</div>;
}

export function TonePill({ children, tone = 'default', className }) {
  return <span className={clsx(pillToneClasses[tone] || pillToneClasses.default, className)}>{children}</span>;
}

export function PageHeader({ eyebrow, title, description, actions, meta, className }) {
  return (
    <div className={clsx('flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="max-w-3xl space-y-3">
        {eyebrow ? <div className="app-eyebrow">{eyebrow}</div> : null}
        <div className="space-y-2">
          <h1 className="text-2xl font-700 tracking-[-0.04em] text-white sm:text-3xl lg:text-[2rem]">{title}</h1>
          {description ? <p className="app-copy text-sm sm:text-[15px]">{description}</p> : null}
        </div>
        {meta?.length ? (
          <div className="flex flex-wrap gap-2">
            {meta.map((item) => (
              <TonePill key={typeof item === 'string' ? item : JSON.stringify(item)}>{item}</TonePill>
            ))}
          </div>
        ) : null}
      </div>
      {actions ? <div className="app-toolbar lg:justify-end">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({ title, description, action, children, className, contentClassName }) {
  return (
    <section className={clsx('bio-card p-5 sm:p-6', className)}>
      {(title || description || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? <h2 className="text-lg font-700 text-white">{title}</h2> : null}
            {description ? <p className="text-sm text-slate-400">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

export function MetricCard({ icon: Icon, label, value, meta, tone = 'brand', className }) {
  return (
    <div className={clsx('bio-card metric-card p-5', className)}>
      <div className={clsx('flex h-11 w-11 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]', metricToneClasses[tone] || metricToneClasses.brand)}>
        {Icon ? <Icon size={18} /> : null}
      </div>
      <div className="space-y-1.5">
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
        {meta ? <div className="metric-meta">{meta}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={clsx('app-empty empty-state-soft', className)}>
      {Icon ? (
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/4 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <Icon size={22} />
        </div>
      ) : null}
      <div className="space-y-2">
        <h3 className="text-[15px] font-700 text-white">{title}</h3>
        {description ? <p className="mx-auto max-w-sm text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function SegmentedControl({ items, value, onChange, className }) {
  return (
    <div className={clsx('segmented-control', className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={clsx('segmented-button', active && 'segmented-button-active', item.className)}
          >
            <span className="inline-flex items-center gap-2">
              {item.icon ? <item.icon size={15} /> : null}
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function LoadingScreen({ title = 'Laster arbeidsflate', description = 'Henter siste data og gjør oppsettet klart.' }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="bio-card flex w-full max-w-sm flex-col items-center gap-5 p-8 text-center">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-bio-500/15 border-t-bio-400" />
          <div className="h-4 w-4 rounded-full bg-bio-500/20" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-[15px] font-700 text-white">{title}</h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}
