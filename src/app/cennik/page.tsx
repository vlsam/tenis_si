import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { minuteToTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import type { Season } from '@/lib/types/database.types';

export default async function PricingPage() {
  const supabase = await createClient();
  const [{ data: club }, { data: courts }] = await Promise.all([
    supabase.from('club_settings').select('seasons, currency').eq('id', 1).single(),
    supabase.from('courts').select('availability').eq('active', true)
  ]);

  const seasons: Season[] = club?.seasons ?? [];
  const currency = club?.currency ?? 'EUR';

  const seasonSummaries = seasons.map((season, seasonIndex) => {
    const minutes: number[] = [];
    const prices: number[] = [];

    (courts ?? []).forEach(court => {
      const dayMap = court.availability?.[seasonIndex];
      if (!dayMap) return;
      Object.values(dayMap).forEach((slots: Record<string, number>) => {
        Object.entries(slots).forEach(([minuteStr, price]) => {
          minutes.push(Number(minuteStr));
          prices.push(price);
        });
      });
    });

    return {
      season,
      opensAt: minutes.length > 0 ? Math.min(...minutes) : null,
      closesAt: minutes.length > 0 ? Math.max(...minutes) + 30 : null,
      minHourly: prices.length > 0 ? Math.min(...prices) * 2 : null,
      maxHourly: prices.length > 0 ? Math.max(...prices) * 2 : null
    };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Cenník"
        subtitle="Prenájom kurtu sa platí z vášho kreditu, ktorý si vopred dobijete QR platbou. Cena sa počíta presne podľa zvolenej dĺžky rezervácie."
      />

      {seasonSummaries.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Cenník momentálne nie je k dispozícii.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-neutral-200 bg-white text-sm dark:border-neutral-700 dark:bg-neutral-800">
          <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            <tr>
              <th className="p-3">Sezóna</th>
              <th className="p-3">Otváracie hodiny</th>
              <th className="p-3">Cena / hodina</th>
            </tr>
          </thead>
          <tbody>
            {seasonSummaries.map(({ season, opensAt, closesAt, minHourly, maxHourly }, i) => (
              <tr key={i} className="border-t border-neutral-100 dark:border-neutral-700">
                <td className="p-3">
                  {season.from} - {season.to}
                </td>
                <td className="p-3">
                  {opensAt !== null && closesAt !== null ? `${minuteToTime(opensAt)} - ${minuteToTime(closesAt)}` : '-'}
                </td>
                <td className="p-3 font-semibold text-court">
                  {minHourly !== null
                    ? minHourly === maxHourly
                      ? `${minHourly.toFixed(2)} ${currency}`
                      : `${minHourly.toFixed(2)} - ${maxHourly?.toFixed(2)} ${currency}`
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="card space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
        <h2 className="font-semibold text-neutral-900 dark:text-neutral-50">Ako platba funguje</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Dobijete si kredit QR platbou z bankovej aplikácie (5 - 1000 €).</li>
          <li>Po potvrdení platby sa kredit pripíše na váš účet.</li>
          <li>Pri rezervácii kurtu sa presná cena termínu automaticky odpočíta z kreditu.</li>
          <li>Rezerváciu je možné vytvoriť len vtedy, keď kredit pokrýva celú cenu termínu.</li>
        </ol>
        <Link className="inline-block font-semibold text-court underline" href="/credit/topup">
          Dobiť kredit
        </Link>
      </div>
    </div>
  );
}
