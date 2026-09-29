import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
}
const files = walk("dist")
  .filter((p) => /^dist\/(index.html|favicon.ico|assets\/|_expo\/)/.test(p))
  .sort()
  .map((p) => {
    const data = fs.readFileSync(p);
    return {
      path: "/" + p.slice(5),
      bytes: data.length,
      sha256: createHash("sha256").update(data).digest("hex"),
    };
  });
const id = createHash("sha256").update(JSON.stringify(files)).digest("hex");
fs.writeFileSync(
  "dist/offline-app.json",
  JSON.stringify(
    { protocol: 1, id, version: "app-" + id.slice(0, 12), files },
    null,
    2,
  ) + "\n",
);
console.log(
  `Offline app shell: ${files.length} files, ${(files.reduce((n, f) => n + f.bytes, 0) / 1048576).toFixed(1)} MiB`,
);
