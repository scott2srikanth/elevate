import { spawnSync } from "node:child_process";
for (const args of [
  ["scripts/build-model-release.mjs"],
  [
    "node_modules/expo/bin/cli",
    "export",
    "--platform",
    "web",
    ...process.argv.slice(2),
  ],
  ["scripts/build-offline-shell.mjs"],
]) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
