import te from "./te.json";
import { translatedRemote } from "../contentRuntime";
export type Language = string;
export function translate(text: string, language: Language): string {
  const remote = translatedRemote(text, language);
  if (remote !== undefined) return remote;
  if (language !== "te") return text;
  const key = text.replace(/\s+/g, " ").trim();
  const found = (te as Record<string, string>)[key];
  if (found) return text.match(/^\s/) ? ` ${found}` : found;
  const greeting = key.match(/^Your next chapter(?:, (.*))?\.$/);
  if (greeting)
    return greeting[1]
      ? `${greeting[1]}, మీ కొత్త ప్రయాణం.`
      : "మీ కొత్త ప్రయాణం.";
  const stage = key.match(/^Stage (\d+)$/);
  if (stage) return `దశ ${stage[1]}`;
  const duration = key.match(/^(\d+) min \/ day$/);
  if (duration) return `రోజుకు ${duration[1]} నిమిషాలు`;
  const confidence = key.match(/^Confidence (\d+) of 5$/);
  if (confidence) return `ఆత్మవిశ్వాసం: 5లో ${confidence[1]}`;
  if (/^[+−] More coaching tools/.test(key))
    return `${key[0]} మరిన్ని కోచింగ్ సాధనాలు · భోజనం, సంస్కృతి, వ్యక్తిగత గుర్తింపు`;
  const wrongTab = key.match(
    /^This response belongs to the (weekly|coach|media) tab\. Paste it in the matching tab, or ask ChatGPT to return kind "(weekly|coach|media)"\.$/,
  );
  if (wrongTab)
    return `ఈ సమాధానం ${wrongTab[1]} విభాగానికి చెందినది. సరైన విభాగంలో పేస్ట్ చేయండి లేదా kind "${wrongTab[2]}"తో సమాధానం ఇవ్వమని ChatGPTని అడగండి.`;
  if (
    key.startsWith("Check ") &&
    key.endsWith(
      "Ask ChatGPT to follow the response_schema in your exported JSON.",
    )
  )
    return "JSON నిర్మాణం లేదా విలువలు సరిపోలలేదు. ఎగుమతి చేసిన JSONలోని response_schemaను అనుసరించి పూర్తి సమాధానం ఇవ్వమని ChatGPTని అడగండి.";
  const patterns: [RegExp, (...args: string[]) => string][] = [
    [
      /^Your wardrobe · (\d+) pieces$/,
      (n) => `మీ దుస్తుల జాబితా · ${n} వస్తువులు`,
    ],
    [
      /^(\d+) min · Learn, practice, reflect$/,
      (n) => `${n} నిమి. · నేర్చుకోండి, సాధన చేయండి, సమీక్షించండి`,
    ],
    [
      /^Average self-reported confidence: (.*)\/5\.$/,
      (n) => `స్వయంగా తెలిపిన సగటు ఆత్మవిశ్వాసం: ${n}/5.`,
    ],
    [
      /^This skill rounds out stage (\d+) of your coaching path\. You can choose another practice at any time\.$/,
      (n) =>
        `ఈ నైపుణ్యం మీ కోచింగ్ మార్గంలోని ${n}వ దశను పూర్తి చేస్తుంది. ఎప్పుడైనా మరొక సాధన ఎంచుకోవచ్చు.`,
    ],
    [
      /^Chosen for your focus on (.*) and your practice history\.$/,
      (area) =>
        `మీ ${translateTitle(area)} ప్రాధాన్యం, సాధన చరిత్ర ఆధారంగా ఎంచుకున్నాం.`,
    ],
    [
      /^Your recent reflections mention (.*)\. This is a transparent keyword-based suggestion; choose a different practice if it misses your meaning\.$/,
      (area) =>
        `ఇటీవలి అనుభవాల్లో ${translateTitle(area)} గురించి చెప్పారు. ఇది కీలకపదాల ఆధారమైన సూచన మాత్రమే; మీ భావానికి సరిపోకపోతే మరొక సాధన ఎంచుకోండి.`,
    ],
    [
      /^Try one short repetition of this step: (.*)$/,
      (step) =>
        `ఈ అడుగును ఒక్కసారి క్లుప్తంగా ప్రయత్నించండి: ${translate(step, language)}`,
    ],
    [
      /^A (\d+)-minute version\. (.*)$/,
      (n, rest) => `${n} నిమిషాల సాధన. ${translate(rest, language)}`,
    ],
    [
      /^A starting combination from pieces you own for (.*)\. Confirm the actual dress code, comfort, and weather; garment names alone cannot establish fit or formality\.$/,
      (occasion) =>
        `${translateTitle(occasion)} కోసం మీ దుస్తులతో ప్రారంభ కలయిక. దుస్తుల నియమాలు, సౌకర్యం, వాతావరణం నిర్ధారించుకోండి; పేర్లతో మాత్రమే సరైన కొలత లేదా సందర్భాన్ని నిర్ణయించలేం.`,
    ],
    [
      /^(\d+) minutes a day · (.*) · Started (.*)$/,
      (n, focus, date) =>
        `రోజుకు ${n} నిమిషాలు · ${translate(focus, language)} · ప్రారంభం ${date}`,
    ],
    [/^Remove (.*)$/, (name) => `తొలగించండి: ${name}`],
    [/^Forget: (.*)$/, (note) => `మరచిపోండి: ${note}`],
    [/^Delete upload (.*)$/, (id) => `అప్‌లోడ్ తొలగించండి ${id}`],
    [/^Delete feedback (.*)$/, (id) => `సూచనలు తొలగించండి ${id}`],
    [/^Step (\d+): (.*)$/, (n, title) => `అడుగు ${n}: ${title}`],
    [/^ChatGPT · (.*)$/, (name) => `ChatGPT · ${translate(name, language)}`],
  ];
  function translateTitle(value: string) {
    const original = Object.keys(te).find(
      (k) => k.toLowerCase() === value.toLowerCase(),
    );
    return original ? translate(original, language) : value;
  }
  for (const [pattern, render] of patterns) {
    const match = key.match(pattern);
    if (match) return render(...match.slice(1));
  }
  return text;
}
