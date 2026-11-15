import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { getConfig, mergeConfig } from '@/lib/db/config';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const data = await getConfig('upgrade');
  return NextResponse.json(data ?? { price: null, bankName: '', accountNumber: '', accountName: '' });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const { price, bankName, accountNumber, accountName } = await req.json();
  if (!price || price <= 0) return NextResponse.json({ error: 'Enter a valid price.' }, { status: 400 });
  if (!bankName || !accountNumber || !accountName) {
    return NextResponse.json({ error: 'Bank name, account number, and account name are all required.' }, { status: 400 });
  }

  await mergeConfig('upgrade', { price, bankName, accountNumber, accountName });
  return NextResponse.json({ ok: true });
}
