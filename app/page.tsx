"use client";

import { useEffect, useMemo, useState } from "react";
import raw from "@/data/vendors.json";
import {
  AREAS,
  ASSURANCE_LABEL,
  ASSURANCE_LEVELS,
  type Area,
  type Assurance,
  type PriceBand,
  type Vendor,
  type Weekday,
  WEEKDAYS,
  filterVendors,
  isOpenAt,
  sortVendors,
} from "@/lib/vendors";

const VENDORS = raw.vendors as unknown as Vendor[];

const ASSURANCE_COLOUR: Record<Assurance, string> = {
  certified: "var(--color-certified)",
  "muslim-owned": "var(--color-owned)",
  "community-reported": "var(--color-reported)",
  unverified: "var(--color-unverified)",
};

export default function Home() {
  const [area, setArea] = useState<Area | "all">("all");
  const [maxPrice, setMaxPrice] = useState<PriceBand | "">("");
  const [minAssurance, setMinAssurance] = useState<Assurance | "">("");
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  // Read on the client only: computing "now" during render would make the
  // server and client markup disagree and produce a hydration mismatch.
  const [now, setNow] = useState<{ day: Weekday; minutes: number } | null>(null);
  useEffect(() => {
    const date = new Date();
    setNow({
      day: WEEKDAYS[date.getDay()],
      minutes: date.getHours() * 60 + date.getMinutes(),
    });
  }, []);

  const results = useMemo(() => {
    const filtered = filterVendors(VENDORS, {
      area,
      maxPrice: maxPrice || undefined,
      minAssurance: minAssurance || undefined,
      query,
    });
    const byOpen =
      openOnly && now
        ? filtered.filter((v) => isOpenAt(v, now.day, now.minutes))
        : filtered;
    return sortVendors(byOpen);
  }, [area, maxPrice, minAssurance, query, openOnly, now]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Halal Bites</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)] dark:text-white/60">
          Where to eat around UNILAG — Akoka, Yaba, Bariga and on campus — with an
          honest record of how we know each place is what it says.
        </p>
      </header>

      <p className="mb-6 rounded-lg border border-[var(--color-brand)]/30 bg-[var(--color-brand-soft)] p-3 text-sm dark:bg-white/5">
        <strong>Everything here is placeholder data.</strong> No entry has been checked
        by anyone yet. Do not rely on it to decide what to eat — and if you know one of
        these places, correcting it is the most useful thing you can contribute.
      </p>

      <section className="mb-6 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a dish or a place — try suya"
          aria-label="Search"
          className="min-w-52 flex-1 rounded border border-[var(--color-rule)] bg-transparent px-3 py-1.5 text-sm"
        />
        <select
          value={area}
          onChange={(e) => setArea(e.target.value as Area | "all")}
          aria-label="Area"
          className="rounded border border-[var(--color-rule)] bg-transparent px-2 py-1.5 text-sm"
        >
          <option value="all">Anywhere</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value as PriceBand | "")}
          aria-label="Maximum price"
          className="rounded border border-[var(--color-rule)] bg-transparent px-2 py-1.5 text-sm"
        >
          <option value="">Any price</option>
          <option value="₦">₦ only</option>
          <option value="₦₦">₦₦ or less</option>
        </select>
        <select
          value={minAssurance}
          onChange={(e) => setMinAssurance(e.target.value as Assurance | "")}
          aria-label="Minimum assurance"
          className="rounded border border-[var(--color-rule)] bg-transparent px-2 py-1.5 text-sm"
        >
          <option value="">Any assurance</option>
          {ASSURANCE_LEVELS.slice(1).map((level) => (
            <option key={level} value={level}>
              {level} or better
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
          />
          Open now
        </label>
      </section>

      <p className="mb-3 text-xs text-[var(--color-ink-soft)]">
        {results.length} of {VENDORS.length} places · best-assured first
      </p>

      {results.length === 0 ? (
        <p className="rounded-lg border border-[var(--color-rule)] p-6 text-center text-sm text-[var(--color-ink-soft)]">
          Nothing matches. Try widening the filters — or add the place you were looking
          for, which is a pull request away.
        </p>
      ) : (
        <ul className="space-y-3">
          {results.map((vendor) => (
            <li
              key={vendor.id}
              className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-card)] p-4 dark:bg-white/5"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-medium">{vendor.name}</h2>
                <span className="text-xs text-[var(--color-ink-soft)]">
                  {vendor.area} · {vendor.landmark}
                </span>
                <span className="ml-auto text-sm tabular-nums">{vendor.priceBand}</span>
                {now && (
                  <span
                    className={`text-xs font-medium ${
                      isOpenAt(vendor, now.day, now.minutes)
                        ? "text-[var(--color-certified)]"
                        : "text-[var(--color-ink-soft)]"
                    }`}
                  >
                    {isOpenAt(vendor, now.day, now.minutes) ? "Open now" : "Closed now"}
                  </span>
                )}
              </div>

              <p className="mt-1.5 text-sm text-[var(--color-ink-soft)] dark:text-white/70">
                {vendor.description}
              </p>

              <ul className="mt-2 flex flex-wrap gap-1.5">
                {vendor.dishes.map((dish) => (
                  <li
                    key={dish}
                    className="rounded border border-[var(--color-rule)] px-1.5 py-0.5 text-xs"
                  >
                    {dish}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-start gap-2 border-t border-[var(--color-rule)] pt-2">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: ASSURANCE_COLOUR[vendor.assurance] }}
                  aria-hidden
                />
                <p className="text-xs">
                  <span className="font-medium">{ASSURANCE_LABEL[vendor.assurance]}</span>
                  {vendor.assuranceNote && (
                    <span className="text-[var(--color-ink-soft)]">
                      {" "}
                      — {vendor.assuranceNote}
                    </span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
