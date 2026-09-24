import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Footer() {
  const supabase = await createClient();
  const { data: club } = await supabase
    .from('club_settings')
    .select('name, address, town, postal, email, web')
    .eq('id', 1)
    .single();

  return (
    <footer className="mt-12 border-t border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm text-neutral-600 dark:text-neutral-400 sm:grid-cols-3">
        <div>
          <p className="mb-1 font-bold text-court">{club?.name ?? 'TK77 Skalica'}</p>
          <p>
            {club?.address}, {club?.postal} {club?.town}
          </p>
          {club?.email && (
            <p>
              <a className="hover:text-court" href={`mailto:${club.email}`}>
                {club.email}
              </a>
            </p>
          )}
        </div>

        <div>
          <p className="mb-1 font-semibold text-neutral-900 dark:text-neutral-50">Klub</p>
          <ul className="space-y-1">
            <li>
              <Link className="hover:text-court" href="/o-klube">
                O klube
              </Link>
            </li>
            <li>
              <Link className="hover:text-court" href="/cennik">
                Cenník
              </Link>
            </li>
            <li>
              <Link className="hover:text-court" href="/kontakt">
                Kontakt
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-1 font-semibold text-neutral-900 dark:text-neutral-50">Rezervácie</p>
          <ul className="space-y-1">
            <li>
              <Link className="hover:text-court" href="/courts">
                Rezervovať kurt
              </Link>
            </li>
            <li>
              <Link className="hover:text-court" href="/credit/topup">
                Dobiť kredit
              </Link>
            </li>
            <li>
              <a className="hover:text-court" href="https://www.facebook.com/Tk77Skalica" target="_blank" rel="noreferrer">
                Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-100 py-3 text-center text-xs text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
        © {new Date().getFullYear()} {club?.name ?? 'TK77 Skalica'}
      </div>
    </footer>
  );
}
