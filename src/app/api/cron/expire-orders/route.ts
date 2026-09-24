import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { secretEquals } from '@/lib/secretEquals';

/**
 * Replaces the old Sails `config/cron.js` (a `setInterval`-style poll every
 * 5s, only possible in a long-running Node process). Serverless Next.js has
 * no equivalent, so this must be hit periodically by an external scheduler
 * instead - e.g. Vercel Cron (see vercel.json) or any cron caller that sends
 * `Authorization: Bearer <CRON_SECRET>`.
 *
 * Targets 'new' orders (awaiting manual club review) the club never acted
 * on - create_order() debits credit up front, so expiring one has to refund
 * it; expire_stale_orders() does that atomically per order, in SQL.
 */
const EXPIRY_MINUTES = 60 * 24;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : undefined;
  if (!secretEquals(authHeader ?? undefined, expected)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('expire_stale_orders', { p_older_than_minutes: EXPIRY_MINUTES });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expired: data ?? 0 });
}
