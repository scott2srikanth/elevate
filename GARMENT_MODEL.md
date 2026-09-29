# Garment One 0.1.0

My Style now runs an on-device garment pipeline. The app uses a quantized pretrained FashionCLIP image encoder, a small fixed text-prototype classifier, foreground colour estimation and a deterministic outfit preference model. This is a working experimental integration, not a new vision model trained from scratch or a validated professional styling system.

## What runs locally

1. The user selects a single garment image (JPEG/PNG/WebP, maximum 12 MB). The page accepts no remote image URLs. Photographs remain in memory; no upload, thumbnail, EXIF or pixel data enters app state.
2. A 224×224 centre crop is RGB-normalised with the upstream CLIP means and standard deviations. Canvas high-quality resizing approximates the upstream bicubic preprocessing; it is not bit-exact across browsers.
3. The quantized ONNX image encoder produces a 512-dimensional vector using existing ONNX Runtime Web 1.22 CPU/WASM. No text model is shipped to the app.
4. The fixed head compares the normalised vector against 28 averaged text prototypes: 23 garment types and five negative/ambiguous prompts. These map to Tops, Bottoms, Dresses, Layers, Shoes, Accessories, or Unknown. Cosine similarities produce relative scores using temperature 0.02. Heuristic gates require similarity ≥0.20, score ≥0.55 and a top-two margin ≥0.12. Unknown categories are always withheld. These settings are not calibrated accuracy or reliable out-of-distribution detection.
5. A plain-background pixel heuristic estimates visible colour. Low foreground coverage leaves colour unanswered. Shadows, prints and similar background colours can mislead it. No material, size, condition, fit, gender, personality or attractiveness inference is performed.
6. The user confirms or corrects name, category and colour, and supplies the occasion preference. No prediction is saved automatically.
7. Reviewed descriptors and model provenance enter the existing encrypted profile and optional account sync. The photograph is discarded after acknowledgement, opt-out or page exit. Model weights never learn from user photos.

## Outfit connection

`src/intelligence/garmentOutfits.ts` considers only owned items, prefers a complete outfit, uses explicitly confirmed occasion preferences and breaks ties with a simple palette preference. A dress or jumpsuit replaces a top/bottom pair. Missing items are reported, not invented. Formality, fit, weather and dress-code requirements cannot be established from a photograph and remain user checks. Existing manual entries still work. No claim of trained outfit compatibility is made: this layer is a small transparent scoring policy.

## Model assets and provenance

- Original model: https://huggingface.co/patrickjohncyh/fashion-clip (FashionCLIP, MIT).
- Quantized ONNX conversion: https://huggingface.co/ff13/fashion-clip at revision `0f99955d944c39bfd9d035a02ac273c7a44a406b` (MIT).
- Upstream source/license: https://github.com/patrickjohncyh/fashion-clip . License included in `public/observation/garment/LICENSE`.
- Vision encoder: 89,117,653 bytes (~85 MiB), stored in five parts under 20 MB for static hosting. The downloaded parts are verified by the existing release installer; the reassembled encoder is SHA-256 checked again before inference.
- Decision head: approximately 151 KiB JSON, 28×512 coefficients plus labels/prompts/configuration.
- Pretraining data belongs to the upstream project. No new labelled garment training corpus is bundled and no real-world accuracy claim is made. The upstream model is biased toward isolated product images; multiple items, people, unusual garments and busy backgrounds are outside this initial flow.

## Offline and release delivery

Release `0.2.0` includes garment files in the existing hash-verified observation package. Total first download is approximately 140 MB including observation models and the web app; upgrades reuse unchanged files. Models are loaded from release-pinned URLs, including the garment page. Users sync explicitly from Downloads & updates. Install is atomic and retains the prior working copy. Storage clearing, uninstall and browser eviction remove downloads. This implementation does not promise permanent storage against OS/browser deletion.

Android uses the same pipeline inside the existing restricted same-origin WebView. The first download requires a deployed HTTPS app endpoint. An Android Hermes export is not an APK or a physical-device performance test. Memory use and speed need device coverage, particularly on low-memory phones.

## Reproduce

```sh
python -m venv /tmp/garment-build
/tmp/garment-build/bin/pip install numpy onnxruntime tokenizers
/tmp/garment-build/bin/python scripts/garment/download.py /tmp/elevate-fashion
/tmp/garment-build/bin/python scripts/garment/prepare.py /tmp/elevate-fashion
npm run models:release
npm run build:web -- --clear
```

The preparation script encodes fixed public label prompts, averages two prompts per class, normalises them and creates the decision head. It does not fine-tune weights on user images. `notebooks/Garment_One_Build.ipynb` provides the same developer-only workflow for Colab; it does not request personal photos.

## Verification

Unit checks cover bridge/session validation, metadata-only state, user confirmation, abstention, foreground colour estimation, owned-item selection and dresses replacing separates. `scripts/test-garment.mjs` exercises real WASM inference, review/save, outfit connection, offline reload and inference, and rejects photo-upload requests. Set `GARMENT_TEST_IMAGE` to a public/local test fixture and `GARMENT_TEST_URL` to a running development app. This is smoke coverage, not an accuracy evaluation; use a consented representative dataset before claiming deployment quality.

The old optional wardrobe photo-upload UI is removed. Users can still explicitly view the list of and delete earlier cloud uploads; no existing user files are silently deleted. New garment photos do not use `/api/media`.
