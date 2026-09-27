// Explicit operator-only provisioning. This script is never shipped to clients.
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const [action, email, target] = process.argv.slice(2);
if (
  !["grant", "revoke"].includes(action) ||
  !email ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  !["--local", "--remote"].includes(target)
) {
  console.error(
    "Usage: node scripts/admin-role.mjs grant|revoke existing-account-email --local|--remote",
  );
  process.exit(1);
}
const escaped = email.toLowerCase().replaceAll("'", "''");
const directory = mkdtempSync(join(tmpdir(), "elevate-admin-"));
const file = join(directory, "role.sql");
try {
  writeFileSync(
    file,
    action === "grant"
      ? `INSERT OR IGNORE INTO administrators(user_id) SELECT id FROM users WHERE email='${escaped}'; SELECT COUNT(*) AS assigned FROM administrators JOIN users ON users.id=administrators.user_id WHERE users.email='${escaped}';`
      : `DELETE FROM administrators WHERE user_id IN (SELECT id FROM users WHERE email='${escaped}');`,
  );
  const result = spawnSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "DB",
      target,
      "--config",
      target === "--local" ? "wrangler.local.jsonc" : "wrangler.jsonc",
      "--file",
      file,
    ],
    { stdio: "inherit", env: process.env },
  );
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
