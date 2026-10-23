import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { buildLoanTimeline, isLoanStage, nextLoanStage, LOAN_STAGES } from '@/lib/loans/config';

// Full timeline for one application (the list endpoint stays light by not
// reading every application's timeline subcollection).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const loanRef = adminDb.collection('loans').doc(id);
  const [loanSnap, timelineSnap] = await Promise.all([loanRef.get(), loanRef.collection('timeline').get()]);
  if (!loanSnap.exists) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });

  return NextResponse.json({
    id,
    status: loanSnap.data()!.status,
    timeline: buildLoanTimeline(timelineSnap.docs.map((d) => d.data()))
  });
}

// Moves an application exactly one step forward. The caller states the stage
// it believes the application is in (`from`) and the stage it wants (`to`);
// both are checked against the live document inside a transaction, so a
// double-click or two admins acting at once can never skip a stage.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const { from, to } = await req.json().catch(() => ({}));
  if (!isLoanStage(from) || !isLoanStage(to) || nextLoanStage(from) !== to) {
    return NextResponse.json({ error: 'Applications can only move one step forward.' }, { status: 400 });
  }

  const loanRef = adminDb.collection('loans').doc(id);

  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(loanRef);
      if (!snap.exists) throw new Error('NOT_FOUND');
      const loan = snap.data()!;
      if (loan.status !== from) throw new Error('STALE');

      tx.update(loanRef, { status: to, statusChangedAt: FieldValue.serverTimestamp() });

      // Immutable timeline entry: doc id == stage and written with create(),
      // so it fails if that stage was somehow already recorded. Nothing in
      // either app ever updates or deletes these documents.
      tx.create(loanRef.collection('timeline').doc(to), {
        status: to,
        seq: LOAN_STAGES.indexOf(to),
        by: 'admin',
        actorUid: admin.uid,
        at: FieldValue.serverTimestamp()
      });

      // Leaving "pending" frees the user to apply again (see the
      // `pendingLoanId` lock in the user app's /api/loans/apply).
      if (from === 'pending') {
        tx.set(adminDb.collection('users').doc(loan.uid), { pendingLoanId: FieldValue.delete() }, { merge: true });
      }
    });
  } catch (err: any) {
    if (err?.message === 'NOT_FOUND') return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    if (err?.message === 'STALE') {
      return NextResponse.json({ error: 'This application has already moved on. Refresh to see its latest status.' }, { status: 409 });
    }
    console.error('[admin/loans PATCH]', err);
    return NextResponse.json({ error: 'Could not update this application.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
