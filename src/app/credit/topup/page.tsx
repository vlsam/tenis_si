import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, TableHead, Th, Tr, Td } from '@/components/ui/Table';
import { requestTopUp } from './actions';

export default async function TopUpFormPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Not just middleware.ts's job - see its comment for why every page
  // under an auth-required prefix re-checks this itself.
  if (!user) redirect('/login?next=/credit/topup');

  const { data: profile } = await supabase.from('profiles').select('credit_balance').eq('id', user.id).single();
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('id, amount, type, payment_method, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Dobiť kredit"
        subtitle={
          <>
            Aktuálny zostatok: <strong>{profile?.credit_balance.toFixed(2)} €</strong>
          </>
        }
      />

      {searchParams.error && <div className="alert-danger mb-4">{searchParams.error}</div>}

      <form action={requestTopUp} className="card mb-8 space-y-3">
        <div>
          <label className="mb-1 block text-sm" htmlFor="amount">
            Suma (5 - 1000 €)
          </label>
          <input className="input" id="amount" name="amount" type="number" step="0.01" min="5" max="1000" required />
        </div>
        <button className="btn" type="submit">
          Vygenerovať QR platbu
        </button>
      </form>

      {transactions && transactions.length > 0 && (
        <>
          <h2 className="mb-2 text-xl font-semibold">História</h2>
          <Table>
            <TableHead>
              <Th>Dátum</Th>
              <Th>Typ</Th>
              <Th>Suma</Th>
              <Th>Stav</Th>
            </TableHead>
            <tbody>
              {transactions.map(t => (
                <Tr key={t.id}>
                  <Td>{formatDateTime(t.created_at)}</Td>
                  <Td>{t.type}</Td>
                  <Td>
                    {t.amount > 0 ? '+' : ''}
                    {t.amount.toFixed(2)} €
                  </Td>
                  <Td>
                    {t.type === 'topup' && t.payment_method === 'bank_transfer' && t.status === 'pending' ? (
                      <Link href={`/credit/topup/${t.id}`}>čaká na potvrdenie</Link>
                    ) : (
                      t.status
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}
