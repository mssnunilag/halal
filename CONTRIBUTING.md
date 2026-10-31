# Contributing to Halal Bites

Most of the work on this project is adding and correcting data, not writing code. If
you have never opened a pull request before, this is a good place to start.

## Before anything else

```bash
pnpm install
pnpm validate
```

You should never need an API key, a `.env` file, a database, or access to anything
belonging to MSSN UNILAG.

## Adding or correcting a vendor

Edit [`data/vendors.json`](./data/vendors.json), then run:

```bash
pnpm validate
```

It reports every problem at once, with the vendor id and the field, so you can fix
them in one pass. CI runs the same check on your pull request.

### What each field means

| Field | What goes in it |
| --- | --- |
| `id` | lowercase, hyphenated, unique — `mama-risi-akoka` |
| `name` | what the place is actually called |
| `area` | one of `Akoka`, `Yaba`, `Bariga`, `On campus` |
| `description` | a sentence or two. What is it like, when is it busy |
| `landmark` | how someone who has never been would find it |
| `priceBand` | `₦` cheap, `₦₦` middling, `₦₦₦` a treat — for one normal meal |
| `assurance` | see below. **Read this before you set it** |
| `assuranceNote` | who checked, and when |
| `hours` | all seven days. `null` for a day it is closed |
| `dishes` | what people go there for. Searched, so use the names students use |

### The assurance field

This is the one that matters, and the one it is easiest to get wrong.

- **`certified`** — the place holds halal certification and **you have seen it**. Not
  "they said they have one".
- **`muslim-owned`** — you have confirmed in person that it is Muslim-owned.
- **`community-reported`** — a Muslim student says they eat there. This is the right
  level for most entries and there is nothing wrong with it.
- **`unverified`** — nobody has checked. Also the honest level for a mixed kitchen.

Anything above `unverified` **must** have an `assuranceNote` of at least ten
characters saying who checked and when, or validation fails. This is deliberate. The
one real harm this project could do is telling somebody food is halal on no evidence,
so the rule is enforced by a machine rather than by reviewer attention.

**When in doubt, go one level down.** Nobody has ever been hurt by an entry that was
more cautious than it needed to be.

### Hours

Times are `"HH:MM"` on a 24-hour clock, zero-padded — `"08:00"`, not `"8am"`. A day
the place is closed is `null`, not missing. A place that closes after midnight is
written as it reads: `{ "open": "18:00", "close": "02:00" }`. The app handles that
correctly, including whether it is still open at half past midnight the next day.

## If you are writing code

**Comments explain why, not what.** The comment on `isOpenAt` in
[`lib/vendors.ts`](./lib/vendors.ts) explains the after-midnight bug and why the naive
comparison fails. Write that kind.

**TypeScript, strict. No `any`.** Logic lives in `lib/` as pure functions so it can be
tested without a browser; React state belongs in `app/`.

**Anything in `lib/` needs a test.** Test names are sentences about behaviour.

```bash
pnpm test
pnpm typecheck
```

## Pull requests

- One topic per pull request. Several vendors in one PR is fine — that is one topic.
- Say how you know what you are adding. "I eat here twice a week" is a perfect PR
  description.
- Run `pnpm validate` before pushing.

## What we will not merge

- An assurance level you cannot back up.
- A vendor outside the UNILAG area — keep the directory useful by keeping it local.
- Opening hours copied from a listing site without checking. Those are wrong more
  often than they are right; `unverified` hours are better than confident wrong ones.
