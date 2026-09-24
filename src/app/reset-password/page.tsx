import { PageHeader } from '@/components/ui/PageHeader';
import { updatePassword } from './actions';

export default async function ResetPasswordPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <PageHeader title="Nové heslo" />

      {searchParams.error && <div className="alert-danger mb-4">{searchParams.error}</div>}

      <form action={updatePassword} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm" htmlFor="password">
            Nové heslo (min. 8 znakov)
          </label>
          <input className="input" id="password" name="password" type="password" minLength={8} required />
        </div>
        <button className="btn w-full" type="submit">
          Zmeniť heslo
        </button>
      </form>
    </div>
  );
}
