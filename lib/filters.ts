import {
  ASSURANCE_LEVELS,
  AREAS,
  type Area,
  type Assurance,
  PRICE_BANDS,
  type PriceBand,
} from "./vendors";

export interface FilterState {
  readonly area: Area | "all";
  readonly maxPrice: PriceBand | "";
  readonly minAssurance: Assurance | "";
  readonly query: string;
  readonly openOnly: boolean;
}

/**
 * Leaves out any filter at its default, so an unfiltered page keeps a clean
 * address and a shared link only carries what the sender actually chose.
 */
export function serialiseFilters(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.area !== "all") params.set("area", state.area);
  if (state.maxPrice) params.set("price", state.maxPrice);
  if (state.minAssurance) params.set("assurance", state.minAssurance);
  if (state.query) params.set("q", state.query);
  if (state.openOnly) params.set("open", "1");
  return params.toString();
}

/**
 * Anything unrecognised falls back to the default rather than being trusted.
 * A hand-edited or stale link should show the full list, not an empty one
 * that looks like the directory has nothing in it.
 */
export function parseFilters(search: string): FilterState {
  const params = new URLSearchParams(search);
  const pick = <T extends string>(key: string, allowed: readonly T[]) =>
    allowed.find((value) => value === params.get(key));

  return {
    area: pick("area", AREAS) ?? "all",
    maxPrice: pick("price", PRICE_BANDS) ?? "",
    minAssurance: pick("assurance", ASSURANCE_LEVELS) ?? "",
    query: params.get("q") ?? "",
    openOnly: params.get("open") === "1",
  };
}
