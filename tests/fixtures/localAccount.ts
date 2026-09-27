import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initialState } from "../../src/coach";
import { passwordHash, randomToken, sha256 } from "../../worker/security";
export async function localAccount(
  email: string,
  password: string,
  baseURL = "http://localhost:8787",
) {
  if (baseURL !== "http://localhost:8787")
    throw new Error("Test account provisioning is local-only.");
  const id = crypto.randomUUID(),
    salt = randomToken(),
    recoveryCode = randomToken();
  const quote = (value: string) => "'" + value.replaceAll("'", "''") + "'";
  const dir = mkdtempSync(join(tmpdir(), "elevate-test-account-"));
  try {
    const file = join(dir, "seed.sql");
    writeFileSync(
      file,
      `INSERT INTO users VALUES(${[id, email, await passwordHash(password, salt), salt, await sha256(recoveryCode)].map(quote).join(",")},unixepoch()); INSERT INTO coach_state VALUES(${quote(id)},${quote(JSON.stringify(initialState()))},0,unixepoch());`,
    );
    execFileSync(
      "npx",
      [
        "wrangler",
        "d1",
        "execute",
        "DB",
        "--local",
        "--config",
        "wrangler.local.jsonc",
        "--file",
        file,
      ],
      {
        stdio: "pipe",
        env: { ...process.env, WRANGLER_LOG_PATH: "/tmp/elevate-fixture.log" },
      },
    );
    return { recoveryCode };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
