'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type AdminTask = {
  id: string;
  name: string;
  details: string;
  buttonLabel: string;
  link: string;
  reward: number;
  active: boolean;
};

export function useAdminTasks() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await authFetch('/api/admin/tasks');
    if (res.ok) setTasks((await res.json()).tasks);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createTask = useCallback(
    async (task: { name: string; details: string; buttonLabel: string; link: string; reward: number }) => {
      const res = await authFetch('/api/admin/tasks', { method: 'POST', body: JSON.stringify(task) });
      const data = await res.json();
      if (res.ok) await load();
      return { ok: res.ok, error: data.error };
    },
    [load]
  );

  const updateTask = useCallback(async (id: string, update: Partial<AdminTask>) => {
    await authFetch(`/api/admin/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(update) });
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...update } : t)));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await authFetch(`/api/admin/tasks/${id}`, { method: 'DELETE' });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, createTask, updateTask, deleteTask };
}
