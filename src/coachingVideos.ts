// Curated from the publishers' official channels, reviewed 2026-09-27.
// Keep source titles/attribution intact; guidance and exercises are Elevate's own.
export const videoTopics = [
  "All videos",
  "Speaking",
  "Listening",
  "Confidence",
  "Dressing & etiquette",
  "Dining & etiquette",
  "Public appearances",
  "Functions & celebrations",
  "Holiday & vacation",
] as const;
export type CoachingVideo = {
  id: string;
  topic: string;
  topics?: string[];
  audio: string;
  url?: string;
  lessonIds?: string[];
  title: string;
  author: string;
  te: string;
  note: string;
  noteTe: string;
  practice: string;
  practiceTe: string;
};
export const coachingVideos: CoachingVideo[] = [
  {
    id: "eIho2S0ZahI",
    audio: "en",
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
    audio: "en",
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
    audio: "en",
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
    audio: "en",
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
    audio: "en",
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
    audio: "en",
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
  {
    id: "zA2PfKRcm0g",
    topic: "Dining & etiquette",
    topics: [],
    audio: "en",
    title: "Dining Etiquette: how to master the basic table manners",
    author: "Jamila Musayeva",
    te: "భోజన సమయంలో పాటించాల్సిన మర్యాదలు",
    note: "A demonstration of Western table settings and cutlery. Adapt it to the meal and your host’s customs.",
    noteTe:
      "పాశ్చాత్య భోజన పద్ధతులు, కత్తి-ఫోర్క్ వాడకంపై ప్రదర్శన. భోజనం, ఆతిథ్య సంప్రదాయాలకు అనుగుణంగా ఉపయోగించండి.",
    practice:
      "Set a place at home. Rehearse using a napkin and asking politely for an item instead of reaching across someone.",
    practiceTe:
      "ఇంట్లో భోజన స్థలం సిద్ధం చేయండి. నాప్‌కిన్ వాడటం, ఎదుటివారిపై నుంచి చేయి చాపకుండా వస్తువును మర్యాదగా అడగటం సాధన చేయండి.",
  },

  {
    id: "HDm9Q_UGZBA",
    topic: "Dressing & etiquette",
    topics: ["Functions & celebrations"],
    audio: "en",
    title:
      "FAVORITE SPRING DRESSES | Versatile Dresses Suitable For Casual Outings, Work or A Cocktail Party",
    author: "Jamila Musayeva",
    te: "ఒకే దుస్తులను వేర్వేరు సందర్భాలకు సిద్ధం చేయండి",
    note: "See how shoes and accessories change an outfit for work or a gathering. Use pieces you already own.",
    noteTe:
      "చెప్పులు, యాక్సెసరీలతో దుస్తులను ఉద్యోగానికి లేదా వేడుకకు ఎలా మార్చుకోవాలో చూడండి. మీ వద్ద ఉన్నవే వాడండి.",
    practice:
      "Create two versions of one outfit: everyday and a celebration. Check comfort, weather and the invitation before choosing.",
    practiceTe:
      "ఒక దుస్తుల సెట్‌ను రోజువారీ అవసరానికి, వేడుకకు రెండు రకాలుగా సిద్ధం చేయండి. సౌకర్యం, వాతావరణం, ఆహ్వానం పరిశీలించండి.",
  },

  {
    id: "43kVI33M0gc",
    topic: "Functions & celebrations",
    topics: ["Dressing & etiquette"],
    audio: "en",
    title: "Cocktail Dress Code & My Favorite Cocktail Outfits",
    author: "Jamila Musayeva",
    te: "వేడుకల దుస్తుల నియమాలను అర్థం చేసుకోండి",
    note: "Understand one common event dress code. Family functions and cultural ceremonies may follow different expectations.",
    noteTe:
      "వేడుకల్లో ఉపయోగించే ఒక సాధారణ డ్రెస్ కోడ్‌ను తెలుసుకోండి. కుటుంబ, సాంస్కృతిక వేడుకల పద్ధతులు వేరుగా ఉండవచ్చు.",
    practice:
      "For your next function, confirm the dress code with the host, choose an outfit and rehearse a warm greeting.",
    practiceTe:
      "తదుపరి వేడుకకు ఆతిథ్యమిచ్చేవారిని డ్రెస్ కోడ్ అడగండి. దుస్తులు ఎంచుకుని, ఆప్యాయంగా పలకరించడం సాధన చేయండి.",
  },

  {
    id: "seu1p01ibDU",
    topic: "Public appearances",
    topics: ["Functions & celebrations"],
    audio: "en",
    title:
      "How to sit, stand and pick dropped items elegantly (Deportment, Part 2)",
    author: "Jamila Musayeva",
    te: "సభల్లో సౌకర్యంగా కూర్చోవడం, నిలబడటం",
    note: "Observe movement and posture demonstrations. Adapt every movement to your comfort and mobility.",
    noteTe:
      "కదలికలు, భంగిమల ప్రదర్శనలను చూడండి. మీ సౌకర్యం, కదలిక సామర్థ్యానికి అనుగుణంగా మార్చుకోండి.",
    practice:
      "Rehearse entering a room, greeting someone and settling comfortably into a seat. Choose a natural posture you can sustain.",
    practiceTe:
      "గదిలోకి రావడం, పలకరించడం, సౌకర్యంగా కూర్చోవడం సాధన చేయండి. మీకు సహజంగా అనిపించే భంగిమను ఎంచుకోండి.",
  },

  {
    id: "1A484E_VfSU",
    topic: "Holiday & vacation",
    topics: ["Dressing & etiquette"],
    audio: "en",
    title:
      "11 Pieces, 29 Outfits: Summer Travel Capsule In A Carry-On Suitcase",
    author: "Audrey Coyne",
    te: "తక్కువ దుస్తులతో ప్రయాణానికి సిద్ధం అవ్వండి",
    note: "A travel wardrobe demonstration for mixing and reusing clothes across a trip.",
    noteTe: "ప్రయాణంలో దుస్తులను కలిపి, మళ్లీ ఉపయోగించే విధానాల ప్రదర్శన.",
    practice:
      "Plan outfits for a travel day, sightseeing and dinner using shared pieces. Check the forecast, walking comfort and local dress expectations.",
    practiceTe:
      "ఒకే దుస్తులను కలిపి ప్రయాణం, ప్రదేశాల సందర్శన, విందుకు సెట్‌లు సిద్ధం చేయండి. వాతావరణం, నడక సౌకర్యం, స్థానిక పద్ధతులు పరిశీలించండి.",
  },

  {
    id: "cD5en_mMIIE",
    topic: "Public appearances",
    topics: ["Holiday & vacation", "Functions & celebrations"],
    audio: "en",
    title: "Basic Manners Everyone Should Have",
    author: "Jamila Musayeva",
    te: "బయట పాటించాల్సిన సాధారణ మర్యాదలు",
    note: "Everyday courtesy for shared spaces and social encounters, useful at events and while travelling.",
    noteTe:
      "ఉమ్మడి ప్రదేశాలు, సామాజిక సందర్భాల్లో మర్యాదలు. వేడుకల్లో, ప్రయాణాల్లో ఉపయోగపడతాయి.",
    practice:
      "At your next outing, leave space for others, keep your phone quiet and thank someone who helps you. Notice how it changes the interaction.",
    practiceTe:
      "తదుపరి బయటకు వెళ్లినప్పుడు ఇతరులకు చోటివ్వండి, ఫోన్ నిశ్శబ్దంగా ఉంచండి, సహాయం చేసినవారికి ధన్యవాదాలు చెప్పండి. స్పందనను గమనించండి.",
  },
];
export function videoUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}
export function embedUrl(id: string, language: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&hl=${language}&cc_load_policy=1`;
}

export const practiceVideoTopics: Record<string, string[]> = {
  introduction: ["Speaking", "Public appearances"],
  listening: ["Listening"],
  wardrobe: [
    "Dressing & etiquette",
    "Functions & celebrations",
    "Holiday & vacation",
  ],
  dining: ["Dining & etiquette"],
  posture: ["Public appearances", "Confidence"],
  story: ["Speaking"],
  grooming: ["Dressing & etiquette", "Holiday & vacation"],
  network: ["Functions & celebrations", "Public appearances", "Listening"],
};
export function matchesVideoTopic(video: CoachingVideo, topic: string) {
  return video.topic === topic || !!video.topics?.includes(topic);
}
export function videosForPractice(exerciseId: string) {
  const topics = practiceVideoTopics[exerciseId] || [];
  return coachingVideos.filter((video) =>
    topics.some((topic) => matchesVideoTopic(video, topic)),
  );
}
