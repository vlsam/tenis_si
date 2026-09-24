import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate, minuteToTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function OrderResultPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // See orders/[id]/page.tsx - RLS already blocks the underlying data for an
  // anonymous request, this is just for a clean redirect instead of a 404.
  if (!user) redirect(`/login?next=/orders/${params.id}/result`);

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, price, order_date, from_minute, to_minute, courts(name)')
    .eq('id', Number(params.id))
    .single();

  if (!order) {
    notFound();
  }

  const court = Array.isArray(order.courts) ? order.courts[0] : order.courts;

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-4 text-5xl text-court">✓</div>
      <PageHeader title={court?.name ?? ''} />
      <p className="mb-4 text-neutral-600 dark:text-neutral-400">
        {formatDate(order.order_date)}, {minuteToTime(order.from_minute)} - {minuteToTime(order.to_minute)} -{' '}
        {order.price.toFixed(2)} €
      </p>
      <p className="alert-success mb-4">Vaša objednávka bola zaplatená.</p>
      <Link href="/courts" className="btn">
        Pokračovať na web
      </Link>
    </div>
  );
}
