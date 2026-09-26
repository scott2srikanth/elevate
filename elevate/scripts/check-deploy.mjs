import fs from "node:fs";
const raw = fs.readFileSync(
  new URL("../wrangler.jsonc", import.meta.url),
  "utf8",
);
const config = JSON.parse(raw.replace(/,\s*([}\]])/g, "$1"));
const problems = [];
if (
  !config.d1_databases?.[0]?.database_id ||
  config.d1_databases[0].database_id === "00000000-0000-0000-0000-000000000000"
)
  problems.push("Set the real D1 database_id in wrangler.jsonc.");
if (!config.vars.APP_ORIGIN?.startsWith("https://"))
  problems.push("Set APP_ORIGIN to your HTTPS production origin.");
if (
  (config.vars.ALLOWED_ORIGINS || "")
    .split(",")
    .some((origin) => origin && !origin.startsWith("https://"))
)
  problems.push(
    "Remove localhost/non-HTTPS origins from production ALLOWED_ORIGINS.",
  );
if (process.env.EXPO_PUBLIC_API_URL?.includes("localhost"))
  problems.push("Do not embed a localhost API URL in a production build.");
if (problems.length) {
  console.error(
    "Deployment configuration is incomplete:\n" +
      problems.map((p) => "- " + p).join("\n"),
  );
  process.exit(1);
}
console.log("Deployment configuration validated.");
