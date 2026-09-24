import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, TableHead, Th, Tr, Td } from '@/components/ui/Table';
import { grantCashCredit } from './actions';

export default async function AdminUserDetailPage(
  props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const supabase = await createClient();

  const { data: user } = await supabase.from('profiles').select('*').eq('id', params.id).single();
  if (!user) {
    notFound();
  }

  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('id, amount, type, payment_method, status, note, created_at')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title={`${user.first_name} ${user.last_name}`}
        subtitle={
          <>
            {user.email} - Zostatok: <strong>{user.credit_balance.toFixed(2)} €</strong>
          </>
        }
      />

      {searchParams.error && <div className="alert-danger mb-4">{searchParams.error}</div>}

      <h2 className="mb-2 text-xl font-semibold">Pripísať hotovostný kredit</h2>
      <form action={grantCashCredit} className="card mb-8 flex flex-wrap items-end gap-3">
        <input type="hidden" name="userId" value={user.id} />
        <div>
          <label className="mb-1 block text-sm" htmlFor="amount">
            Suma (€)
          </label>
          <input className="input" id="amount" name="amount" type="number" step="0.01" min="0.01" required />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm" htmlFor="note">
            Poznámka
          </label>
          <input
            className="input"
            id="note"
            name="note"
            placeholder="napr. hotovosť prevzatá na recepcii 20.1.2026"
            required
          />
        </div>
        <button className="btn" type="submit">
          Pripísať
        </button>
      </form>

      <h2 className="mb-2 text-xl font-semibold">História transakcií</h2>
      <Table>
        <TableHead>
          <Th>Dátum</Th>
          <Th>Typ</Th>
          <Th>Spôsob</Th>
          <Th>Suma</Th>
          <Th>Stav</Th>
          <Th>Poznámka</Th>
        </TableHead>
        <tbody>
          {transactions?.map(t => (
            <Tr key={t.id}>
              <Td>{formatDateTime(t.created_at)}</Td>
              <Td>{t.type}</Td>
              <Td>{t.payment_method ?? '-'}</Td>
              <Td>
                {t.amount > 0 ? '+' : ''}
                {t.amount.toFixed(2)} €
              </Td>
              <Td>{t.status}</Td>
              <Td>{t.note}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
