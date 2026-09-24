import type { CourtAvailability, Season } from '@/lib/types/database.types';

const DAY_NAMES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const SK_WEEKDAY_LABELS = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa'];

/**
 * Display-only helper: which pricing season (index into `seasons`/
 * `availability`) applies to a given date. This mirrors
 * `_season_matches()` in supabase/migrations/0001_init.sql - kept in sync
 * by hand since it can't share code with the SQL function. It's fine for
 * this copy to be "best effort": the real, authoritative price/availability
 * check happens server-side in the `create_order` Postgres function at
 * booking time, so a UI bug here can at worst show a stale/wrong slot list,
 * never let someone book something they shouldn't.
 */
function seasonMatches(date: Date, from: string, to: string): boolean {
  const year = date.getFullYear();
  const [fromDay, fromMonth] = from.split('.').map(Number);
  const [toDay, toMonth] = to.split('.').map(Number);
  let seasonFrom = new Date(year, (fromMonth ?? 1) - 1, fromDay ?? 1);
  let seasonTo = new Date(year, (toMonth ?? 1) - 1, toDay ?? 1);
  let checkDate = date;

  if (seasonFrom > seasonTo) {
    if (checkDate <= seasonFrom) {
      checkDate = new Date(checkDate.getFullYear() + 1, checkDate.getMonth(), checkDate.getDate());
    }
    seasonTo = new Date(seasonTo.getFullYear() + 1, seasonTo.getMonth(), seasonTo.getDate());
  }

  return seasonFrom <= checkDate && checkDate <= seasonTo;
}

export function findSeasonIndexForDate(seasons: Season[], date: Date): number {
  return seasons.findIndex(season => seasonMatches(date, season.from, season.to));
}

export function dayNameForDate(date: Date): string {
  const isoDow = (date.getDay() + 6) % 7; // 0=mon..6=sun
  return DAY_NAMES[isoDow]!;
}

export function weekdayLabelSk(date: Date): string {
  const isoDow = (date.getDay() + 6) % 7; // 0=mon..6=sun
  return SK_WEEKDAY_LABELS[isoDow]!;
}

export interface DaySlot {
  minute: number;
  price: number;
  booked: boolean;
}

/**
 * Returns every 30-min slot the court offers on `date` (both free and
 * already-booked), so a grid view can render booked cells as disabled
 * instead of just omitting them.
 */
export function dayScheduleForDate(
  availability: CourtAvailability,
  seasons: Season[],
  date: Date,
  bookedRanges: { from_minute: number; to_minute: number }[]
): DaySlot[] {
  const seasonIndex = findSeasonIndexForDate(seasons, date);
  if (seasonIndex === -1) return [];

  const dayAvailability = availability[seasonIndex]?.[dayNameForDate(date)];
  if (!dayAvailability) return [];

  const isBooked = (minute: number) =>
    bookedRanges.some(range => minute >= range.from_minute && minute < range.to_minute);

  return Object.entries(dayAvailability)
    .map(([minuteStr, price]) => ({ minute: Number(minuteStr), price, booked: isBooked(Number(minuteStr)) }))
    .filter(slot => !Number.isNaN(slot.price))
    .sort((a, b) => a.minute - b.minute);
}
