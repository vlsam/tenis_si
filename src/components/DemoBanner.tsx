/**
 * Loud, unmissable "this is a test instance" banner on every page - shown by
 * default (fails toward over-labeling, not under-labeling). Set
 * NEXT_PUBLIC_DEMO_MODE=false once this runs against a real club with real
 * bookings/payments; until then this stays visible so nobody mistakes the
 * seeded demo accounts/bookings (see supabase/seed.sql) for a real customer's
 * data.
 */
export default function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'false') return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-400 px-4 py-2 text-center text-sm font-bold text-amber-950">
      ⚠ TESTOVACIA VERZIA - demo dáta, žiadne skutočné rezervácie ani platby
    </div>
  );
}
