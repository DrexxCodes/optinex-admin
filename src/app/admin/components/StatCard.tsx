import type { LucideIcon } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, tone = 'brand' }: { label: string; value: string | number; icon: LucideIcon; tone?: 'brand' | 'amber' | 'emerald' | 'red' }) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-500',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-500',
    red: 'bg-red-50 text-red-500'
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={18} />
      </span>
      <p className="mt-3 font-display text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink/50">{label}</p>
    </div>
  );
}
