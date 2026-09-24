import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: club } = await supabase.from('club_settings').select('name, description, town').eq('id', 1).single();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="O klube" subtitle={club?.description} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="mb-1 font-semibold">Poslanie</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Snahou klubu {club?.name ?? 'TK77 Skalica'} nie je iba podpora a výber talentov, ale tiež priblíženie
            tenisu širokej verejnosti - deťom, dospelým aj rekreačným hráčom.
          </p>
        </div>
        <div className="card">
          <h2 className="mb-1 font-semibold">Areál</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            7 vonkajších antukových kurtov v Skalici, so šatňami a bufetom priamo v areáli. Sezóna beží od apríla do
            októbra, mimo sezóny sa venujeme tréningom mládeže a organizácii turnajov.
          </p>
        </div>
        <div className="card">
          <h2 className="mb-1 font-semibold">História</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Klub pôsobí v Skalici od roku 1998.</p>
        </div>
        <div className="card">
          <h2 className="mb-1 font-semibold">Pre koho</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Tréningy pre deti a mládež, aj voľný prenájom kurtov pre verejnosť a firmy.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-court bg-green-50 p-4 text-sm dark:bg-green-950">
        Chcete si zahrať? <Link className="font-semibold text-court underline" href="/courts">Pozrite si voľné termíny a rezervujte kurt</Link>.
      </div>
    </div>
  );
}
