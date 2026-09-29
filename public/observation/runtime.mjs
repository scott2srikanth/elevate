import { exposure, poseSignals, speechSignals } from "./signals.mjs";
const $ = (id) => document.getElementById(id);
const session = new URLSearchParams(location.search).get("session") || "";
let busy = false,
  generation = 0,
  pose,
  detector;
const status = (text) => {
  $("status").textContent = text;
};
const metric = (key, value, unit, reliability = 0.8) => ({
  key,
  value,
  unit,
  reliability,
});
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () =>
      reject(
        Error("Model runtime could not load. Check your connection and retry."),
      );
    document.head.append(script);
  });
}
async function poseModel() {
  if (!pose) {
    const { FilesetResolver, PoseLandmarker } =
      await import("./vendor/vision/vision_bundle.mjs");
    const files = await FilesetResolver.forVisionTasks("./vendor/vision/wasm");
    pose = await PoseLandmarker.createFromOptions(files, {
      baseOptions: {
        modelAssetPath: "./vendor/pose_landmarker_lite.task",
        delegate: "CPU",
      },
      runningMode: "IMAGE",
      numPoses: 2,
      minPoseDetectionConfidence: 0.7,
      minPosePresenceConfidence: 0.7,
    });
  }
  return pose;
}
async function vadModel() {
  if (!detector) {
    if (!window.ort) await loadScript("./vendor/ort/dist/ort.wasm.min.js");
    if (!window.vad) await loadScript("./vendor/vad/dist/bundle.min.js");
    detector = await window.vad.NonRealTimeVAD.new({
      modelURL: "./vendor/vad/dist/silero_vad_legacy.onnx",
      positiveSpeechThreshold: 0.7,
      negativeSpeechThreshold: 0.4,
      minSpeechMs: 400,
      redemptionMs: 400,
      ortConfig: (ort) => {
        ort.env.wasm.wasmPaths = new URL(
          "./vendor/ort/dist/",
          location.href,
        ).href;
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.proxy = false;
      },
    });
  }
  return detector;
}
function event(target, name, action) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        finish(
          Error("Media decoding timed out. Try a shorter MP4, WAV or JPEG."),
        ),
      15000,
    );
    const done = () => finish();
    const fail = () =>
      finish(Error("This media format cannot be decoded on this device."));
    function finish(error) {
      clearTimeout(timer);
      target.removeEventListener(name, done);
      target.removeEventListener("error", fail);
      error ? reject(error) : resolve();
    }
    target.addEventListener(name, done, { once: true });
    target.addEventListener("error", fail, { once: true });
    action();
  });
}
async function visual(file, url, kind, token) {
  let media;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  try {
    media = document.createElement(kind === "photo" ? "img" : "video");
    if (kind === "video") {
      media.muted = true;
      media.playsInline = true;
      media.preload = "auto";
    }
    await event(media, kind === "photo" ? "load" : "loadeddata", () => {
      media.src = url;
    });
    if (
      kind === "video" &&
      (!Number.isFinite(media.duration) ||
        media.duration > 60 ||
        media.duration < 0.1)
    )
      throw Error("Choose a video no longer than 60 seconds.");
    const w = media.naturalWidth || media.videoWidth,
      h = media.naturalHeight || media.videoHeight;
    if (!w || !h || w * h > 40000000)
      throw Error("Choose an image or video below 40 megapixels.");
    canvas.width = Math.min(w, 640);
    canvas.height = Math.round((h * canvas.width) / w);
    const model = await poseModel();
    const count =
      kind === "photo"
        ? 1
        : Math.min(12, Math.max(2, Math.ceil(media.duration)));
    const rows = [];
    let light = 0;
    for (let i = 0; i < count; i++) {
      if (token !== generation) throw Error("Analysis cancelled.");
      status(
        `Checking ${kind === "photo" ? "photo" : `frame ${i + 1} of ${count}`}…`,
      );
      if (kind === "video") {
        const time = ((i + 0.5) * media.duration) / count;
        await event(media, "seeked", () => {
          media.currentTime = time;
        });
      }
      ctx.drawImage(media, 0, 0, canvas.width, canvas.height);
      light += exposure(
        ctx.getImageData(0, 0, canvas.width, canvas.height).data,
      );
      const row = poseSignals(model.detect(canvas).landmarks);
      if (row) rows.push(row);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const metrics = [
      metric("lighting", light / count, "score"),
      metric("frames", count, "count", 1),
    ];
    const notes = [
      "Lighting is an overall exposure proxy; framing assumes a solo camera presentation.",
    ];
    if (rows.length / count >= 0.7) {
      const reliability =
        (Math.min(...rows.map((r) => r.reliability)) * rows.length) / count;
      for (const key of ["framing", "head_position"])
        metrics.push(
          metric(
            key,
            rows.reduce((a, r) => a + r[key], 0) / rows.length,
            "score",
            reliability,
          ),
        );
    } else
      notes.push(
        "A single visible head and shoulders were not reliably detected. No framing or head-position advice was inferred.",
      );
    return { metrics, notes };
  } finally {
    if (media) {
      if (kind === "video") media.pause();
      media.removeAttribute("src");
      if (kind === "video") media.load();
    }
    canvas.width = canvas.height = 0;
  }
}
async function audio(file, token) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext)
    throw Error("Audio analysis is not supported by this browser.");
  const context = new AudioContext();
  try {
    const buffer = await context.decodeAudioData(await file.arrayBuffer());
    if (buffer.duration > 60 || buffer.duration < 1)
      throw Error("Choose a recording between 1 and 60 seconds.");
    const samples = new Float32Array(buffer.length);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < samples.length; i++)
        samples[i] += data[i] / buffer.numberOfChannels;
    }
    const vad = await vadModel();
    const segments = [];
    for await (const segment of vad.run(samples, buffer.sampleRate)) {
      if (token !== generation) throw Error("Analysis cancelled.");
      segments.push({ start: segment.start, end: segment.end });
    }
    const values = speechSignals(samples, buffer.sampleRate, segments);
    if (!values || values.speech_seconds < 1)
      return {
        metrics: [],
        notes: [
          "Not enough speech was detected. Voice guidance was withheld; try a clear solo recording.",
        ],
      };
    const metrics = [
      metric("volume", values.volume, "dBFS"),
      metric("clipping", values.clipping, "fraction"),
      metric("speech_seconds", values.speech_seconds, "seconds"),
    ];
    if (values.pause_seconds !== null)
      metrics.push(
        metric(
          "pause_seconds",
          values.pause_seconds,
          "seconds",
          values.speech_seconds >= 3 ? 0.8 : 0.5,
        ),
      );
    return {
      metrics,
      notes: [
        "Volume is digital recording level, not vocal ability. Speech detection can mistake background sounds for speech. Gaps do not establish speaking pace or intent.",
      ],
    };
  } finally {
    await context.close();
  }
}
$("consent").onchange = () => {
  generation++;
  $("file").disabled = !$("consent").checked || busy;
  if (!$("consent").checked) {
    $("results").replaceChildren();
    status("Analysis disabled. Saved measurements can be cleared in AI Coach.");
  } else status("Choose a file to analyse automatically.");
};
$("file").onchange = async () => {
  const file = $("file").files[0];
  if (!file || busy || !$("consent").checked) return;
  const token = ++generation;
  busy = true;
  $("file").disabled = true;
  $("results").replaceChildren();
  let url;
  try {
    if (file.size > 20 * 1024 * 1024 || file.size === 0)
      throw Error("Choose a non-empty file up to 20 MB.");
    const kind = file.type.startsWith("image/")
      ? "photo"
      : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
          ? "audio"
          : null;
    if (!kind)
      throw Error(
        "Choose a JPEG/PNG photo, MP4/WebM video, or audio recording.",
      );
    url = URL.createObjectURL(file);
    status("Loading the local model and analysing…");
    let result =
      kind === "audio"
        ? await audio(file, token)
        : await visual(file, url, kind, token);
    if (kind === "video") {
      status("Checking the video audio track…");
      try {
        const voice = await audio(file, token);
        result.metrics.push(...voice.metrics);
        result.notes.push(...voice.notes);
      } catch {
        result.notes.push(
          "Video audio could not be decoded here. For voice analysis, choose a separate audio recording.",
        );
      }
    }
    if (token !== generation || !$("consent").checked) return;
    const report = {
      version: 1,
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      kind,
      model: "elevate-observe-0.1",
      modelRelease: location.pathname.match(/offline\/([a-f0-9]{64})\//)?.[1],
      ...result,
    };
    for (const m of report.metrics) {
      const el = document.createElement("div");
      el.className = "metric";
      el.textContent = `${m.key.replaceAll("_", " ")}: ${m.value.toFixed(2)} ${m.unit} · ${m.reliability >= 0.7 ? "usable" : "withheld"}`;
      $("results").append(el);
    }
    const list = document.createElement("ul");
    for (const note of report.notes) {
      const li = document.createElement("li");
      li.textContent = note;
      list.append(li);
    }
    $("results").append(list);
    const message = JSON.stringify({
      type: "elevate-observation",
      session,
      report,
    });
    if (window.ReactNativeWebView)
      window.ReactNativeWebView.postMessage(message);
    else if (parent !== window) parent.postMessage(message, location.origin);
    status("Check complete · your coaching is updated.");
  } catch (error) {
    status(
      error.message || "Analysis failed. Try a shorter supported recording.",
    );
  } finally {
    if (url) URL.revokeObjectURL(url);
    busy = false;
    $("file").value = "";
    $("file").disabled = !$("consent").checked;
  }
};
window.addEventListener("pagehide", () => {
  generation++;
  pose?.close();
});
