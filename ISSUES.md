# Good first issues

Comment on the matching GitHub issue to claim one.

> **These are now live issues.** Each task below has an issue at
> <https://github.com/mssnunilag/halal/issues> - claim one by commenting there rather
> than here. This file is kept as the written-out version; if the two ever
> disagree, the issue tracker is right.

Difficulty: [Easy] no JavaScript needed · [Medium] straightforward code · [Hard] needs some thought

---

### 1. [Easy] Verify or correct a seed vendor

**Problem.** All eight entries in `data/vendors.json` are placeholders nobody has
checked. Some may not exist. Some may have the wrong hours, area or price band.

**Task.** Pick one. Go, or ask somebody who goes. Correct every field, set the
`assurance` level you can actually back up, and write an `assuranceNote` saying who
checked and when. Run `pnpm validate`.

**Files.** `data/vendors.json`.

---

### 2. [Easy] Add a real vendor

**Problem.** Eight placeholder entries is not a directory.

**Task.** Add a place you actually eat at, following the field guide in
[CONTRIBUTING.md](./CONTRIBUTING.md). Be honest about the assurance level — most real
entries should be `community-reported`.

**Files.** `data/vendors.json`.

---

### 3. [Medium] Show the week's opening hours on each card

**Problem.** A card says "Open now" or "Closed now" and nothing else. Someone planning
tomorrow, or wondering whether anywhere is open after Isha, cannot find out.

**Task.** Show the full week on each card, collapsed by default, with today's row
marked. Render an after-midnight close as `18:00 – 02:00 (next day)` so it does not
read as an error.

**Files.** `app/page.tsx`, a new component.

---

### 4. [Medium] "Open now" should keep up with the clock

**Problem.** The current time is read once when the page loads. Leave the tab open
over a vendor's closing time and the badge is wrong until you reload.

**Task.** Update it on a timer. Pick a sensible interval and say in the PR why — a
one-second tick is wasteful for something that changes on the minute.

**Files.** `app/page.tsx`.

---

### 5. [Medium] Ramadan hours

**Problem.** In Ramadan most of these places change hours completely, and many open
specifically for iftar. The data model cannot express that at all, so during the one
month the directory would be most useful it is least accurate.

**Task.** Add optional Ramadan hours to the schema and the validator, and a way for
the app to use them. Propose the shape in the issue before writing code — this one
changes the data model and every contributor will have to live with it.

**Files.** `lib/vendors.ts`, `data/vendors.json`, `scripts/validate-vendors.mts`,
`app/page.tsx`, tests.

---

### 6. [Hard] Distance, honestly

**Problem.** "Bariga roundabout" means nothing to someone in their first week. The
single most useful missing fact is how far a place is from where they are standing.

**Task.** Add approximate coordinates to vendors and a rough walking distance from a
few fixed campus points (main gate, second gate, the hostels). Do **not** add live
geolocation — it is a privacy cost for a convenience this project does not need.

**Files.** `lib/vendors.ts`, `data/vendors.json`, `app/page.tsx`, tests.

**Watch out for.** Coordinates are data like any other and need the same honesty: an
unverified coordinate is worse than none, because it looks precise.

---

### 7. [Medium] Let someone report a problem with an entry

**Problem.** If a student notices a place has closed down, their only route to fixing
it is opening a pull request — which most people will not do.

**Task.** A "something's wrong here" link on each card that opens a pre-filled GitHub
issue with the vendor id already in it. No backend, no form submission, no stored
data — a link.

**Files.** `app/page.tsx`.

---

### 8. [Easy] Improve the validator's error messages

**Problem.** The messages are decent but written by someone who already knew the
schema. A first-time contributor is the right person to say where they are confusing.

**Task.** Break the data file on purpose, read what it tells you, and rewrite the
messages that did not help. Add an example of the correct shape to the ones that need
it.

**Files.** `lib/vendors.ts`, `scripts/validate-vendors.mts`, `lib/vendors.test.ts`.

---

### 9. [Medium] Make the filters shareable

**Problem.** You find three cheap places in Akoka open now and cannot send that to
anyone — the filter state lives only in React.

**Task.** Put the filters in the URL query string and read them back on load, so a
filtered view can be pasted into a WhatsApp group.

**Files.** `app/page.tsx`.

---

### 10. [Hard] Decide what to do about mixed kitchens

**Problem.** The student cafeteria is in the list as `unverified` with a description
saying to ask which pots are which. That is honest but not actually useful, and it is
the single most common case on campus.

**Task.** Work out how the directory should represent a place that serves both — a
field, a separate level, a note convention — and propose it. **Discussion first, code
second.** This is a judgement call about how not to mislead people, and it deserves
more than one person's opinion.

**Files.** `lib/vendors.ts`, `data/vendors.json`, `CONTRIBUTING.md`.
