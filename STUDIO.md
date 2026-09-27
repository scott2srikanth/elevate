# ChatGPT JSON coaching studio

Each primary studio tab is an independent manual exchange: **Weekly review**, **My coach**, and **Photo & voice**. The app needs no API key or cloud account for this workflow.

1. Save a weekly review, enter your coaching question, or describe the media context. Voice users can paste a transcript.
2. Select which profile context, history and approved memories to include. Your name is omitted from the profile fields; free-text notes can still contain personal information.
3. Generate and review the JSON. Copy it or download the file, open ChatGPT, and paste it there. Attach images directly in ChatGPT. Recording support depends on the ChatGPT interface; use a transcript if a recording cannot be attached or inspected. No media bytes or device paths are included in JSON.
4. The package includes task instructions, context, image keys and a complete JSON response schema. Ask ChatGPT to return only the response object.
5. Paste the response, preview it, and save it. Analyses persist in the encrypted local profile, appear in History, and sync to D1 if cloud sync is connected. Delete individual analyses from History.

## Response format

`version: 1` and `kind: weekly | coach | media` identify the format and destination tab. The response must include:

- `title`, `summary`, `evidence`, `strengths`, `opportunities`, `limitations`.
- `charts`: up to three bar or trend charts. Each has `title`, `type`, `unit`, `max`, `basis`, `explanation`, and labelled numeric `points`. Basis is `self_reported`, `observed`, or `suggested`. Confidence is on a 0–5 scale; percentages on 0–100. Empty charts are valid when no useful numbers exist.
- `diagram`: a title and 2–6 ordered steps, each with `title`, `detail`, and an image key.
- `visualGuides`: 1–5 objects with `image`, `title`, `caption`, and `tryThis`.
- `actions`: 1–5 objects with `title`, `when`, `steps`, and a follow-up `reflection` question.

The exact schema in each export is generated from the same Zod schema used to validate imports. Raw JSON and a single fenced JSON block are accepted. Wrong tabs, missing fields, invalid scales, non-finite numbers, external image URLs and unknown object keys are rejected with a field-specific message. Limit: 60,000 pasted characters and 24,000 characters for the normalized analysis. Text is rendered as text, never as executable HTML or code.

Images use `reflection`, `conversation`, `speaking`, `posture`, or `style` to select bundled educational illustrations. They illustrate the advice; they do not claim to depict the user's body or behavior. Chart numbers are ChatGPT's returned claims, not independently verified measurements; the prompt requires evidence or a clear suggested-target label. A transcript alone cannot substantiate vocal tone, pace or posture claims.

The three tab drafts survive switching within the studio. Save an imported analysis before leaving or reloading the app; unsaved forms and previews are temporary. The authored coaching exercises and real-world reflection loop remain available under Practice.

The old automated `/api/coach` and `/api/analyze` routes return HTTP 410. There are no Workers AI bindings or processing calls. R2 remains available only as optional private wardrobe storage; existing legacy uploads can still be removed.

## References

- [ChatGPT image inputs](https://learn.chatgpt.com/docs/image-inputs)
- [ChatGPT prompting](https://learn.chatgpt.com/docs/prompting)
- [Illustration prompts](./assets/illustrations/STUDIO-PROMPTS.md)
