import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, TableHead, Th, Tr, Td } from '@/components/ui/Table';
import { confirmTopUp } from '../actions';

export default async function AdminPendingTopUpsPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select(
      // `profiles!credit_transactions_user_id_fkey` disambiguates which FK to
      // embed through - credit_transactions has two (user_id, created_by),
      // so plain `profiles(...)` fails with PGRST201 ("more than one
      // relationship was found") instead of the rows just being empty.
      'id, amount, variable_symbol, created_at, user_claimed_paid_at, profiles!credit_transactions_user_id_fkey(id, first_name, last_name)'
    )
    .eq('type', 'topup')
    .eq('payment_method', 'bank_transfer')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  return (
    <div>
      <PageHeader title="Čakajúce dobitia kreditu" />

      {searchParams.error && <div className="alert-danger mb-4">{searchParams.error}</div>}

      {transactions?.length === 0 && <p>Žiadne čakajúce požiadavky.</p>}

      <Table>
        <TableHead>
          <Th>Vytvorené</Th>
          <Th>Používateľ</Th>
          <Th>Suma</Th>
          <Th>Var. symbol</Th>
          <Th>Používateľ potvrdil</Th>
          <Th />
        </TableHead>
        <tbody>
          {transactions?.map(t => {
            const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
            return (
              <Tr key={t.id}>
                <Td>{formatDateTime(t.created_at)}</Td>
                <Td>
                  {profile?.first_name} {profile?.last_name}
                </Td>
                <Td>{t.amount.toFixed(2)} €</Td>
                <Td>{t.variable_symbol}</Td>
                <Td>{t.user_claimed_paid_at ? formatDateTime(t.user_claimed_paid_at) : '-'}</Td>
                <Td>
                  <form action={confirmTopUp}>
                    <input type="hidden" name="transactionId" value={t.id} />
                    <button className="btn !px-2 !py-1 text-xs" type="submit">
                      Potvrdiť prijatie platby
                    </button>
                  </form>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
