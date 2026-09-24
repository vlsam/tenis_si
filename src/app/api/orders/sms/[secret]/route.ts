import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { secretEquals } from '@/lib/secretEquals';

/**
 * SMS gateway callback (EuroSMS or similar). Mirrors the other variants:
 * "A-XXX"/"N-XXX" replies confirm/reject the order whose booking_reference
 * starts with XXX and is still 'new'. The URL's [secret] segment (checked
 * against ORDER_SMS_WEBHOOK_SECRET) is the only auth here - there's no
 * Supabase session, so this has to use the service-role client, never one
 * scoped to a signed-in user.
 */
export async function GET(request: Request, props: { params: Promise<{ secret: string }> }) {
  const params = await props.params;
  if (!secretEquals(params.secret, process.env.ORDER_SMS_WEBHOOK_SECRET)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const smsUuid = searchParams.get('sms_uuid') ?? '';
  const smsText = (searchParams.get('sms_text') ?? '').toUpperCase();

  if (!/^[AN]-[A-Z0-9]{3}$/.test(smsText)) {
    return new NextResponse('ok:' + smsUuid);
  }

  const supabase = createAdminClient();
  const prefix = smsText.substring(2, 5);

  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'new')
    .like('booking_reference', `${prefix}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!order) {
    return new NextResponse('ok:' + smsUuid);
  }

  const allParams = Object.fromEntries(searchParams.entries());

  // Status change (and, on reject, the credit refund) happens atomically in
  // club_decide_order() - see its comment in the migration for why.
  await supabase.rpc('club_decide_order', {
    p_order_id: order.id,
    p_approve: smsText.startsWith('A'),
    p_sms_gw_response: allParams
  });

  return new NextResponse('ok:' + smsUuid);
}
