import { createClient } from '@/lib/supabase/server';
import { dayScheduleForDate, weekdayLabelSk } from '@/lib/availability';
import ReservationGrid, { type CourtRow } from '@/components/ReservationGrid';
import { toIsoDate } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';

const DAYS_AHEAD_MAX = 30;

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export default async function CourtsPage(props: { searchParams: Promise<{ date?: string; error?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = toIsoDate(today);
  const maxIso = addDays(todayIso, DAYS_AHEAD_MAX);

  let dateIso = searchParams.date ?? todayIso;
  if (dateIso < todayIso) dateIso = todayIso;
  if (dateIso > maxIso) dateIso = maxIso;
  const date = new Date(dateIso + 'T00:00:00');

  const [{ data: courts, error: courtsError }, { data: club }] = await Promise.all([
    supabase.from('courts').select('id, name, type, surface, availability').eq('active', true).order('name'),
    supabase.from('club_settings').select('seasons, name, address, town').eq('id', 1).single()
  ]);

  if (courtsError) {
    return <div className="alert-danger">Kurty sa nepodarilo načítať.</div>;
  }

  // Public occupancy-only view, not the `orders` table directly - RLS on
  // `orders` scopes SELECT to the caller's own rows (or admin), so querying
  // it here would only ever show the current user's own bookings as
  // "obsadené", never anyone else's (see 0004's migration comment).
  const courtIds = (courts ?? []).map(c => c.id);
  const { data: existingOrders } =
    courtIds.length > 0
      ? await supabase
          .from('court_booked_slots')
          .select('court_id, from_minute, to_minute')
          .in('court_id', courtIds)
          .eq('order_date', dateIso)
      : { data: [] };

  const {
    data: { user }
  } = await supabase.auth.getUser();

  let creditBalance: number | null = null;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('credit_balance').eq('id', user.id).single();
    creditBalance = profile?.credit_balance ?? 0;
  }

  const courtRows: CourtRow[] = (courts ?? []).map(court => {
    const bookedRanges = (existingOrders ?? [])
      .filter(o => o.court_id === court.id)
      .map(o => ({ from_minute: o.from_minute, to_minute: o.to_minute }));
    return {
      id: court.id,
      name: court.name,
      type: court.type,
      surface: court.surface,
      slots: dayScheduleForDate(court.availability, club?.seasons ?? [], date, bookedRanges)
    };
  });

  const allMinutes = courtRows.flatMap(c => c.slots.map(s => s.minute));
  const minMinute = allMinutes.length > 0 ? Math.min(...allMinutes) : 0;
  const maxMinute = allMinutes.length > 0 ? Math.max(...allMinutes) + 30 : 0;

  return (
    <div>
      <PageHeader
        title="Rezervácia kurtov"
        subtitle={club?.name ? `${club.name} - ${club.address}, ${club.town}` : undefined}
      />

      {searchParams.error && <div className="alert-danger mb-4">{searchParams.error}</div>}

      {!user && (
        <div className="alert-info mb-4">
          Dostupnosť kurtov si môže pozrieť ktokoľvek. Pre rezerváciu sa musíte{' '}
          <a href="/login?next=/courts">prihlásiť</a> alebo <a href="/signup">zaregistrovať</a> a mať dobitý kredit.
        </div>
      )}

      {user && creditBalance !== null && creditBalance <= 0 && (
        <div className="alert-info mb-4">
          Váš kredit je <strong>{creditBalance.toFixed(2)} €</strong>. Rezervovať kurt môžete až po{' '}
          <a href="/credit/topup">dobití kreditu</a> - do tej doby vidíte len obsadenosť kurtov.
        </div>
      )}

      {user && creditBalance !== null && creditBalance > 0 && (
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          Váš kredit: <strong>{creditBalance.toFixed(2)} €</strong> · <a href="/credit/topup">dobiť kredit</a>
        </p>
      )}

      <ReservationGrid
        dateIso={dateIso}
        dayLabel={weekdayLabelSk(date)}
        courts={courtRows}
        minMinute={minMinute}
        maxMinute={maxMinute}
        loggedIn={!!user}
        creditBalance={creditBalance}
        minDateIso={todayIso}
        maxDateIso={maxIso}
      />
    </div>
  );
}
