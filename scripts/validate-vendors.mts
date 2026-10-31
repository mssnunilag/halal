/**
 * Checks data/vendors.json and exits non-zero if anything is wrong.
 *
 * Written as .mts and run with Node's built-in type stripping, so the
 * project needs no extra build tooling just to check a JSON file. That is
 * why this one script asks for Node 22+ while the app itself does not.
 *
 * This runs in CI because almost every pull request to this project is a data
 * change, and a contributor who has never written TypeScript deserves a
 * precise "line 3 of your entry is missing Tuesday" rather than a red build
 * with a React stack trace in it.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateVendorFile } from "../lib/vendors.ts";

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = join(here, "..", "data", "vendors.json");

let parsed: unknown;
try {
  parsed = JSON.parse(readFileSync(dataPath, "utf8"));
} catch (error) {
  console.error(`✗ data/vendors.json is not valid JSON.`);
  console.error(`  ${(error as Error).message}`);
  console.error(`\n  A trailing comma after the last item in a list is the usual cause.`);
  process.exit(1);
}

const errors = validateVendorFile(parsed);

if (errors.length === 0) {
  const count = (parsed as { vendors: unknown[] }).vendors.length;
  console.log(`✓ data/vendors.json is valid — ${count} vendors.`);
  process.exit(0);
}

console.error(`✗ ${errors.length} problem${errors.length === 1 ? "" : "s"} in data/vendors.json:\n`);
for (const error of errors) {
  const field = error.field ? `.${error.field}` : "";
  console.error(`  ${error.vendorId}${field}: ${error.message}`);
}
console.error(`\n  See CONTRIBUTING.md for what each field means.`);
process.exit(1);
