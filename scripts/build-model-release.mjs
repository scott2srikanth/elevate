import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const root = path.resolve("public/observation");
const config = JSON.parse(
  fs.readFileSync(path.join(root, "release-config.json"), "utf8"),
);
if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9.-]+)?$/.test(config.version))
  throw Error("Invalid model release version");
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
}
const files = walk(root)
  .filter(
    (p) =>
      ![
        "model-release.json",
        "asset-manifest.json",
        "release-config.json",
      ].includes(path.basename(p)),
  )
  .sort()
  .map((p) => {
    const data = fs.readFileSync(p);
    return {
      path: "/observation/" + path.relative(root, p).split(path.sep).join("/"),
      bytes: data.length,
      sha256: createHash("sha256").update(data).digest("hex"),
    };
  });
const id = createHash("sha256").update(JSON.stringify(files)).digest("hex");
fs.writeFileSync(
  path.join(root, "model-release.json"),
  JSON.stringify({ protocol: 1, id, version: config.version, files }, null, 2) +
    "\n",
);
console.log(
  `Model release ${config.version}: ${id.slice(0, 12)}, ${files.length} verified files`,
);
