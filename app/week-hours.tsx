import { type Vendor, type Weekday, formatDayHours } from "@/lib/vendors";

// Monday first, because someone planning their week reads a calendar that way,
// even though the data stores days Sunday-first.
const ORDER: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/** Collapsed by default so the card stays scannable; today's row is marked
 *  in words as well as weight, so it is not only a colour cue. */
export function WeekHours({ vendor, today }: { vendor: Vendor; today?: Weekday }) {
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer text-[var(--color-ink-soft)]">Opening hours</summary>
      <ul className="mt-1.5 space-y-0.5 tabular-nums">
        {ORDER.map((day) => (
          <li key={day} className={day === today ? "font-semibold" : undefined}>
            <span className="inline-block w-24 capitalize">{day}</span>
            {formatDayHours(vendor.hours[day])}
            {day === today && (
              <span className="ml-2 text-[var(--color-ink-soft)]">(today)</span>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
