'use client';

import { useAdminPush } from './lib/useAdminPush';
import PushForm from './components/PushForm';
import PushHistory from './components/PushHistory';

export default function AdminPushPage() {
  const { history, loading, sending, error, send } = useAdminPush();

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Push Notifications</h1>
      <p className="mt-1 text-sm text-ink/60">Send a platform-wide push notification to every user with notifications enabled.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <PushForm sending={sending} error={error} onSend={send} />
        <PushHistory history={history} loading={loading} />
      </div>
    </div>
  );
}
