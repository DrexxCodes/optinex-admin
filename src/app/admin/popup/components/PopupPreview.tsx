import type { PopupConfig } from '../lib/useAdminPopup';

export default function PopupPreview({ config }: { config: PopupConfig }) {
  if (!config.enabled) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-ink/10 p-8 text-center text-sm text-ink/40">
        Notification is disabled — users won't see anything.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#F4F8FF] p-8">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-ink/40">Preview — what users see</p>
      <div className="glass-panel mx-auto max-w-sm rounded-3xl p-6 shadow-glass">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Good Morning, Drexx</p>
        <h2 className="mt-2 font-display text-xl font-bold text-ink">{config.title || 'Your title here'}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">{config.body || 'Your message here'}</p>
        {config.actionLabel && config.actionLink && (
          <div className="mt-5 rounded-xl bg-brand-500 py-3 text-center text-sm font-semibold text-white">{config.actionLabel}</div>
        )}
      </div>
    </div>
  );
}
