// Curated from the publishers' official channels, reviewed 2026-09-27.
// Keep source titles/attribution intact; guidance and exercises are Elevate's own.
export const videoTopics = [
  "All videos",
  "Speaking",
  "Listening",
  "Confidence",
] as const;
export const coachingVideos = [
  {
    id: "eIho2S0ZahI",
    topic: "Speaking",
    title: "How to speak so that people want to listen",
    author: "Julian Treasure · TED",
    te: "ఇతరులు ఆసక్తిగా వినేలా మాట్లాడండి",
    note: "Explore vocal variety and make your message easier to follow.",
    noteTe:
      "స్వరంలో మార్పులతో మీ మాటలను సులభంగా అర్థమయ్యేలా చెప్పడం నేర్చుకోండి.",
    practice:
      "Say your 30-second introduction twice. On the second attempt, slow down and pause before your key point.",
    practiceTe:
      "మీ 30 సెకన్ల పరిచయాన్ని రెండుసార్లు చెప్పండి. రెండోసారి నెమ్మదిగా మాట్లాడి, ముఖ్యమైన విషయం ముందు విరామం ఇవ్వండి.",
  },
  {
    id: "R1vskiVDwl4",
    topic: "Listening",
    title: "10 ways to have a better conversation",
    author: "Celeste Headlee · TED",
    te: "మెరుగైన సంభాషణకు పది మార్గాలు",
    note: "Build conversations around curiosity and attention.",
    noteTe: "ఆసక్తి, శ్రద్ధతో సంభాషణలను మెరుగుపరచుకోండి.",
    practice:
      "In your next conversation, ask one open question and let the other person finish before you respond.",
    practiceTe:
      "మీ తదుపరి సంభాషణలో ఒక విస్తృతమైన ప్రశ్న అడగండి. ఎదుటివారు పూర్తిగా చెప్పాక స్పందించండి.",
  },
  {
    id: "cSohjlYQI2A",
    topic: "Listening",
    title: "5 ways to listen better",
    author: "Julian Treasure · TED",
    te: "శ్రద్ధగా వినడానికి ఐదు మార్గాలు",
    note: "Notice how you listen and give another voice more space.",
    noteTe: "మీరు ఎలా వింటున్నారో గమనించి, ఎదుటివారికి మరింత అవకాశం ఇవ్వండి.",
    practice:
      "Listen to a colleague for one minute without interrupting. Summarize one point and check that you understood.",
    practiceTe:
      "ఒక నిమిషం పాటు సహోద్యోగి మాటలకు అడ్డురాకుండా వినండి. ఒక విషయాన్ని సంక్షిప్తంగా చెప్పి, సరిగ్గా అర్థమైందో అడగండి.",
  },
  {
    id: "MEDgtjpycYg",
    topic: "Confidence",
    title: "How to speak up for yourself",
    author: "Adam Galinsky · TED",
    te: "మీ అభిప్రాయాన్ని ధైర్యంగా చెప్పండి",
    note: "Consider practical ways to voice your needs in difficult conversations.",
    noteTe:
      "కష్టమైన సంభాషణల్లో మీ అవసరాలను స్పష్టంగా చెప్పే మార్గాలను తెలుసుకోండి.",
    practice:
      "Rehearse a small request: name the situation, explain what you need, and invite a response. Try it in a low-pressure setting.",
    practiceTe:
      "ఒక చిన్న అభ్యర్థనను సాధన చేయండి: పరిస్థితి చెప్పి, మీ అవసరాన్ని వివరించి, స్పందన అడగండి. ఒత్తిడి తక్కువగా ఉన్న సందర్భంలో ప్రయత్నించండి.",
  },
  {
    id: "HAnw168huqA",
    topic: "Speaking",
    title: "Think Fast, Talk Smart: Communication Techniques",
    author: "Matt Abrahams · Stanford Graduate School of Business",
    te: "సమయస్ఫూర్తితో స్పష్టంగా మాట్లాడండి",
    note: "A longer workshop for spontaneous speaking. Watch in manageable sections.",
    noteTe: "సమయస్ఫూర్తితో మాట్లాడటంపై విస్తృతమైన శిక్షణ. కొంత కొంతగా చూడండి.",
    practice:
      "Choose a familiar topic. Give a one-minute answer with a clear beginning, one useful example and a closing point.",
    practiceTe:
      "మీకు తెలిసిన విషయాన్ని ఎంచుకోండి. స్పష్టమైన ప్రారంభం, ఒక ఉదాహరణ, ముగింపుతో ఒక నిమిషం మాట్లాడండి.",
  },
  {
    id: "x6TsR3y5Qfg",
    topic: "Confidence",
    title: "Think Faster, Talk Smarter with Matt Abrahams",
    author: "Matt Abrahams · Stanford Alumni",
    te: "అనుకోని ప్రశ్నలకు నమ్మకంగా స్పందించండి",
    note: "Prepare for the unplanned conversations that happen at work and in daily life.",
    noteTe:
      "ఉద్యోగంలో, రోజువారీ జీవితంలో అనుకోకుండా వచ్చే సంభాషణలకు సిద్ధం అవ్వండి.",
    practice:
      "Ask a friend to give you an unexpected question. Pause, answer in two sentences, then ask what was clear.",
    practiceTe:
      "ఊహించని ప్రశ్న అడగమని స్నేహితుడిని కోరండి. కాసేపు ఆగి, రెండు వాక్యాల్లో సమాధానం చెప్పండి. ఏది స్పష్టంగా ఉందో అడగండి.",
  },
] as const;
export type CoachingVideo = (typeof coachingVideos)[number];
export function videoUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}
export function embedUrl(id: string, language: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&hl=${language}&cc_load_policy=1`;
}
