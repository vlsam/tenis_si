export function minuteToTime(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${h}:${m < 10 ? '0' : ''}${m}`;
}

export function formatDate(dateIso: string): string {
  const [year, month, day] = dateIso.split('-');
  return `${day}.${month}.${year}`;
}

/**
 * `date.toISOString().slice(0, 10)` looks equivalent but isn't: it converts
 * to UTC first, so for a Date meant to represent a LOCAL calendar day (e.g.
 * `new Date()` with hours zeroed, or a date built from `new
 * Date('YYYY-MM-DDT00:00:00')`), it silently returns the wrong day whenever
 * the local timezone is ahead of UTC and it's early enough in the day locally
 * - "today" in Central Europe could resolve to "yesterday" in UTC. Use
 * getFullYear()/getMonth()/getDate() (local) instead of toISOString() (UTC).
 */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('sk-SK');
}

/**
 * Mirrors DateHelper.isTimeInInterval from the Sails variants - is the
 * current time within an "HH:mm"-"HH:mm" window, with overnight wraparound
 * support (e.g. "22:00"-"06:00"). Used to decide whether it's an OK time to
 * SMS the club about a new booking.
 */
export function isNowInTimeInterval(from: string, to: string): boolean {
  const parse = (value: string): number | null => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  };

  const fromMinutes = parse(from);
  const toMinutes = parse(to);
  if (fromMinutes === null || toMinutes === null) return false;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (fromMinutes <= toMinutes) {
    return nowMinutes >= fromMinutes && nowMinutes <= toMinutes;
  }
  // Wraps past midnight (e.g. 22:00 - 06:00).
  return nowMinutes >= fromMinutes || nowMinutes <= toMinutes;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: 'nová',
  confirmed: 'potvrdená',
  rejected: 'zamietnutá',
  expired: 'expirovaná',
  canceled: 'zrušená',
  paid: 'zaplatená',
  closed: 'ukončená'
};
