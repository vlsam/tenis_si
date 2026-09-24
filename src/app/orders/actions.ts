'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail, sendPaymentConfirmationEmail } from '@/lib/email';
import { sendSmsConfirmationRequest } from '@/lib/sms';
import { formatDate, isNowInTimeInterval, minuteToTime } from '@/lib/format';
import { getSiteUrl } from '@/lib/siteUrl';

/**
 * Thin wrapper around the `create_order` Postgres function (see
 * supabase/migrations/0002_tk77_credit_gated_booking.sql). All the actual
 * business logic - price calculation, availability/overlap checks, the
 * atomic credit debit - lives in the database, not here. That's deliberate:
 * Supabase's REST/RPC API is directly reachable from the browser with the
 * user's own JWT, so this Server Action is a convenience wrapper, not a
 * trust boundary.
 */
export async function createOrder(formData: FormData) {
  const courtId = Number(formData.get('courtId'));
  const orderDate = String(formData.get('date'));
  const fromMinute = Number(formData.get('fromMinute'));
  const toMinute = Number(formData.get('toMinute'));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_order', {
    p_court_id: courtId,
    p_order_date: orderDate,
    p_from_minute: fromMinute,
    p_to_minute: toMinute
  });

  if (error || !data) {
    const message = error?.message.includes('insufficient_credit')
      ? 'Nemáte dostatok kreditu na túto rezerváciu. Najprv si dobite kredit.'
      : error?.message.includes('slot_unavailable')
        ? 'Tento termín je už obsadený, zvoľte iný.'
        : error?.message.includes('invalid_order_date')
          ? 'Rezervovať možno len termíny od dnešného dňa na najbližších 30 dní.'
          : (error?.message ?? 'Rezerváciu sa nepodarilo vytvoriť.');
    redirect(`/courts?date=${orderDate}&error=${encodeURIComponent(message)}`);
  }

  // Credit was already debited atomically inside create_order() - there's no
  // separate payment step left. 'new' means the club still has to manually
  // review it (club_settings.confirmation = 'manual'); anything else it
  // could return here ('paid') means it's fully settled already.
  if (data.status === 'new') {
    // The club needs a confirm/reject link carrying the order's `token` -
    // that column is deliberately unreadable by the `authenticated` role
    // (see the migration), so only the admin/service-role client may read
    // it here, server-side, for this one purpose.
    const admin = createAdminClient();
    const [{ data: fullOrder }, { data: court }, { data: club }] = await Promise.all([
      admin.from('orders').select('token, booking_reference').eq('id', data.id).single(),
      admin.from('courts').select('name').eq('id', data.court_id).single(),
      admin.from('club_settings').select('phone, sms_notification, sms_notification_time, sms_from, sms_to').eq('id', 1).single()
    ]);

    if (fullOrder) {
      const base = getSiteUrl();
      await sendOrderConfirmationEmail({
        bookingReference: fullOrder.booking_reference,
        courtName: court?.name ?? '',
        confirmUrl: `${base}/potvrdenie-rezervacie?id=${data.id}&token=${fullOrder.token}&action=confirm`,
        rejectUrl: `${base}/potvrdenie-rezervacie?id=${data.id}&token=${fullOrder.token}&action=reject`
      });

      const wantsSms =
        club?.sms_notification &&
        club.phone &&
        (!club.sms_notification_time || (club.sms_from && club.sms_to && isNowInTimeInterval(club.sms_from, club.sms_to)));

      if (wantsSms && club?.phone) {
        const smsCode = fullOrder.booking_reference.substring(0, 3);
        const smsText =
          `Potvrdte rezervaciu kurtu "${(court?.name ?? '').substring(0, 15)}" dna ${formatDate(data.order_date)} ` +
          `od ${minuteToTime(data.from_minute)} do ${minuteToTime(data.to_minute)} odpovedou textom "A-${smsCode}". ` +
          `Zamietnite textom "N-${smsCode}".`;
        await sendSmsConfirmationRequest(club.phone, smsText);
      }
    }

    redirect(`/orders/${data.id}`);
  }

  const { data: court } = await supabase.from('courts').select('name').eq('id', data.court_id).single();
  await sendPaymentConfirmationEmail({ bookingReference: data.booking_reference, courtName: court?.name ?? '' });

  redirect(`/orders/${data.id}/result`);
}
