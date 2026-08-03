export function formatResetTime(iso: string | null): string {
  if (!iso) return 'Never reset';
  const d = new Date(iso);
  return `Last reset ${d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })}`;
}
