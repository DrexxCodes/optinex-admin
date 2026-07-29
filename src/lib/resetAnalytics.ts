import { adminDb } from '@/lib/firebase/admin';

// Zeroes out specific dot-path fields (e.g. 'counts.checkin', 'revenueTotal')
// across every existing analytics/{daily,monthly,yearly}/entries doc.
//
// Deliberately field-scoped rather than wiping whole documents: `total` and
// `amountTotal` are shared counters incremented by *every* action type, so
// resetting e.g. "check-in stats" must never touch them — that would
// silently erase unrelated signup/signin/financial history too.
export async function resetAnalyticsFields(fields: string[]) {
  const periods = ['daily', 'monthly', 'yearly'] as const;

  for (const period of periods) {
    const entriesSnap = await adminDb.collection('analytics').doc(period).collection('entries').get();
    if (entriesSnap.empty) continue;

    const update: Record<string, number> = {};
    for (const f of fields) update[f] = 0;

    // Firestore batches cap at 500 writes — chunk defensively in case the
    // analytics history grows past that many day/month/year docs.
    for (let i = 0; i < entriesSnap.docs.length; i += 500) {
      const batch = adminDb.batch();
      for (const doc of entriesSnap.docs.slice(i, i + 500)) {
        batch.set(doc.ref, update, { merge: true });
      }
      await batch.commit();
    }
  }
}
