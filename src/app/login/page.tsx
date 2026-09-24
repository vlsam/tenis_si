import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { safeNextPath } from '@/lib/safeRedirect';
import { login } from './actions';

export default async function LoginPage(
  props: {
    searchParams: Promise<{ error?: string; next?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <PageHeader title="Prihlásenie" />

      {searchParams.error && <div className="alert-danger mb-4">{searchParams.error}</div>}

      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={safeNextPath(searchParams.next)} />
        <div>
          <label className="mb-1 block text-sm" htmlFor="email">
            E-mail
          </label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="password">
            Heslo
          </label>
          <input className="input" id="password" name="password" type="password" required />
        </div>
        <button className="btn w-full" type="submit">
          Prihlásiť
        </button>
      </form>

      <div className="mt-4 flex justify-between text-sm">
        <Link href="/forgot-password">Zabudli ste heslo?</Link>
        <Link href="/signup">Registrácia</Link>
      </div>
    </div>
  );
}
