'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DaySlot } from '@/lib/availability';
import { formatDate, minuteToTime, toIsoDate } from '@/lib/format';
import { createOrder } from '@/app/orders/actions';

const SLOT_MINUTES = 30;

export interface CourtRow {
  id: number;
  name: string;
  type: string | null;
  surface: string | null;
  slots: DaySlot[];
}

interface Selection {
  courtId: number;
  start: number;
  end: number; // exclusive
}

interface Anchor {
  courtId: number;
  minute: number;
}

function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export default function ReservationGrid({
  dateIso,
  dayLabel,
  courts,
  minMinute,
  maxMinute,
  loggedIn,
  creditBalance,
  minDateIso,
  maxDateIso
}: {
  dateIso: string;
  dayLabel: string;
  courts: CourtRow[];
  minMinute: number;
  maxMinute: number;
  loggedIn: boolean;
  creditBalance: number | null;
  minDateIso: string;
  maxDateIso: string;
}) {
  const router = useRouter();
  // Read-only occupancy calendar unless logged in with usable credit - the
  // club requires credit to already cover a booking before it can be made.
  const canSelect = loggedIn && (creditBalance ?? 0) > 0;
  const [selection, setSelection] = useState<Selection | null>(null);
  const anchorRef = useRef<Anchor | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    setSelection(null);
    anchorRef.current = null;
  }, [dateIso]);

  useEffect(() => {
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const slotMaps = useMemo(
    () =>
      courts.map(court => {
        const map = new Map<number, DaySlot>();
        court.slots.forEach(slot => map.set(slot.minute, slot));
        return map;
      }),
    [courts]
  );

  const columns = useMemo(() => {
    const cols: number[] = [];
    for (let m = minMinute; m < maxMinute; m += SLOT_MINUTES) cols.push(m);
    return cols;
  }, [minMinute, maxMinute]);

  function goToDate(nextIso: string) {
    router.push(`/courts?date=${nextIso}`);
  }

  function shiftDate(days: number) {
    const d = new Date(dateIso + 'T00:00:00');
    d.setDate(d.getDate() + days);
    goToDate(toIsoDate(d));
  }

  function extendFromAnchor(courtId: number, anchorMinute: number, targetMinute: number) {
    const map = slotMaps[courts.findIndex(c => c.id === courtId)]!;
    const lo = Math.min(anchorMinute, targetMinute);
    const hi = Math.max(anchorMinute, targetMinute);

    let start = anchorMinute;
    for (let m = anchorMinute - SLOT_MINUTES; m >= lo; m -= SLOT_MINUTES) {
      const s = map.get(m);
      if (!s || s.booked) break;
      start = m;
    }

    let end = anchorMinute + SLOT_MINUTES;
    for (let m = anchorMinute + SLOT_MINUTES; m < hi + SLOT_MINUTES; m += SLOT_MINUTES) {
      const s = map.get(m);
      if (!s || s.booked) break;
      end = m + SLOT_MINUTES;
    }

    setSelection({ courtId, start, end });
  }

  function handleCellDown(courtId: number, minute: number, slot: DaySlot | undefined) {
    if (!canSelect || !slot || slot.booked) return;
    draggingRef.current = true;

    if (anchorRef.current && anchorRef.current.courtId === courtId) {
      extendFromAnchor(courtId, anchorRef.current.minute, minute);
    } else {
      anchorRef.current = { courtId, minute };
      setSelection({ courtId, start: minute, end: minute + SLOT_MINUTES });
    }
  }

  function handleCellEnter(courtId: number, minute: number) {
    if (!draggingRef.current || !anchorRef.current || anchorRef.current.courtId !== courtId) return;
    extendFromAnchor(courtId, anchorRef.current.minute, minute);
  }

  function clearSelection() {
    setSelection(null);
    anchorRef.current = null;
  }

  const selectedCourt = selection ? courts.find(c => c.id === selection.courtId) ?? null : null;
  const selectedPrice =
    selection && selectedCourt
      ? selectedCourt.slots
          .filter(s => s.minute >= selection.start && s.minute < selection.end)
          .reduce((sum, s) => sum + s.price, 0)
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <button
          type="button"
          className="btn-secondary !px-3 !py-1.5 text-sm"
          disabled={dateIso <= minDateIso}
          onClick={() => shiftDate(-1)}
        >
          ← Predchádzajúci deň
        </button>

        <div className="flex items-center gap-3">
          <span className="font-semibold">
            {dayLabel} {formatDate(dateIso)}
          </span>
          <input
            type="date"
            className="input !w-auto py-1"
            value={dateIso}
            min={minDateIso}
            max={maxDateIso}
            onChange={e => e.target.value && goToDate(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn-secondary !px-3 !py-1.5 text-sm"
          disabled={dateIso >= maxDateIso}
          onClick={() => shiftDate(1)}
        >
          Nasledujúci deň →
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800" /> Voľné
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-court" /> Zvolený čas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-neutral-300 dark:bg-neutral-600" /> Obsadené
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-neutral-100 dark:bg-neutral-800" /> Mimo prevádzky
        </span>
      </div>

      {columns.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
          Na tento deň nie sú k dispozícii žiadne kurty.
        </p>
      ) : (
        <div className="select-none overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div
            className="grid"
            style={{ gridTemplateColumns: `160px repeat(${columns.length}, 44px)`, minWidth: 160 + columns.length * 44 }}
          >
            <div className="sticky left-0 z-10 border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
            {columns.map(minute => (
              <div
                key={minute}
                className="relative border-b border-l border-neutral-100 pb-1 text-[11px] text-neutral-400 dark:border-neutral-700 dark:text-neutral-500"
              >
                {minute % 60 === 0 && <span className="absolute -left-2 bottom-1">{minuteToTime(minute)}</span>}
              </div>
            ))}

            {courts.map((court, courtIndex) => {
              const map = slotMaps[courtIndex]!;
              return (
                <Fragment key={court.id}>
                  <div className="sticky left-0 z-10 flex items-center gap-2 border-b border-neutral-100 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-court text-sm font-bold text-white">
                      {courtIndex + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{court.name}</span>
                      <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {court.type} {court.surface}
                      </span>
                    </span>
                  </div>
                  {columns.map(minute => {
                    const slot = map.get(minute);
                    const isSelected =
                      !!selection &&
                      selection.courtId === court.id &&
                      minute >= selection.start &&
                      minute < selection.end;
                    const isBooked = !!slot?.booked;
                    const isAvailable = !!slot && !isBooked;

                    const label = !slot
                      ? `${minuteToTime(minute)}, ${court.name}, mimo prevádzky`
                      : isBooked
                        ? `${minuteToTime(minute)}, ${court.name}, obsadené`
                        : `${minuteToTime(minute)}, ${court.name}, voľné, ${slot.price.toFixed(2)} €` +
                          (canSelect ? '' : ' - pre výber sa prihláste a dobite kredit');

                    if (!slot) {
                      return (
                        <div
                          key={`${court.id}-${minute}`}
                          aria-hidden="true"
                          className="h-12 border-b border-l border-neutral-100 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
                        />
                      );
                    }

                    return (
                      <button
                        key={`${court.id}-${minute}`}
                        type="button"
                        disabled={isBooked}
                        aria-label={label}
                        aria-pressed={isSelected}
                        onMouseDown={() => handleCellDown(court.id, minute, slot)}
                        onMouseEnter={() => handleCellEnter(court.id, minute)}
                        onClick={() => handleCellDown(court.id, minute, slot)}
                        title={`${minuteToTime(minute)} · ${slot.price.toFixed(2)} €`}
                        className={[
                          'h-12 w-full appearance-none border-b border-l border-neutral-100 p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-court dark:border-neutral-700',
                          isBooked ? 'cursor-not-allowed bg-neutral-200 dark:bg-neutral-600' : '',
                          isAvailable && !isSelected && canSelect
                            ? 'cursor-pointer bg-white hover:bg-green-50 dark:bg-neutral-800 dark:hover:bg-neutral-700'
                            : '',
                          isAvailable && !isSelected && !canSelect ? 'cursor-pointer bg-white dark:bg-neutral-800' : '',
                          isSelected ? 'cursor-pointer bg-court' : ''
                        ].join(' ')}
                      />
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </div>
      )}

      {selection && selectedCourt && (
        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-court bg-white p-4 shadow-md dark:bg-neutral-800">
          <div className="text-sm">
            <div>
              <span className="font-semibold">{selectedCourt.name}</span> · {formatDate(dateIso)} ·{' '}
              {minuteToTime(selection.start)}–{minuteToTime(selection.end)} ({durationLabel(selection.end - selection.start)})
              {' · '}
              <span className="font-semibold">{selectedPrice.toFixed(2)} €</span>
            </div>
            {loggedIn && creditBalance !== null && selectedPrice > creditBalance && (
              <p className="mt-1 text-red-700 dark:text-red-400">
                Nedostatok kreditu (chýba {(selectedPrice - creditBalance).toFixed(2)} €).{' '}
                <a className="underline" href="/credit/topup">
                  Dobiť kredit
                </a>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary !px-3 !py-1.5 text-sm" onClick={clearSelection}>
              Zrušiť výber
            </button>
            {loggedIn ? (
              <form action={createOrder}>
                <input type="hidden" name="courtId" value={selectedCourt.id} />
                <input type="hidden" name="date" value={dateIso} />
                <input type="hidden" name="fromMinute" value={selection.start} />
                <input type="hidden" name="toMinute" value={selection.end} />
                <button type="submit" className="btn" disabled={creditBalance === null || selectedPrice > creditBalance}>
                  Rezervovať
                </button>
              </form>
            ) : (
              <a className="btn" href="/login?next=/courts">
                Prihlásiť sa a rezervovať
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
