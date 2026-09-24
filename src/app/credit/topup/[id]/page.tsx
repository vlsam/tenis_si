import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generateTopUpQrDataUrl } from '@/lib/paybysquare';
import { PageHeader } from '@/components/ui/PageHeader';
import { markTopUpPaid } from '../actions';

export default async function TopUpStatusPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Not just middleware.ts's job - see its comment. RLS already blocks an
  // anonymous request from matching a row below either way.
  if (!user) redirect(`/login?next=/credit/topup/${params.id}`);

  // RLS (`credit_transactions_select_own_or_admin`) means this query simply
  // returns nothing if the id belongs to someone else - the same IDOR
  // protection the other two variants had to implement by hand as an
  // `ownsTopUp` policy is here just a property of the database.
  const { data: transaction } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('id', Number(params.id))
    .single();

  if (!transaction || transaction.type !== 'topup' || transaction.payment_method !== 'bank_transfer') {
    notFound();
  }

  if (transaction.status === 'confirmed') {
    return (
      <div className="mx-auto max-w-md">
        <PageHeader title="Dobitie kreditu" />
        <div className="alert-success">Platba bola potvrdená, kredit je pripísaný na vašom účte.</div>
      </div>
    );
  }

  const iban = process.env.BANK_IBAN;
  const { data: club } = await supabase.from('club_settings').select('name').eq('id', 1).single();
  let qrDataUrl: string | null = null;
  let qrError = false;

  if (iban) {
    try {
      qrDataUrl = await generateTopUpQrDataUrl({
        transactionId: transaction.id,
        amount: transaction.amount,
        variableSymbol: transaction.variable_symbol ?? String(transaction.id),
        iban,
        beneficiaryName: club?.name ?? 'TK77 Skalica'
      });
    } catch {
      qrError = true;
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        title="Dobitie kreditu"
        subtitle="Naskenujte QR kód vo svojej bankovej aplikácii a odošlite platbu. Kredit sa pripíše po tom, čo administrátor platbu ručne potvrdí oproti bankovému výpisu - môže to trvať aj niekoľko hodín."
      />

      {qrDataUrl ? (
        <div className="mb-4 flex justify-center">
          {/* Kept on a solid white card even in dark mode - inverting a QR
              code's colors risks it not scanning in some banking apps. */}
          <div className="rounded-lg bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- small, short-lived data: URL, not worth next/image */}
            <img src={qrDataUrl} alt="QR platba" width={300} height={300} />
          </div>
        </div>
      ) : (
        <div className="alert-danger mb-4">
          {qrError ? 'QR kód sa nepodarilo vygenerovať' : 'QR platba nie je nakonfigurovaná'}, platbu vykonajte
          manuálne podľa údajov nižšie.
        </div>
      )}

      <table className="mb-4 w-full text-sm">
        <tbody>
          <tr>
            <th className="py-1 text-left">Suma</th>
            <td>{transaction.amount.toFixed(2)} €</td>
          </tr>
          <tr>
            <th className="py-1 text-left">Variabilný symbol</th>
            <td>{transaction.variable_symbol}</td>
          </tr>
          <tr>
            <th className="py-1 text-left">IBAN</th>
            <td>{iban ?? '-'}</td>
          </tr>
        </tbody>
      </table>

      {transaction.user_claimed_paid_at ? (
        <div className="alert-info">Označili ste túto platbu ako uhradenú, čaká na potvrdenie administrátorom.</div>
      ) : (
        <form action={markTopUpPaid}>
          <input type="hidden" name="transactionId" value={transaction.id} />
          <button className="btn" type="submit">
            Zaplatil/a som
          </button>
        </form>
      )}
    </div>
  );
}
