import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { signup } from './actions';

export default async function SignupPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <PageHeader title="Registrácia" />

      {searchParams.error && <div className="alert-danger mb-4">{searchParams.error}</div>}

      <form action={signup} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm" htmlFor="firstName">
            Meno
          </label>
          <input className="input" id="firstName" name="firstName" required />
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="lastName">
            Priezvisko
          </label>
          <input className="input" id="lastName" name="lastName" required />
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="email">
            E-mail
          </label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="password">
            Heslo (min. 8 znakov)
          </label>
          <input className="input" id="password" name="password" type="password" minLength={8} required />
        </div>
        <button className="btn w-full" type="submit">
          Registrovať
        </button>
      </form>

      <div className="mt-4 text-sm">
        Máš konto? <Link href="/login">Prihlás sa</Link>
      </div>
    </div>
  );
}
