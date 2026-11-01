import { describe, expect, it } from "vitest";
import { type FilterState, parseFilters, serialiseFilters } from "./filters";

const UNFILTERED: FilterState = {
  area: "all",
  maxPrice: "",
  minAssurance: "",
  query: "",
  openOnly: false,
};

describe("the filters in the URL", () => {
  // The link as a browser holds it after someone pasted it into WhatsApp:
  // percent-encoded naira signs and a "+" for the space in the search.
  const SHARED_LINK =
    "?area=Yaba&price=%E2%82%A6%E2%82%A6&assurance=certified&q=suya+jollof&open=1";

  it("restores a shared link and writes the same link back", () => {
    const restored = parseFilters(SHARED_LINK);

    expect(restored).toEqual({
      area: "Yaba",
      maxPrice: "₦₦",
      minAssurance: "certified",
      query: "suya jollof",
      openOnly: true,
    });
    expect(`?${serialiseFilters(restored)}`).toBe(SHARED_LINK);
  });

  it("leaves defaults out of the link so an unfiltered page has a clean address", () => {
    expect(serialiseFilters(UNFILTERED)).toBe("");
    expect(parseFilters("")).toEqual(UNFILTERED);
  });

  it("falls back to the defaults for values it does not recognise", () => {
    const stale = parseFilters(
      "?area=Mars&price=%E2%82%A6%E2%82%A6%E2%82%A6%E2%82%A6&assurance=trusted&open=yes",
    );

    expect(stale).toEqual(UNFILTERED);
  });

  it("keeps the valid filters when only some values are unrecognised", () => {
    const partly = parseFilters("?area=Akoka&assurance=trusted&q=shawarma");

    expect(partly).toEqual({ ...UNFILTERED, area: "Akoka", query: "shawarma" });
  });
});
