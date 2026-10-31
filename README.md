# Halal Bites — UNILAG

**A directory of halal food around UNILAG that is honest about how it knows.**

---

## The problem

Ask any new Muslim student at UNILAG where to eat and you get the same answer: ask
around. The information exists — it is just scattered across WhatsApp groups, hostel
corridors and whoever happens to be standing next to you. Every intake rediscovers it
from scratch, and the students with the fewest connections on campus are the ones who
go longest without knowing.

There is a second, sharper problem underneath it. "Is this place halal?" usually has
no clean answer. Sometimes a vendor is Muslim-owned and everybody knows it. Sometimes
one person ate there once and said it was fine. Sometimes a kitchen cooks both and
the honest answer is "ask which pot". Most food apps flatten all of that into a
little green badge, and that badge is a lie.

So this directory records **how we know**, in four levels, and shows it on every
entry — including when the answer is "nobody has checked".

## What it does

- Lists food vendors around Akoka, Yaba, Bariga and on campus.
- Every entry carries an **assurance level** — `certified`, `muslim-owned`,
  `community-reported` or `unverified` — plus a note saying who checked and when.
  A level above `unverified` with no such note **fails the build**.
- Filter by area, price band, minimum assurance, and whether a place is open right
  now — including places that close after midnight.
- Search matches dish names, not just vendor names, because students search for
  "suya", not for a place they have never heard of.
- Sorted best-assured first.

## ⚠️ The data is all placeholder

Every entry currently in [`data/vendors.json`](./data/vendors.json) was written to
give the app something to render. **None of it has been checked by anybody.** Do not
use it to decide what to eat.

That is not an oversight — it is the project's main open task, and the reason this is
a good Hacktoberfest project. Correcting one entry, or adding a real place you know,
is a complete and genuinely useful contribution that needs no JavaScript.

## Setup

Requires **Node 20+** and **pnpm**. (`pnpm validate` uses Node's built-in TypeScript
stripping and wants **Node 22+**; nothing else does.)

```bash
git clone https://github.com/mssnunilag/halal.git
```

```bash
cd halal
```

```bash
pnpm install
```

```bash
pnpm dev
```

Open <http://localhost:3000>. No `.env`, no API key, no database, nothing to request
access to.

### Other commands

```bash
pnpm validate
```

```bash
pnpm test
```

```bash
pnpm typecheck
```

## Design decisions

**Assurance is a first-class field, not a badge.** The four levels are ordered, and
the sort puts the best-assured first, because trust is what someone scanning this list
actually cares about. `ASSURANCE_LABEL` spells each level out in a full sentence
rather than a word, so there is no way to read `community-reported` as certification.

**A claim without provenance fails validation.** Anything above `unverified` must
carry an `assuranceNote` of at least ten characters saying who checked and when. This
is the one rule in the project that exists to stop a real harm: telling somebody food
is halal on no evidence.

**Prices are bands, not numbers.** Prices in Lagos move faster than anyone will update
a JSON file, and a stale exact price is worse than an honest range.

**Opening hours handle closing after midnight.** `18:00–02:00` has a closing time
numerically smaller than its opening time, and the naive comparison reports such a
vendor as closed all evening — exactly when students are looking for food. See
`isOpenAt` in [`lib/vendors.ts`](./lib/vendors.ts) and its tests.

**The data is validated by a script, not just typed.** TypeScript cannot check a JSON
file somebody hand-edited. `pnpm validate` reports every problem at once with the
vendor id and field name, and runs in CI.

## Contributing

This is one of four projects indexed at **[https://github.com/mssnunilag/oss](https://github.com/mssnunilag/oss)** — the others cover prayer times, Qur'an memorisation, halal food and zakat, and share this one's conventions.

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) — it explains every field. Drafted
starter tasks are in [ISSUES.md](./ISSUES.md).

Built for Hacktoberfest by [MSSN UNILAG](https://github.com/mssnunilag). Not an official MSSN
product.

## Licence

[MIT](./LICENSE).
