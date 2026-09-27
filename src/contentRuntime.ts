// Plain-data registry shared by translation and coaching modules; no network or React imports.
export type LanguagePack = {
  code: string;
  name: string;
  strings: Record<string, string>;
};
export let languagePacks: LanguagePack[] = [];
export function installLanguages(packs: LanguagePack[]) {
  languagePacks = packs;
}
export function availableLanguages() {
  const list = [
    { code: "en", name: "English" },
    { code: "te", name: "తెలుగు" },
  ];
  for (const pack of languagePacks) {
    const index = list.findIndex((x) => x.code === pack.code);
    if (index < 0) list.push(pack);
    else list[index] = pack;
  }
  return list;
}
export function translatedRemote(
  text: string,
  language: string,
): string | undefined {
  const strings = languagePacks.find((p) => p.code === language)?.strings;
  if (!strings) return undefined;
  const key = text.replace(/\s+/g, " ").trim();
  if (Object.hasOwn(strings, key)) return strings[key];
  for (const [pattern, translated] of Object.entries(strings)) {
    if (!/\{[a-zA-Z]+\}/.test(pattern)) continue;
    const names = [...pattern.matchAll(/\{([a-zA-Z]+)\}/g)].map((m) => m[1]);
    const regex = pattern
      .split(/\{[a-zA-Z]+\}/)
      .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("(.+?)");
    const match = key.match(new RegExp(`^${regex}$`));
    if (match)
      return translated.replace(
        /\{([a-zA-Z]+)\}/g,
        (_, name) => match[names.indexOf(name) + 1],
      );
  }
  return undefined;
}
