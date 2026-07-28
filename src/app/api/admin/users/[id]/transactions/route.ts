import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/adminGuard';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 50);
  const cursor = searchParams.get('cursor');

  const txnsCollection = adminDb.collection('users').doc(id).collection('walletTransactions');
  const baseQuery = txnsCollection.orderBy('timestamp', 'desc');

  let query = baseQuery.limit(limit + 1);
  if (cursor) {
    const cursorSnap = await txnsCollection.doc(cursor).get();
    if (cursorSnap.exists) query = baseQuery.startAfter(cursorSnap).limit(limit + 1);
  }

  const snap = await query.get();
  const docs = snap.docs.slice(0, limit);
  const hasMore = snap.docs.length > limit;

  return NextResponse.json({
    transactions: docs.map((d) => {
      const t = d.data();
      return {
        id: d.id,
        txnType: t.txnType,
        txnName: t.txnName,
        amount: t.amount,
        txnRef: t.txnRef,
        timestamp: t.timestamp?.toDate?.() ?? null
      };
    }),
    hasMore,
    nextCursor: hasMore ? docs[docs.length - 1].id : null
  });
}
