import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const historicalPrefixes = [
  "docs/archive/",
  "docs/history/",
  "docs/plans/completed/",
];

const historicalFiles = new Set([
  "docs/hosting-report-2026-09-14.md",
  "docs/status-report-2026-08-21.md",
]);

const rebrandFiles = new Set([
  "docs/adr/015-noasterisk-product-identity-and-compatibility.md",
  "client/src/shared/config/product-identity/product-identity.spec.ts",
  "scripts/verify-retired-brand.mjs",
]);

const compatibilityPrefixes = [
  "client/src/shared/adapters/persistence/",
  "client/src/shared/adapters/vault-protocol/",
  "server/src/vault-protocol/",
];

const compatibilityFiles = new Set([
  "client/e2e/security/vault-v2.spec.ts",
  "client/src/shared/adapters/webauthn/passkey-prf-salt.ts",
  "client/src/shared/adapters/webauthn/vault-passkey-ceremony.spec.ts",
  "client/src/shared/api/vault-protocol/device-id.spec.ts",
  "client/src/shared/api/vault-protocol/persist-device-id/constants.ts",
  "docs/architecture/local-first-e2ee.md",
  "docs/guides/frontend/vault-protocol-v2.md",
  "docs/plans/active/mvp-release/09b-device-bound-vault-and-sync-chain.md",
  "docs/runbooks/vault-v2-cutover.md",
  "docs/security/vault-v2-test-vectors.json",
  "docs/security/vault-v2-threat-model.md",
]);

const tracked = spawnSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});
if (tracked.status !== 0)
  throw new Error(tracked.stderr || "Unable to enumerate tracked files");

const findings = [];
const counts = new Map();
const matchingFiles = new Set();

const classify = (path, match) => {
  if (
    historicalPrefixes.some((prefix) => path.startsWith(prefix)) ||
    historicalFiles.has(path) ||
    (path.startsWith("docs/adr/") && !path.endsWith("/README.md"))
  )
    return "historical evidence or decision";
  if (rebrandFiles.has(path)) return "rebrand record or regression gate";

  const isLegacyNamespace = match === match.toLowerCase();
  if (
    isLegacyNamespace &&
    (compatibilityPrefixes.some((prefix) => path.startsWith(prefix)) ||
      compatibilityFiles.has(path))
  )
    return "immutable protocol or persistence compatibility";

  return undefined;
};

for (const path of tracked.stdout.split("\0").filter(Boolean)) {
  let source;
  try {
    source = readFileSync(path, "utf8");
  } catch {
    continue;
  }
  for (const [index, line] of source.split(/\r?\n/u).entries()) {
    for (const match of line.matchAll(/budget\s*flow/giu)) {
      const classification = classify(path, match[0]);
      if (classification === undefined) {
        findings.push(`${path}:${index + 1}: ${line.trim()}`);
        continue;
      }
      matchingFiles.add(path);
      counts.set(classification, (counts.get(classification) ?? 0) + 1);
    }
  }
}

if (findings.length > 0) {
  console.error("Unclassified retired-brand occurrences:");
  console.error(findings.join("\n"));
  process.exit(1);
}

const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
console.log(
  `Retired-brand inventory passed: ${total} classified occurrences in ${matchingFiles.size} tracked files.`,
);
for (const [classification, count] of [...counts].sort())
  console.log(`- ${classification}: ${count}`);
