export const PREFIX = "elevate-offline-v1-";
export const META = "elevate-offline-meta-v1";
export const ACTIVE = "/__elevate_offline_active__";
export function validateManifest(value, kind) {
  if (
    !value ||
    value.protocol !== 1 ||
    !/^[a-f0-9]{64}$/.test(value.id) ||
    typeof value.version !== "string" ||
    value.version.length > 60 ||
    !Array.isArray(value.files) ||
    value.files.length < 1 ||
    value.files.length > 200
  )
    throw Error("Unsupported offline package. Update the app before syncing.");
  const seen = new Set();
  let bytes = 0;
  for (const file of value.files) {
    if (
      !file ||
      typeof file.path !== "string" ||
      !file.path.startsWith("/") ||
      file.path.includes("..") ||
      /[?#%\\]/.test(file.path) ||
      !/^[\w./@ &-]+$/.test(file.path) ||
      seen.has(file.path) ||
      !/^[a-f0-9]{64}$/.test(file.sha256) ||
      !Number.isSafeInteger(file.bytes) ||
      file.bytes < 1 ||
      file.bytes > 26000000
    )
      throw Error("Invalid offline package file.");
    if (
      kind === "model"
        ? !file.path.startsWith("/observation/")
        : !(
            file.path === "/index.html" ||
            file.path.startsWith("/_expo/") ||
            file.path.startsWith("/assets/") ||
            file.path === "/favicon.ico"
          )
    )
      throw Error("Offline package path is not allowed.");
    seen.add(file.path);
    bytes += file.bytes;
  }
  if (
    bytes > 180000000 ||
    (kind === "model" && !seen.has("/observation/index.html")) ||
    (kind === "shell" && !seen.has("/index.html"))
  )
    throw Error("Incomplete or oversized offline package.");
  return { ...value, bytes };
}
export function virtualPath(pathname) {
  const match = pathname.match(
    /^\/observation\/offline\/([a-f0-9]{64})\/(.+)$/,
  );
  if (!match || match[2].includes("..")) return null;
  return { id: match[1], path: "/observation/" + match[2] };
}
