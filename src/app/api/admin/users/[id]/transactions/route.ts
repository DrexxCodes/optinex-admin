import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { listWalletTransactions } from '@/lib/db/walletTransactions';
import { UUID_RE } from '@/lib/db/format';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 50);
  const cursor = searchParams.get('cursor');

  if (!UUID_RE.test(id)) return NextResponse.json({ transactions: [], hasMore: false, nextCursor: null });
  return NextResponse.json(await listWalletTransactions(id, limit, cursor));
}
