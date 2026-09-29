import { classify, estimateColor } from "./engine.mjs";
const $ = (id) => document.getElementById(id),
  session = new URLSearchParams(location.search).get("session") || "";
let model,
  encoder,
  photoUrl,
  proposal,
  pendingId,
  busy = false;
const message = (text) => {
  $("status").textContent = text;
};
async function getModel() {
  if (encoder) return encoder;
  const response = await fetch("./model.json");
  if (!response.ok)
    throw Error("Sync the latest offline package to install Garment One.");
  model = await response.json();
  const bytes = new Uint8Array(model.parts.reduce((s, p) => s + p.bytes, 0));
  let offset = 0;
  for (const part of model.parts) {
    const r = await fetch("./" + part.path);
    if (!r.ok)
      throw Error(
        "The garment model is missing. Sync the offline package again.",
      );
    const data = new Uint8Array(await r.arrayBuffer());
    if (data.length !== part.bytes)
      throw Error("Incomplete garment model. Sync again.");
    bytes.set(data, offset);
    offset += data.length;
  }
  const digest = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
  if (digest !== model.encoderSha256)
    throw Error("Garment model verification failed. Sync again.");
  ort.env.wasm.wasmPaths = new URL("../vendor/ort/dist/", location.href).href;
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
  encoder = await ort.InferenceSession.create(bytes, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
  return encoder;
}
function cleanup() {
  if (photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl = null;
  $("preview").removeAttribute("src");
  $("preview").hidden = true;
  $("file").value = "";
}
function tensor(image) {
  const c = document.createElement("canvas");
  c.width = c.height = 224;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 224, 224);
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    (image.naturalWidth - side) / 2,
    (image.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    224,
    224,
  );
  const data = ctx.getImageData(0, 0, 224, 224).data,
    v = new Float32Array(3 * 224 * 224);
  for (let i = 0; i < 224 * 224; i++)
    for (let ch = 0; ch < 3; ch++)
      v[ch * 224 * 224 + i] =
        (data[i * 4 + ch] / 255 - model.preprocess.image_mean[ch]) /
        model.preprocess.image_std[ch];
  return { v, data };
}
$("file").onchange = async () => {
  if (busy) return;
  const file = $("file").files?.[0];
  if (!file) return;
  $("review").hidden = true;
  proposal = null;
  pendingId = null;
  $("confirmed").checked = false;
  if (
    !/^image\/(jpeg|png|webp)$/.test(file.type) ||
    file.size > 12 * 1024 * 1024
  ) {
    message("Choose a JPEG, PNG or WebP up to 12 MB.");
    $("file").value = "";
    return;
  }
  if (!/\/offline\/[a-f0-9]{64}\/garment\//.test(location.pathname)) {
    message(
      "Open Downloads & updates and sync the offline package before analysing.",
    );
    $("file").value = "";
    return;
  }
  busy = true;
  $("file").disabled = true;
  $("consent").disabled = true;
  $("offline-download").disabled = true;
  $("offline-check").disabled = true;
  try {
    cleanup();
    photoUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = photoUrl;
    await img.decode();
    if (
      img.naturalWidth < 64 ||
      img.naturalHeight < 64 ||
      img.naturalWidth * img.naturalHeight > 40000000
    )
      throw Error("Use a clear photo between 64 pixels and 40 megapixels.");
    $("preview").src = photoUrl;
    $("preview").hidden = false;
    message("Analysing on this device… The first run may take longer.");
    const active = await getModel();
    const { v, data } = tensor(img);
    const output = await active.run({
      pixel_values: new ort.Tensor("float32", v, [1, 3, 224, 224]),
    });
    proposal = classify(output.image_embeds.data, model);
    for (const t of Object.values(output)) t.dispose();
    const color = estimateColor(data, 224, 224);
    $("prediction").textContent = proposal.accepted
      ? `Suggested: ${proposal.label} · ${Math.round(proposal.score * 100)}% relative score`
      : `Category uncertain. Best match: ${proposal.label} (${Math.round(proposal.score * 100)}% relative score). Please choose the category yourself.`;
    $("piece-name").value = proposal.accepted ? proposal.label : "";
    $("category").value = proposal.accepted ? proposal.category : "";
    $("color").value = color.color;
    $("formality").value = "Any";
    $("review").hidden = false;
    $("save").disabled = false;
    message(
      color.color
        ? "Analysis complete. Review the type and colour, then choose how you wear this piece."
        : "Analysis complete. Colour is uncertain; enter it yourself. A plain contrasting background works best.",
    );
  } catch (e) {
    cleanup();
    message(
      e.message || "Unable to analyse this photo. Try a smaller, clear image.",
    );
  } finally {
    busy = false;
    $("file").disabled = !$("consent").checked;
    $("consent").disabled = false;
    $("offline-download").disabled = false;
    $("offline-check").disabled = false;
  }
};
$("consent").addEventListener("change", () => {
  $("file").disabled = !$("consent").checked || busy;
  if (!$("consent").checked && !busy) {
    cleanup();
    $("review").hidden = true;
    proposal = null;
    message("Your photo has been discarded.");
  }
});
$("review").onsubmit = (e) => {
  e.preventDefault();
  if (!proposal || !$("confirmed").checked || busy) return;
  const name = $("piece-name").value.trim(),
    color = $("color").value.trim(),
    category = $("category").value;
  if (!name || !color || !category) return;
  const release = location.pathname.match(/\/offline\/([a-f0-9]{64})\//)?.[1];
  if (!release) {
    message("Sync the offline model before saving.");
    return;
  }
  pendingId = pendingId || "garment-" + crypto.randomUUID();
  const garment = {
    id: pendingId,
    name,
    category,
    color,
    garmentAnalysis: {
      model: model.version,
      release,
      at: new Date().toISOString(),
      proposedType: proposal.label,
      score: proposal.score,
      accepted: proposal.accepted,
      confirmed: true,
      formality: $("formality").value,
    },
  };
  const data = JSON.stringify({ type: "elevate-garment", session, garment });
  $("save").disabled = true;
  message("Adding reviewed details to your wardrobe…");
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(data);
  else window.parent.postMessage(data, location.origin);
  setTimeout(() => {
    if (pendingId) {
      $("save").disabled = false;
      message(
        "The app has not confirmed this piece. Reopen My style if needed, or retry. Your photo has not been uploaded.",
      );
    }
  }, 5000);
};
function acknowledge(e) {
  if (
    !window.ReactNativeWebView &&
    (e.origin !== location.origin || e.source !== parent)
  )
    return;
  try {
    const m = JSON.parse(e.data);
    if (
      m.type === "elevate-garment-saved" &&
      m.session === session &&
      m.id === pendingId
    ) {
      pendingId = null;
      proposal = null;
      cleanup();
      $("review").hidden = true;
      message(
        "Added to your wardrobe. Outfit recommendations now use your reviewed details. The photo has been discarded.",
      );
    }
  } catch {}
}
window.addEventListener("message", acknowledge);
document.addEventListener("message", acknowledge);
window.addEventListener("pagehide", () => {
  cleanup();
  encoder?.release();
});
