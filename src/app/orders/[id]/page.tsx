import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDate, minuteToTime, ORDER_STATUS_LABELS } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Not just middleware.ts's job - see its comment for why every page under
  // an auth-required prefix re-checks this itself. `orders_select_own_or_admin`
  // (RLS) already stops an anonymous request from ever matching a row here,
  // so this is about a clean redirect instead of a bare 404, not data safety.
  if (!user) redirect(`/login?next=/orders/${params.id}`);

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, price, order_date, from_minute, to_minute, created_at, courts(name)')
    .eq('id', Number(params.id))
    .single();

  if (!order) {
    notFound();
  }

  const { data: club } = await supabase.from('club_settings').select('name, address, town').eq('id', 1).single();
  const court = Array.isArray(order.courts) ? order.courts[0] : order.courts;

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title={court?.name ?? ''} />
      <div className="card space-y-2">
        <p>Klub: {club?.name}</p>
        <p>
          Adresa: {club?.address}, {club?.town}
        </p>
        <p>Dátum: {formatDate(order.order_date)}</p>
        <p>
          Čas: {minuteToTime(order.from_minute)} - {minuteToTime(order.to_minute)}
        </p>
        <p>Cena: {order.price.toFixed(2)} €</p>
        <p>Stav: {ORDER_STATUS_LABELS[order.status] ?? order.status}</p>

        {order.status === 'new' && (
          <p className="alert-info">
            Kredit vo výške {order.price.toFixed(2)} € je zarezervovaný. Rezervácia čaká na potvrdenie klubom.
          </p>
        )}
      </div>
    </div>
  );
}
