import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: club } = await supabase
    .from('club_settings')
    .select('name, address, town, postal, email, web')
    .eq('id', 1)
    .single();

  const mapQuery = encodeURIComponent(`${club?.address ?? ''}, ${club?.town ?? ''}, Slovensko`);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="Kontakt" subtitle={club?.name} />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card space-y-2 text-sm">
          <p>
            <span className="font-semibold">Adresa: </span>
            {club?.address}, {club?.postal} {club?.town}
          </p>
          {club?.email && (
            <p>
              <span className="font-semibold">E-mail: </span>
              <a className="text-court underline" href={`mailto:${club.email}`}>
                {club.email}
              </a>
            </p>
          )}
          <p>
            <span className="font-semibold">Facebook: </span>
            <a
              className="text-court underline"
              href="https://www.facebook.com/Tk77Skalica"
              target="_blank"
              rel="noreferrer"
            >
              facebook.com/Tk77Skalica
            </a>
          </p>
          <p className="pt-2 text-neutral-500 dark:text-neutral-400">
            Rezervácie kurtov prebiehajú online - pozrite si{' '}
            <a className="text-court underline" href="/courts">
              voľné termíny
            </a>
            .
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
          <iframe
            title="Mapa - poloha klubu"
            className="h-64 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
          />
        </div>
      </div>
    </div>
  );
}
