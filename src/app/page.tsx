import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/ui/StatCard';

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: club }, { data: courts }] = await Promise.all([
    supabase.from('club_settings').select('name, description, town').eq('id', 1).single(),
    supabase.from('courts').select('type, surface, availability').eq('active', true)
  ]);

  const courtCount = courts?.length ?? 0;
  const surface = courts?.[0]?.surface ?? 'antuka';
  const courtType = courts?.[0]?.type ?? 'vonkajšie';

  const prices = (courts ?? []).flatMap(c =>
    (c.availability ?? []).flatMap((season: Record<string, Record<string, number>>) =>
      Object.values(season).flatMap(day => Object.values(day))
    )
  );
  const minHourly = prices.length > 0 ? Math.min(...prices) * 2 : null;

  return (
    <div className="space-y-14">
      <section className="relative left-1/2 w-screen -translate-x-1/2 bg-court px-4 py-16 text-center text-white">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{club?.name ?? 'TK77 Skalica'}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-green-50">
          {club?.description ??
            'Tenisový klub v Skalici - podpora talentov aj tenis pre širokú verejnosť.'}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/courts" className="btn !bg-white !text-court hover:!bg-green-50">
            Rezervovať kurt
          </Link>
          <Link href="/o-klube" className="btn-secondary !bg-transparent !text-white ring-1 ring-white hover:!bg-white/10">
            O klube
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-4 sm:grid-cols-4">
        {[
          { label: 'Kurtov', value: courtCount > 0 ? String(courtCount) : '7' },
          { label: 'Povrch', value: surface },
          { label: 'Typ kurtov', value: courtType },
          { label: 'Sezóna', value: 'Apríl - Október' }
        ].map(fact => (
          <StatCard key={fact.label} value={fact.value} label={fact.label} />
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4">
        <h2 className="mb-6 text-center text-2xl font-bold">Ako funguje rezervácia</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { step: '1', title: 'Zaregistrujte sa', text: 'Vytvorte si účet - trvá to menej ako minútu.' },
            {
              step: '2',
              title: 'Dobite si kredit',
              text: 'QR platbou z bankovej aplikácie. Kredit sa pripíše po potvrdení platby.'
            },
            {
              step: '3',
              title: 'Rezervujte kurt',
              text: 'Vyberte kurt a čas v online kalendári - kredit sa použije automaticky.'
            }
          ].map(item => (
            <div key={item.step} className="card">
              <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-court text-sm font-bold text-white">
                {item.step}
              </span>
              <h3 className="mb-1 font-semibold">{item.title}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.text}</p>
            </div>
          ))}
        </div>
        {minHourly !== null && (
          <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Prenájom kurtu už od <strong>{minHourly.toFixed(2)} €/hod</strong> - podrobnosti v{' '}
            <Link className="text-court underline" href="/cennik">
              cenníku
            </Link>
            .
          </p>
        )}
      </section>

      <section className="relative left-1/2 w-screen -translate-x-1/2 bg-neutral-100 px-4 py-10 text-center dark:bg-neutral-800">
        <h2 className="mb-2 text-xl font-bold">Sledujte nás</h2>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">Turnaje, tréningy a novinky z klubu nájdete na Facebooku.</p>
        <a
          className="btn"
          href="https://www.facebook.com/Tk77Skalica"
          target="_blank"
          rel="noreferrer"
        >
          TK77 Skalica na Facebooku
        </a>
      </section>
    </div>
  );
}
