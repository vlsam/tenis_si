import { createClient } from '@/lib/supabase/server';
import { formatDate, minuteToTime, ORDER_STATUS_LABELS } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, TableHead, Th, Tr, Td } from '@/components/ui/Table';
import { cancelOrder } from './actions';

export default async function AdminOrdersPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, order_date, from_minute, to_minute, price, courts(name), profiles(first_name, last_name, email)')
    .order('order_date', { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader title="Objednávky" />

      {searchParams.error && <div className="alert-danger mb-4">{searchParams.error}</div>}

      <Table>
        <TableHead>
          <Th>Dátum</Th>
          <Th>Kurt</Th>
          <Th>Používateľ</Th>
          <Th>Cena</Th>
          <Th>Stav</Th>
          <Th />
        </TableHead>
        <tbody>
          {orders?.map(order => {
            const court = Array.isArray(order.courts) ? order.courts[0] : order.courts;
            const orderUser = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
            const canCancel = ['new', 'confirmed', 'paid'].includes(order.status);
            return (
              <Tr key={order.id}>
                <Td>
                  {formatDate(order.order_date)} {minuteToTime(order.from_minute)}-{minuteToTime(order.to_minute)}
                </Td>
                <Td>{court?.name}</Td>
                <Td>
                  {orderUser?.first_name} {orderUser?.last_name} ({orderUser?.email})
                </Td>
                <Td>{order.price.toFixed(2)} €</Td>
                <Td>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Td>
                <Td>
                  {canCancel && (
                    <form action={cancelOrder}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button className="btn !px-2 !py-1 text-xs" type="submit">
                        Zrušiť{order.status === 'paid' ? ' + refund' : ''}
                      </button>
                    </form>
                  )}
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
