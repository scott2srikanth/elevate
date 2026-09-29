// Elevate One v0.1. Synthetic-policy model; not validated on real coaching data.
import type { DecisionModel } from "./engine";
const model: DecisionModel = {
  version: "0.1.0",
  features: {
    required_formality: {
      label: "Required formality",
      group: "Context",
      default: 0.8,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    outfit_formality: {
      label: "Outfit formality",
      group: "Context",
      default: 0.65,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    heat: {
      label: "Heat / need for breathable clothing",
      group: "Context",
      default: 0.7,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    rain: {
      label: "Rain likelihood",
      group: "Context",
      default: 0.1,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    event_soon: {
      label: "Event urgency",
      group: "Context",
      default: 0.8,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    video_call: {
      label: "Video call relevance",
      group: "Context",
      default: 1,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    culture_known: {
      label: "Local etiquette context known",
      group: "Context",
      default: 0.8,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    event_importance: {
      label: "Event importance",
      group: "Context",
      default: 0.8,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    fit: {
      label: "Clothing comfort and fit",
      group: "Presentation",
      default: 0.7,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    color_match: {
      label: "Color coordination preference",
      group: "Presentation",
      default: 0.75,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    accessory_match: {
      label: "Accessory coordination",
      group: "Presentation",
      default: 0.8,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    framing: {
      label: "Camera framing",
      group: "Presentation",
      default: 0.75,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    lighting: {
      label: "Lighting clarity",
      group: "Presentation",
      default: 0.7,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    background: {
      label: "Background tidiness",
      group: "Presentation",
      default: 0.45,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    shoe_condition: {
      label: "Shoe maintenance",
      group: "Presentation",
      default: 0.8,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    hair_ready: {
      label: "Hair readiness for chosen style",
      group: "Grooming",
      default: 0.8,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    facial_hair_ready: {
      label: "Facial hair readiness / not applicable",
      group: "Grooming",
      default: 0.8,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    nails_ready: {
      label: "Nail readiness",
      group: "Grooming",
      default: 0.8,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    clothes_ready: {
      label: "Clothing cleanliness",
      group: "Grooming",
      default: 0.9,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    grooming_ready: {
      label: "Self-reported grooming readiness",
      group: "Grooming",
      default: 0.8,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    posture: {
      label: "Comfortable posture",
      group: "Presence",
      default: 0.45,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    head_position: {
      label: "Camera head position",
      group: "Presence",
      default: 0.7,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    shoulders: {
      label: "Comfortable shoulder alignment",
      group: "Presence",
      default: 0.7,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    eye_direction: {
      label: "Camera gaze preference met",
      group: "Presence",
      default: 0.65,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    gesture_control: {
      label: "Intentional gestures",
      group: "Presence",
      default: 0.6,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    stillness: {
      label: "Comfortable movement level",
      group: "Presence",
      default: 0.65,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    standing: {
      label: "Comfortable standing setup",
      group: "Presence",
      default: 0.7,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    seating: {
      label: "Comfortable sitting setup",
      group: "Presence",
      default: 0.7,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    greeting: {
      label: "Greeting preparation",
      group: "Etiquette",
      default: 0.7,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    turn_taking: {
      label: "Conversational turn taking",
      group: "Etiquette",
      default: 0.7,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    listening: {
      label: "Listening practice",
      group: "Etiquette",
      default: 0.7,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    phone_away: {
      label: "Phone distraction readiness",
      group: "Etiquette",
      default: 0.8,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    dining: {
      label: "Dining etiquette preparation",
      group: "Etiquette",
      default: 0.6,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    shirt_available: {
      label: "Suitable shirt available",
      group: "Wardrobe",
      default: 1,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    trousers_available: {
      label: "Suitable trousers available",
      group: "Wardrobe",
      default: 1,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    shoes_available: {
      label: "Suitable shoes available",
      group: "Wardrobe",
      default: 1,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    blazer_available: {
      label: "Blazer available",
      group: "Wardrobe",
      default: 1,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    wardrobe_gap: {
      label: "Self-reported wardrobe gap",
      group: "Wardrobe",
      default: 0.2,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    pace: {
      label: "Comfortable speech pace",
      group: "Voice",
      default: 0.45,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    volume: {
      label: "Audible speech volume",
      group: "Voice",
      default: 0.7,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    pauses: {
      label: "Intentional pauses",
      group: "Voice",
      default: 0.6,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    intro_ready: {
      label: "Introduction prepared",
      group: "Voice",
      default: 0.4,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    clarity: {
      label: "Speech clarity",
      group: "Voice",
      default: 0.7,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    practice_recent: {
      label: "Recent practice frequency",
      group: "Personal state",
      default: 0.3,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    progress: {
      label: "Self-reported recent progress",
      group: "Personal state",
      default: 0.5,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    time_available: {
      label: "Available practice time (0\u201320 minutes)",
      group: "Personal state",
      default: 0.5,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    fatigue: {
      label: "Self-reported fatigue",
      group: "Personal state",
      default: 0.2,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    goal_presence: {
      label: "Presence goal priority",
      group: "Personal state",
      default: 1,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    goal_style: {
      label: "Style goal priority",
      group: "Personal state",
      default: 0.7,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    goal_etiquette: {
      label: "Etiquette goal priority",
      group: "Personal state",
      default: 0.5,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    coach_requested: {
      label: "Human coach requested",
      group: "Personal state",
      default: 0,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
    evidence_quality: {
      label: "Observation quality",
      group: "Personal state",
      default: 0.9,
      min: 0,
      max: 1,
      description:
        "User-reported or externally observed score; 0 = low, 1 = high.",
    },
  },
  heads: [
    {
      id: "clothing_fit",
      title: "Clothing fit",
      family: "Presentation",
      inputs: ["fit"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention:
          "Check clothing comfort and adjust the fit if you wish.",
      },
      weights: [
        [-1.0170313776488884, -3.879506031253706],
        [1.0286248471822643, -0.0652348852951899],
        [-0.1533123435659833, 3.7373620915955956],
      ],
      temperature: 0.9658268932258749,
    },
    {
      id: "formality_match",
      title: "Formality for the occasion",
      family: "Presentation",
      inputs: ["outfit_formality", "required_formality"],
      options: ["needs_attention", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention:
          "Review the event dress expectations and choose an outfit you are comfortable in.",
      },
      weights: [
        [-0.9464335193806162, -2.138862667454619, 2.1579912155369],
        [0.946433519380616, 2.138862667454619, -2.1579912155369],
      ],
      temperature: 0.9658268932258749,
    },
    {
      id: "color_coordination",
      title: "Color coordination",
      family: "Presentation",
      inputs: ["color_match"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention:
          "Choose a color combination that matches your stated preferences.",
      },
      weights: [
        [-1.0810217922852976, -3.9877345832069353],
        [1.0943304300760255, -0.0834025638340528],
        [0.03548076065111043, 3.742073063051359],
      ],
      temperature: 0.9418050791683993,
    },
    {
      id: "accessory_coordination",
      title: "Accessory coordination",
      family: "Presentation",
      inputs: ["accessory_match"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Review accessories with your chosen outfit.",
      },
      weights: [
        [-1.0421679890329132, -3.945085905363216],
        [1.0532495160469135, -0.18526105261587145],
        [-0.11565931338507984, 3.71853700920763],
      ],
      temperature: 1.0,
    },
    {
      id: "photo_framing",
      title: "Camera framing",
      family: "Presentation",
      inputs: ["framing"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention:
          "Place the camera at a comfortable height and check the frame.",
      },
      weights: [
        [-1.0811839941282602, -4.012951224650533],
        [1.0899594141589704, -0.03717865566178902],
        [-0.050940765352760174, 3.8231487773139308],
      ],
      temperature: 0.9658268932258749,
    },
    {
      id: "lighting_readiness",
      title: "Lighting readiness",
      family: "Presentation",
      inputs: ["lighting"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Face a soft light source and check the preview.",
      },
      weights: [
        [-1.0630993436835479, -3.93272835291129],
        [1.0732255474180958, -0.05194309673147378],
        [-0.07684589816677743, 3.73553006030183],
      ],
      temperature: 0.9418050791683993,
    },
    {
      id: "background_readiness",
      title: "Background readiness",
      family: "Presentation",
      inputs: ["background"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention:
          "Tidy the visible background or use a background effect.",
      },
      weights: [
        [-1.0181751829238495, -3.8150874511853536],
        [1.0313988290361433, -0.1892040701487439],
        [-0.09985952844087913, 3.5955505806722177],
      ],
      temperature: 0.9658268932258749,
    },
    {
      id: "video_setup",
      title: "Video setup readiness",
      family: "Presentation",
      inputs: ["lighting", "framing", "background"],
      options: ["needs_attention", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Do a short video-call setup check.",
      },
      weights: [
        [
          0.26091107955533605, -0.9863814399871867, -1.0131561400984606,
          -0.7556252190878451,
        ],
        [
          -0.2609110795553354, 0.9863814399871865, 1.0131561400984606,
          0.7556252190878451,
        ],
      ],
      temperature: 1.041631467639684,
    },
    {
      id: "hair_readiness",
      title: "Hair readiness",
      family: "Grooming",
      inputs: ["hair_ready"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Check your hair against your preferred style.",
      },
      weights: [
        [-1.1227068689711712, -3.9963692296065885],
        [1.129693755900745, 0.025578508190766215],
        [0.043504961104673175, 3.7672526667697066],
      ],
      temperature: 1.0954451150103324,
    },
    {
      id: "facial_hair_readiness",
      title: "Facial hair readiness",
      family: "Grooming",
      inputs: ["facial_hair_ready"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention:
          "Review facial hair only if relevant to your chosen style.",
      },
      weights: [
        [-1.0675767586835512, -3.9699134031697563],
        [1.078777311502864, -0.205191157634111],
        [-0.01737300884000802, 3.725539564153499],
      ],
      temperature: 0.9418050791683993,
    },
    {
      id: "nail_readiness",
      title: "Nail readiness",
      family: "Grooming",
      inputs: ["nails_ready"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Do a quick nail maintenance check if needed.",
      },
      weights: [
        [-0.960594045082869, -3.8814344920937773],
        [0.9920054731556869, -0.27759289497369566],
        [-0.1048085008695403, 3.664094153412418],
      ],
      temperature: 0.8955389853880862,
    },
    {
      id: "shoe_readiness",
      title: "Shoe readiness",
      family: "Grooming",
      inputs: ["shoe_condition"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Check that your shoes are clean and comfortable.",
      },
      weights: [
        [-1.0261922319370196, -3.8282422929748217],
        [1.0364826915581467, -0.11876867104703409],
        [-0.08513526422746485, 3.6355415126856516],
      ],
      temperature: 0.8515457094986882,
    },
    {
      id: "clothing_care",
      title: "Clothing care",
      family: "Grooming",
      inputs: ["clothes_ready"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Prepare clean clothing and check for creases.",
      },
      weights: [
        [-1.111226117344124, -4.003987100302543],
        [1.116908061690965, -0.04237625052014207],
        [-0.042368628951912624, 3.7653989810056516],
      ],
      temperature: 1.0,
    },
    {
      id: "grooming_readiness",
      title: "Grooming readiness",
      family: "Grooming",
      inputs: ["grooming_ready"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Follow your usual grooming routine.",
      },
      weights: [
        [-1.0500890242084424, -3.9494534448273506],
        [1.0626645528823853, -0.14632179426801678],
        [-0.10831970411721248, 3.72808208179705],
      ],
      temperature: 1.0681994677338755,
    },
    {
      id: "posture_comfort",
      title: "Posture comfort",
      family: "Body language",
      inputs: ["posture"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Try a comfortable posture reset for 60 seconds.",
      },
      weights: [
        [-1.0595406685722837, -4.067767086159613],
        [1.0703923932913442, -0.2043632201389609],
        [-0.06567725586282923, 3.804277816932601],
      ],
      temperature: 0.8955389853880862,
    },
    {
      id: "head_position",
      title: "Head position in frame",
      family: "Body language",
      inputs: ["head_position"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Adjust the camera to your comfortable head position.",
      },
      weights: [
        [-1.0286555480776944, -3.8406126448259834],
        [1.0379942138955525, -0.11472624094726507],
        [-0.06583824283896587, 3.6536008466307766],
      ],
      temperature: 0.9904614110830812,
    },
    {
      id: "shoulder_comfort",
      title: "Shoulder comfort",
      family: "Body language",
      inputs: ["shoulders"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Relax your shoulders without forcing a position.",
      },
      weights: [
        [-0.97710940866785, -3.895671998975724],
        [0.9953497467518888, -0.2035978671088544],
        [-0.2208063698696407, 3.731578005194965],
      ],
      temperature: 0.8955389853880862,
    },
    {
      id: "camera_gaze",
      title: "Camera gaze preference",
      family: "Body language",
      inputs: ["eye_direction"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention:
          "Practice your preferred camera gaze; direct gaze is optional.",
      },
      weights: [
        [-1.0404296897472733, -3.84400853088556],
        [1.0440998811887254, -0.20753228429061937],
        [-0.16768594764060066, 3.656665433483143],
      ],
      temperature: 0.9183807298891972,
    },
    {
      id: "gesture_control",
      title: "Intentional gestures",
      family: "Body language",
      inputs: ["gesture_control"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention:
          "Practice one introduction using comfortable gestures.",
      },
      weights: [
        [-1.052666124797468, -4.05214938842811],
        [1.0648317599012167, -0.16038506661939944],
        [-0.10232063744352683, 3.849529109932953],
      ],
      temperature: 1.041631467639684,
    },
    {
      id: "movement_comfort",
      title: "Movement comfort",
      family: "Body language",
      inputs: ["stillness"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Adjust your setup so movement feels comfortable.",
      },
      weights: [
        [-1.018666857915506, -3.8306373832832183],
        [1.0298988394849913, -0.137671702610559],
        [-0.13876974398499198, 3.6400741761552853],
      ],
      temperature: 0.8303662695405645,
    },
    {
      id: "standing_setup",
      title: "Standing setup",
      family: "Body language",
      inputs: ["standing"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Check your standing setup for comfort.",
      },
      weights: [
        [-1.0514384656276692, -3.792705871732273],
        [1.0621515766897234, -0.11055719677175219],
        [-0.14439543281832767, 3.61342197397641],
      ],
      temperature: 0.9658268932258749,
    },
    {
      id: "sitting_setup",
      title: "Sitting setup",
      family: "Body language",
      inputs: ["seating"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention:
          "Adjust your chair and screen to a comfortable position.",
      },
      weights: [
        [-1.1109624896547592, -4.1109298454396725],
        [1.1197118582562053, -0.02528169481439459],
        [-0.037733719088184764, 3.901648408153299],
      ],
      temperature: 0.9658268932258749,
    },
    {
      id: "greeting_readiness",
      title: "Greeting preparation",
      family: "Etiquette",
      inputs: ["greeting"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention:
          "Prepare a greeting appropriate to the people and setting.",
      },
      weights: [
        [-1.0682255813715118, -3.9796648900413665],
        [1.0792144144366371, -0.1217656399905107],
        [-0.12885017999562398, 3.7485140728689608],
      ],
      temperature: 0.9658268932258749,
    },
    {
      id: "turn_taking",
      title: "Turn taking",
      family: "Etiquette",
      inputs: ["turn_taking"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Practice pausing and giving others space to respond.",
      },
      weights: [
        [-1.0547285185357147, -3.8270155329551754],
        [1.0645741293635897, -0.08411671924212835],
        [0.0013166323649525568, 3.6035019502231607],
      ],
      temperature: 0.8515457094986882,
    },
    {
      id: "active_listening",
      title: "Listening practice",
      family: "Etiquette",
      inputs: ["listening"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention:
          "Prepare one follow-up question and practice listening.",
      },
      weights: [
        [-1.033979276615472, -3.9734402724508593],
        [1.051992587683147, -0.3529318594572914],
        [-0.19692255419548774, 3.7337340654707702],
      ],
      temperature: 0.8732653552592323,
    },
    {
      id: "phone_etiquette",
      title: "Phone distractions",
      family: "Etiquette",
      inputs: ["phone_away"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Set a phone notification preference for the meeting.",
      },
      weights: [
        [-1.0452083257122524, -3.874547630930256],
        [1.0563961208450663, -0.10114711348487933],
        [-0.13968535057933068, 3.66020818064779],
      ],
      temperature: 0.9183807298891972,
    },
    {
      id: "dining_readiness",
      title: "Dining preparation",
      family: "Etiquette",
      inputs: ["dining"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention:
          "Review the host\u2019s dining expectations if relevant.",
      },
      weights: [
        [-1.0265110146023397, -3.887483357058364],
        [1.0386246917611588, -0.21112949159890648],
        [-0.1071758644886905, 3.6415942611143555],
      ],
      temperature: 1.0,
    },
    {
      id: "cultural_context",
      title: "Etiquette context available",
      family: "Etiquette",
      inputs: ["culture_known"],
      options: ["ask_context", "sufficient"],
      threshold: 0.7,
      actions: {
        ask_context:
          "Ask about the host\u2019s or event\u2019s expectations; do not assume cultural rules.",
      },
      weights: [
        [0.011571490803899671, -2.5606378040000406],
        [-0.011571490803899772, 2.5606378040000406],
      ],
      temperature: 1.1520389286233605,
    },
    {
      id: "shirt_selection",
      title: "Shirt candidate",
      family: "Wardrobe",
      inputs: ["shirt_available", "outfit_formality", "required_formality"],
      options: ["review_options", "use_available"],
      threshold: 0.7,
      actions: {
        review_options: "Review available shirt options.",
      },
      weights: [
        [
          -0.1998888184893097, -2.0719438525715157, -0.5143210280419797,
          0.5174781267905906,
        ],
        [
          0.19988881848930945, 2.0719438525715153, 0.5143210280419798,
          -0.5174781267905901,
        ],
      ],
      temperature: 0.9418050791683993,
    },
    {
      id: "trouser_selection",
      title: "Trouser candidate",
      family: "Wardrobe",
      inputs: ["trousers_available"],
      options: ["review_options", "use_available"],
      threshold: 0.7,
      actions: {
        review_options: "Review available trouser options.",
      },
      weights: [
        [-0.20343654680927467, -2.280990178321926],
        [0.20343654680927742, 2.2809901783219284],
      ],
      temperature: 0.8955389853880862,
    },
    {
      id: "shoe_selection",
      title: "Shoe candidate",
      family: "Wardrobe",
      inputs: ["shoes_available", "shoe_condition"],
      options: ["review_options", "use_available"],
      threshold: 0.7,
      actions: {
        review_options: "Review comfortable shoe options.",
      },
      weights: [
        [0.2463286528661242, -1.729555522567316, -0.973018387086014],
        [-0.2463286528661242, 1.7295555225673165, 0.973018387086014],
      ],
      temperature: 0.9658268932258749,
    },
    {
      id: "blazer_recommendation",
      title: "Add an available blazer",
      family: "Wardrobe",
      inputs: ["required_formality", "heat", "blazer_available"],
      options: ["skip", "add"],
      threshold: 0.7,
      actions: {},
      weights: [
        [
          0.9745196034017397, -2.0345697617516563, 1.021912621494644,
          -1.5002669608784656,
        ],
        [
          -0.9745196034017393, 2.0345697617516563, -1.021912621494644,
          1.500266960878465,
        ],
      ],
      temperature: 1.0954451150103324,
    },
    {
      id: "breathable_layers",
      title: "Breathable layers",
      family: "Wardrobe",
      inputs: ["heat"],
      options: ["optional", "prioritize"],
      threshold: 0.7,
      actions: {},
      weights: [
        [-0.004690642185880724, -2.4138315069831844],
        [0.00469064218588097, 2.4138315069831844],
      ],
      temperature: 0.9183807298891972,
    },
    {
      id: "rain_preparation",
      title: "Rain preparation",
      family: "Wardrobe",
      inputs: ["rain"],
      options: ["not_needed", "prepare"],
      threshold: 0.7,
      actions: {},
      weights: [
        [0.02057190469571101, -2.3619390767930466],
        [-0.020571904695710935, 2.3619390767930466],
      ],
      temperature: 0.8955389853880862,
    },
    {
      id: "wardrobe_review",
      title: "Wardrobe review",
      family: "Wardrobe",
      inputs: ["wardrobe_gap", "goal_style"],
      options: ["not_now", "review"],
      threshold: 0.7,
      actions: {},
      weights: [
        [-0.24556086613127762, -1.745341769434124, -0.4926918620006948],
        [0.2455608661312783, 1.745341769434124, 0.49269186200069487],
      ],
      temperature: 1.0157242604501195,
    },
    {
      id: "speech_pacing",
      title: "Speech pacing",
      family: "Voice",
      inputs: ["pace"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention:
          "Record a 60-second introduction at a comfortable pace.",
      },
      weights: [
        [-1.0307310152302072, -3.7982934003043813],
        [1.0445088945518954, -0.12034892586354944],
        [-0.04180427362133228, 3.5775989526744163],
      ],
      temperature: 0.9418050791683993,
    },
    {
      id: "voice_volume",
      title: "Audible volume",
      family: "Voice",
      inputs: ["volume"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Check your microphone volume with a short recording.",
      },
      weights: [
        [-1.0317900096773807, -3.783184734386181],
        [1.0392870905005578, 0.07354159360452495],
        [-0.061142582377863235, 3.627406327880289],
      ],
      temperature: 1.0,
    },
    {
      id: "intentional_pauses",
      title: "Intentional pauses",
      family: "Voice",
      inputs: ["pauses"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Practice a short pause between your main points.",
      },
      weights: [
        [-1.0107145523027934, -3.8740342116799584],
        [1.0240922697369916, -0.14166195173037854],
        [-0.19740227879915404, 3.7072629386717786],
      ],
      temperature: 0.9183807298891972,
    },
    {
      id: "introduction_readiness",
      title: "Introduction preparation",
      family: "Voice",
      inputs: ["intro_ready"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Prepare a 60-second introduction for the meeting.",
      },
      weights: [
        [-1.0826323980095365, -4.033733506455632],
        [1.0929835004177635, -0.16084085729692138],
        [-0.06330121386803701, 3.787816198613461],
      ],
      temperature: 1.0681994677338755,
    },
    {
      id: "speech_clarity",
      title: "Speech clarity",
      family: "Voice",
      inputs: ["clarity"],
      options: ["needs_attention", "acceptable", "ready"],
      threshold: 0.7,
      actions: {
        needs_attention: "Practice the key points in your own words.",
      },
      weights: [
        [-1.1288131197462548, -3.992164316594547],
        [1.1352210242454412, 0.0689004304554379],
        [-0.024303990577661454, 3.8186126807401917],
      ],
      temperature: 1.041631467639684,
    },
    {
      id: "next_focus",
      title: "Next coaching focus",
      family: "Coaching",
      inputs: [
        "posture",
        "fit",
        "greeting",
        "pace",
        "goal_presence",
        "goal_style",
        "goal_etiquette",
      ],
      options: ["presence", "style", "etiquette", "voice"],
      threshold: 0.7,
      actions: {},
      weights: [
        [
          0.03243407359592451, -1.534329156038482, 0.7950537157931679,
          0.7233830115602123, 0.8343291727127707, 0.49603165835328084,
          -0.246187857518434, -0.22076423522620492,
        ],
        [
          -0.03319167889830933, 0.8514084840621754, -1.5270466003908985,
          0.7927250179378764, 0.8483841453735277, -0.4747479578685347,
          0.6869965777589596, -0.348723325433274,
        ],
        [
          0.005771498312784948, 0.8220169460088907, 0.8925840918192505,
          -1.452854381211081, 0.9625776720337572, -0.5093062867404656,
          -0.2665430172243997, 0.7535939146854468,
        ],
        [
          -0.009244417268964045, 0.9298598474792847, 0.891011662100296,
          0.7924339880332877, -1.5542774971315947, 0.488323963788623,
          -0.1902369792921613, -0.2217959837853108,
        ],
      ],
      temperature: 0.9904614110830812,
    },
    {
      id: "next_exercise",
      title: "Next exercise",
      family: "Coaching",
      inputs: ["posture", "intro_ready", "listening", "practice_recent"],
      options: ["posture_reset", "short_introduction", "listening_drill"],
      threshold: 0.7,
      actions: {
        posture_reset: "Practice a comfortable 60-second posture reset.",
        short_introduction: "Record and review a 60-second introduction.",
        listening_drill:
          "Practice listening and asking one follow-up question.",
      },
      weights: [
        [
          -0.5046033101239574, -1.6919963323306755, 1.4839001567979615,
          1.200565042632174, -0.5463101657648106,
        ],
        [
          0.49129447472503895, 1.2953179042247471, -1.741165535507917,
          1.3440410148589834, 0.5178420528881783,
        ],
        [
          -0.042713889658058245, 1.2512387202478297, 1.3179999204520296,
          -1.649483371940514, 0.02969050754283276,
        ],
      ],
      temperature: 0.9418050791683993,
    },
    {
      id: "next_lesson",
      title: "Next lesson",
      family: "Coaching",
      inputs: ["fit", "greeting", "clarity", "goal_style", "goal_etiquette"],
      options: ["outfit_basics", "meeting_etiquette", "clear_introduction"],
      threshold: 0.7,
      actions: {},
      weights: [
        [
          0.44295115820772696, -1.6136391468913103, 1.318820984876114,
          1.2214443057449194, 0.6388003642140312, -0.3393955146387644,
        ],
        [
          0.4986372690028046, 1.3132376691779442, -1.6462574744174185,
          1.198316737583756, -0.34717705637447965, 0.6607935213277589,
        ],
        [
          -0.473832085690606, 1.2235030846033288, 1.2756237603751732,
          -1.6336920621366895, -0.33724174294863274, -0.36901480362964384,
        ],
      ],
      temperature: 1.041631467639684,
    },
    {
      id: "practice_duration",
      title: "Practice duration",
      family: "Coaching",
      inputs: ["time_available", "fatigue"],
      options: ["two_minutes", "five_minutes"],
      threshold: 0.7,
      actions: {},
      weights: [
        [0.26095203962855956, -1.7047641559308049, 0.9719292812952569],
        [-0.2609520396285593, 1.704764155930805, -0.9719292812952577],
      ],
      temperature: 1.0157242604501195,
    },
    {
      id: "daily_challenge",
      title: "Daily challenge",
      family: "Coaching",
      inputs: ["progress", "practice_recent", "fatigue"],
      options: ["repeat_familiar", "try_next_step"],
      threshold: 0.7,
      actions: {},
      weights: [
        [
          0.5254672567080488, -0.9235993102060124, -0.7310059558207519,
          1.2384515829764013,
        ],
        [
          -0.5254672567080486, 0.9235993102060127, 0.7310059558207519,
          -1.2384515829764016,
        ],
      ],
      temperature: 1.0,
    },
    {
      id: "progress_review",
      title: "Review progress",
      family: "Coaching",
      inputs: ["practice_recent", "progress"],
      options: ["continue", "review"],
      threshold: 0.7,
      actions: {},
      weights: [
        [0.20816158113308508, -1.3920883371377253, 0.7717190355167667],
        [-0.20816158113308522, 1.3920883371377253, -0.7717190355167662],
      ],
      temperature: 0.9658268932258749,
    },
    {
      id: "preparation_priority",
      title: "Preparation priority",
      family: "Coaching",
      inputs: ["event_soon", "event_importance"],
      options: ["routine", "prepare_today"],
      threshold: 0.7,
      actions: {},
      weights: [
        [0.23812757207821889, -1.1536808980500535, -1.0111426429848607],
        [-0.23812757207821897, 1.153680898050054, 1.0111426429848605],
      ],
      temperature: 0.8515457094986882,
    },
    {
      id: "ask_more_information",
      title: "More observations needed",
      family: "Routing",
      inputs: ["evidence_quality"],
      options: ["continue", "ask"],
      threshold: 0.7,
      actions: {},
      weights: [
        [0.02809668840876592, 2.4271842504892276],
        [-0.02809668840876434, -2.4271842504892276],
      ],
      temperature: 0.9904614110830812,
    },
    {
      id: "human_coach",
      title: "Human coach support",
      family: "Routing",
      inputs: ["coach_requested", "progress"],
      options: ["self_guided", "offer_coach"],
      threshold: 0.7,
      actions: {},
      weights: [
        [0.3276200132474484, -2.456582253434441, 0.2643371042242059],
        [-0.32762001324744816, 2.4565822534344406, -0.2643371042242058],
      ],
      temperature: 0.8515457094986882,
    },
    {
      id: "session_readiness",
      title: "Ready to practice",
      family: "Routing",
      inputs: ["fatigue", "time_available"],
      options: ["pause", "practice"],
      threshold: 0.7,
      actions: {},
      weights: [
        [0.029999113044735223, 1.6770465822787042, -0.7430410519282297],
        [-0.029999113044735955, -1.677046582278704, 0.7430410519282294],
      ],
      temperature: 0.8955389853880862,
    },
  ],
};
export default model;
