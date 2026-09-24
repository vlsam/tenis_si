import { PageHeader } from '@/components/ui/PageHeader';
import { requestPasswordReset } from './actions';

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm">
      <PageHeader title="Obnova hesla" subtitle="Zadajte e-mail a pošleme vám odkaz na nastavenie nového hesla." />
      <form action={requestPasswordReset} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm" htmlFor="email">
            E-mail
          </label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <button className="btn w-full" type="submit">
          Odoslať
        </button>
      </form>
    </div>
  );
}
