'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { SignupPoint } from '../lib/useAdminOverview';

function formatDay(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric' });
}

export default function SignupChart({ signups }: { signups: SignupPoint[] }) {
  const data = signups.map((s) => ({ ...s, label: formatDay(s.date) }));
  const total = signups.reduce((sum, s) => sum + s.signups, 0);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm font-bold text-ink">Signup Behavior</h2>
          <p className="mt-1 text-xs text-ink/50">New accounts over the last 3 days.</p>
        </div>
        <span className="font-display text-lg font-bold text-ink">{total}</span>
      </div>

      <div className="mt-4 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1C54F5" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#1C54F5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDEEF7" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#8A8DA6' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#8A8DA6' }} axisLine={false} tickLine={false} width={30} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #EDEEF7', fontSize: 12 }}
              labelStyle={{ fontWeight: 600 }}
              formatter={(value: number) => [value, 'Signups']}
            />
            <Area type="monotone" dataKey="signups" stroke="#1C54F5" strokeWidth={2.5} fill="url(#signupFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
