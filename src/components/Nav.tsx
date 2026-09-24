import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let creditBalance: number | null = null;
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('credit_balance, is_admin')
      .eq('id', user.id)
      .single();
    creditBalance = profile?.credit_balance ?? 0;
    isAdmin = profile?.is_admin ?? false;
  }

  return (
    <nav className="border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-court">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-court text-xs text-white">77</span>
          TK77 Skalica
        </Link>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link href="/o-klube">O klube</Link>
          <Link href="/courts" className="font-medium text-court">
            Rezervácia kurtov
          </Link>
          <Link href="/cennik">Cenník</Link>
          <Link href="/kontakt">Kontakt</Link>

          {user ? (
            <>
              <Link href="/credit/topup">Kredit: {creditBalance?.toFixed(2)} €</Link>
              {isAdmin && <Link href="/admin">Administrácia</Link>}
              <Link href="/profile">Profil</Link>
              <form action="/auth/signout" method="post">
                <button className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50" type="submit">
                  Odhlásiť
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Prihlásenie</Link>
              <Link href="/signup" className="btn !px-3 !py-1.5">
                Registrácia
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
