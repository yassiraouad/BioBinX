import BrandLogo from './BrandLogo';

export default function AuthShell({
  eyebrow,
  title,
  description,
  sideTitle,
  sideDescription,
  sideContent,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen bg-bio-gradient px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="bio-card noise-bg relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="relative flex h-full flex-col gap-8">
              <BrandLogo />
              <div className="max-w-xl space-y-4">
                {eyebrow ? <div className="app-eyebrow">{eyebrow}</div> : null}
                <div className="space-y-3">
                  <h1 className="text-3xl font-700 tracking-[-0.05em] text-white sm:text-4xl">{title}</h1>
                  <p className="max-w-lg text-sm leading-7 text-slate-300 sm:text-[15px]">{description}</p>
                </div>
              </div>
              <div className="mt-auto rounded-[28px] border border-white/8 bg-white/4 p-5 sm:p-6">
                <div className="space-y-2">
                  <h2 className="text-lg font-700 text-white">{sideTitle}</h2>
                  <p className="text-sm leading-6 text-slate-400">{sideDescription}</p>
                </div>
                <div className="mt-5">{sideContent}</div>
              </div>
            </div>
          </section>

          <section className="bio-card p-6 sm:p-8 lg:p-10">
            <div className="space-y-6">
              {children}
              {footer ? <div>{footer}</div> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
