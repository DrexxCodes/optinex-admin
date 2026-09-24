import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

function createdMs(doc: QueryDocumentSnapshot): number {
  return doc.data().createdAt?.toMillis?.() ?? 0;
}

// A user's profile only holds ONE package (the last one an admin approved), but
// older approved investment docs stay `status: 'active'` after a newer package
// replaces them. So "is this doc the user's live package?" means: it's the
// newest active doc for the package the profile currently points at.
//
// Shared by the subscriptions list (to badge the live one) and the revoke route
// (to decide whether the profile must be reset) so the two can never disagree.
export function newestActivePackageDoc(docs: QueryDocumentSnapshot[], packageId: string): QueryDocumentSnapshot | null {
  let best: QueryDocumentSnapshot | null = null;
  for (const d of docs) {
    const data = d.data();
    if (data.status !== 'active' || data.packageId !== packageId) continue;
    if (!best || createdMs(d) > createdMs(best)) best = d;
  }
  return best;
}
