import { createAdminClient } from '@/lib/supabase/admin';
import { formatDate, minuteToTime, ORDER_STATUS_LABELS } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { decideOrder } from './actions';

/**
 * Where the club's e-mail confirm/reject link (see orders/actions.ts) now
 * points, instead of a GET route that acted immediately. A GET here only
 * shows what's about to happen - the action itself needs an actual button
 * click, which POSTs to decideOrder(). This matters because a GET that
 * mutates state (and, on reject, now refunds credit) is exactly what
 * corporate email link-scanners/prefetchers are known to trigger without a
 * human ever clicking anything.
 *
 * Deliberately outside /orders (proxy.ts's AUTH_REQUIRED_PREFIXES) - the
 * club opens this unauthenticated, straight from their inbox.
 */
export default async function ConfirmOrderPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string; token?: string; action?: string; done?: string; status?: string; error?: string }>;
}) {
  const params = await searchParams;

  if (params.done) {
    return (
      <div className="mx-auto max-w-md text-center">
        <PageHeader title={`Rezervácia #${params.id}`} />
        <p className="alert-success">
          Nový stav: <strong>{ORDER_STATUS_LABELS[params.status ?? ''] ?? params.status}</strong>.
        </p>
      </div>
    );
  }

  const id = Number(params.id);
  const token = params.token;
  const action = params.action;

  if (!id || !token || (action !== 'confirm' && action !== 'reject')) {
    return (
      <div className="mx-auto max-w-md text-center">
        <PageHeader title="Neplatný odkaz" />
        <p className="alert-danger">Odkazu chýbajú potrebné údaje.</p>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select(
      'id, token, order_date, from_minute, to_minute, price, booking_reference, courts(name), profiles(first_name, last_name, email)'
    )
    .eq('id', id)
    .eq('status', 'new')
    .single();

  if (!order || order.token !== token) {
    return (
      <div className="mx-auto max-w-md text-center">
        <PageHeader title="Odkaz už nie je platný" />
        <p className="alert-info">Táto rezervácia už bola spracovaná, alebo odkaz nie je správny.</p>
      </div>
    );
  }

  const court = Array.isArray(order.courts) ? order.courts[0] : order.courts;
  const customer = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
  const isConfirm = action === 'confirm';

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title={isConfirm ? 'Potvrdiť rezerváciu?' : 'Zamietnuť rezerváciu?'} />

      {params.error && <div className="alert-danger mb-4">{params.error}</div>}

      <div className="card mb-4 space-y-1 text-sm">
        <p>
          <span className="font-semibold">Rezervácia:</span> #{order.booking_reference}
        </p>
        <p>
          <span className="font-semibold">Kurt:</span> {court?.name}
        </p>
        <p>
          <span className="font-semibold">Termín:</span> {formatDate(order.order_date)},{' '}
          {minuteToTime(order.from_minute)}–{minuteToTime(order.to_minute)}
        </p>
        <p>
          <span className="font-semibold">Zákazník:</span> {customer?.first_name} {customer?.last_name} (
          {customer?.email})
        </p>
        <p>
          <span className="font-semibold">Cena:</span> {order.price.toFixed(2)} €
        </p>
      </div>

      {!isConfirm && (
        <p className="alert-info mb-4">Zamietnutím sa zákazníkovi vráti {order.price.toFixed(2)} € kreditu späť.</p>
      )}

      <form action={decideOrder}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="action" value={action} />
        <button type="submit" className={isConfirm ? 'btn w-full' : 'btn w-full !bg-red-600 hover:!bg-red-700'}>
          {isConfirm ? 'Potvrdiť rezerváciu' : 'Zamietnuť a vrátiť kredit'}
        </button>
      </form>
    </div>
  );
}
