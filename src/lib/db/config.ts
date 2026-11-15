// Key/value app config (former Firestore config/* docs) — popup, bank, upgrade, withdrawal.
import { supabaseAdmin } from '@/lib/supabase/admin';

export type ConfigKey = 'popup' | 'bank' | 'upgrade' | 'withdrawal' | 'resetLog' | 'referralWeekly';

export async function getConfig<T = Record<string, any>>(key: ConfigKey): Promise<T | null> {
  const { data, error } = await supabaseAdmin.from('config').select('value').eq('key', key).maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.value as T) ?? null;
}

/** Shallow merge into the stored value (same semantics as Firestore `set(..., { merge: true })`). */
export async function mergeConfig(key: ConfigKey, value: Record<string, unknown>) {
  const { error } = await supabaseAdmin.rpc('merge_config', { p_key: key, p_value: value });
  if (error) throw new Error(error.message);
}
