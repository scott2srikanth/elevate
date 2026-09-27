import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { z } from "zod";
import { api } from "../api";
import { exercises } from "../coach";
import {
  contentSchema,
  emptyContent,
  parseContent,
  type ContentDocument,
  type ContentSnapshot,
} from "../shared/content";
import { coachingVideos, videoTopics } from "../coachingVideos";
import baseStrings from "../i18n/te.json";
const panel: React.CSSProperties = {
  background: "white",
  border: "1px solid #DDE4D9",
  borderRadius: 14,
  padding: 24,
  marginBottom: 20,
};
const button: React.CSSProperties = {
  background: "#203E36",
  color: "white",
  padding: "13px 18px",
  border: 0,
  borderRadius: 8,
  cursor: "pointer",
  margin: "8px 8px 8px 0",
};
const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: 12,
  margin: "8px 0 16px",
  border: "1px solid #a5b5aa",
  borderRadius: 8,
  fontSize: 15,
};
function download(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function AdminEntry({ full = false }: { full?: boolean }) {
  return full ? (
    <Administrator />
  ) : (
    <button style={button} onClick={() => router.push("/admin")}>
      Administrator workspace
    </button>
  );
}
function Administrator() {
  const [published, setPublished] = useState<ContentSnapshot | null>(null);
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [raw, setRaw] = useState(""),
    [preview, setPreview] = useState<ContentDocument | null>(null);
  const [kind, setKind] = useState("lessons"),
    [code, setCode] = useState(""),
    [name, setName] = useState("");
  const [links, setLinks] = useState(""),
    [template, setTemplate] = useState("");
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [mediaUrl, setMediaUrl] = useState("");
  const [checking, setChecking] = useState(true);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  const load = async () => {
    const next = await api<ContentSnapshot>("/admin/content");
    setPublished(next);
    setPreview(null);
    setRaw("");
    setMessage(`Loaded published revision ${next.revision}.`);
  };
  useEffect(() => {
    let live = true;
    void api<ContentSnapshot>("/admin/content")
      .then((value) => {
        if (live) setPublished(value);
      })
      .catch((e) => {
        if (live) setMessage(e.message);
      })
      .finally(() => {
        if (live) setChecking(false);
      });
    return () => {
      live = false;
    };
  }, []);
  function createTemplate() {
    const document = published?.document || emptyContent();
    const allLessons = [...exercises, ...document.lessons];
    const strings = Object.fromEntries(
      [
        ...new Set([
          ...Object.keys(baseStrings),
          ...videoTopics,
          ...coachingVideos.flatMap((x) => [x.title, x.note, x.practice]),
          "Your next chapter, {name}.",
          "{count} min / day",
          ...allLessons.flatMap((x) => [
            x.title,
            x.description,
            x.lesson,
            x.challenge,
            ...x.steps,
          ]),
          ...document.videos.flatMap((x) => [
            x.title,
            x.topic,
            x.note,
            x.practice,
          ]),
        ]),
      ].map((k) => [k, k]),
    );
    const proposed =
      kind === "language"
        ? {
            ...document,
            languages: [
              ...document.languages.filter((p) => p.code !== code),
              { code, name, strings },
            ],
          }
        : document;
    setTemplate(
      JSON.stringify(
        {
          task:
            kind === "language"
              ? `Translate every strings VALUE into ${name} (${code}). Keep keys, placeholders, lesson IDs and URLs unchanged. Return the complete document only as JSON. Do not translate user-entered content.`
              : "Create or update direct instructional coaching lessons and videos from the administrator's supplied links. Do not invent URLs, credentials, claims or video language. Avoid interviews. Associate each video with existing or newly created lessonIds. Return the complete document only as JSON, retaining existing items. Use the schema exactly.",
          administratorLinks: links,
          knownLessons: allLessons.map((x) => ({ id: x.id, title: x.title })),
          responseSchema: z.toJSONSchema(contentSchema),
          document: proposed,
        },
        null,
        2,
      ),
    );
  }
  function validate(value: string) {
    setRaw(value);
    setPreview(null);
    setMessage("");
    try {
      const doc = parseContent(value);
      const known = new Set([
        ...exercises.map((x) => x.id),
        ...doc.lessons.map((x) => x.id),
      ]);
      for (const video of doc.videos)
        if (video.lessonIds.some((id) => !known.has(id)))
          throw new Error(`Unknown lesson in video ${video.id}.`);
      setPreview(doc);
      setMessage(
        "JSON validated. Review the full document and item list before applying.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Invalid JSON");
    }
  }
  return (
    <main
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: 24,
        color: "#203E36",
        background: "#F6F7F3",
        fontFamily: "system-ui",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <button style={button} onClick={() => router.push("/profile")}>
        ← Back to profile
      </button>
      <h1>Administrator workspace</h1>
      <p>
        Publish lessons, playable videos and languages to every device. This
        workspace is available on the web only.
      </p>
      <p
        role="status"
        style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
      >
        {message}
      </p>
      {checking ? (
        <p>Checking administrator access…</p>
      ) : !published ? (
        <form
          style={panel}
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await api("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
              });
              setPassword("");
              await load();
            });
          }}
        >
          <h2>Administrator sign in</h2>
          <p>
            Use your existing cloud account. The owner must assign administrator
            access before you can publish.
          </p>
          <label>
            Email
            <input
              style={field}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              style={field}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button style={button} disabled={busy} type="submit">
            Sign in as administrator
          </button>
        </form>
      ) : (
        <>
          <section style={panel}>
            <h2>Published revision {published.revision}</h2>
            <p>
              {published.document.lessons.length} managed lessons ·{" "}
              {published.document.videos.length} managed videos ·{" "}
              {published.document.languages.length} language packs
            </p>
            <button
              style={button}
              disabled={busy}
              onClick={() => void run(load)}
            >
              Reload published content
            </button>
            <button
              style={button}
              onClick={() =>
                download(
                  `elevate-content-${published.revision}.json`,
                  published.document,
                )
              }
            >
              Download published JSON
            </button>
            <button
              style={button}
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await api("/auth/logout", { method: "POST" });
                  setPublished(null);
                  setPreview(null);
                  setRaw("");
                  setTemplate("");
                })
              }
            >
              Sign out
            </button>
          </section>
          <section style={panel}>
            <h2>1. Create a JSON template</h2>
            <label>
              Template type
              <select
                style={field}
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="lessons">Lessons and videos</option>
                <option value="language">Language pack</option>
              </select>
            </label>
            {kind === "language" && (
              <>
                <label>
                  Language code
                  <input
                    style={field}
                    placeholder="hi, ta, fr…"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </label>
                <label>
                  Language name
                  <input
                    style={field}
                    placeholder="हिन्दी, தமிழ், Français…"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
              </>
            )}
            <label>
              Topic, session and video links
              <textarea
                style={field}
                rows={5}
                placeholder="Lesson ID or new session name, topic, source language, and one YouTube or HTTPS MP4 link per line"
                value={links}
                onChange={(e) => setLinks(e.target.value)}
              />
            </label>
            <p>
              Supported links: YouTube, HTTPS MP4, or an uploaded MP4 path. Each
              video must identify the lesson it belongs to. Uploaded video files
              are public instructional content.
            </p>
            <label>
              Upload a lesson MP4 (maximum 32 MB)
              <input
                style={field}
                type="file"
                accept="video/mp4,.mp4"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  void run(async () => {
                    if (file.size > 32 * 1024 * 1024)
                      throw new Error("MP4 must be smaller than 32 MB.");
                    const result = await api<{ url: string }>("/admin/media", {
                      method: "POST",
                      headers: { "Content-Type": "video/mp4" },
                      body: file,
                    });
                    setMediaUrl(result.url);
                    setLinks((v) => `${v}\n${result.url}`.trim());
                  });
                }}
              />
            </label>
            {mediaUrl && (
              <p>
                Uploaded media path: <code>{mediaUrl}</code>
              </p>
            )}
            <button
              style={button}
              disabled={
                busy ||
                (kind === "language" &&
                  (!name || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(code)))
              }
              onClick={createTemplate}
            >
              Create a JSON template
            </button>
            {template && (
              <>
                <label>
                  Copy this template to ChatGPT
                  <textarea style={field} rows={12} readOnly value={template} />
                </label>
                <button
                  style={button}
                  onClick={() =>
                    void run(async () => {
                      await navigator.clipboard.writeText(template);
                      setMessage(
                        "Template copied. Paste into ChatGPT and request the completed JSON document.",
                      );
                    })
                  }
                >
                  Copy template
                </button>
                <button
                  style={button}
                  onClick={() =>
                    download(
                      "elevate-chatgpt-template.json",
                      JSON.parse(template),
                    )
                  }
                >
                  Download template
                </button>
              </>
            )}
          </section>
          <section style={panel}>
            <h2>2. Import and review ChatGPT’s JSON</h2>
            <p>
              Import the completed document, not the prompt wrapper. Publishing
              replaces the managed document; retain items you want to keep.
              Bundled lessons remain available.
            </p>
            <label>
              Upload JSON file
              <input
                style={field}
                type="file"
                accept="application/json,.json"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setPreview(null);
                  void run(async () => {
                    if (file.size > 2 * 1024 * 1024)
                      throw new Error("JSON must be smaller than 2 MB.");
                    validate(await file.text());
                  });
                }}
              />
            </label>
            <label>
              Or paste response JSON
              <textarea
                style={field}
                rows={12}
                value={raw}
                onChange={(e) => {
                  setRaw(e.target.value);
                  setPreview(null);
                }}
              />
            </label>
            <button
              style={button}
              disabled={busy || !raw}
              onClick={() => validate(raw)}
            >
              Validate and preview
            </button>
            {preview && (
              <>
                <h3>Review changes</h3>
                <ul>
                  {preview.lessons.map((x) => (
                    <li key={`l-${x.id}`}>
                      Lesson: {x.title} ({x.id})
                    </li>
                  ))}
                  {preview.videos.map((x) => (
                    <li key={`v-${x.id}`}>
                      Video: {x.title} · {x.audio} · {x.format} ·{" "}
                      {x.lessonIds.join(", ")}
                      <br />
                      {x.url}
                    </li>
                  ))}
                  {preview.languages.map((x) => (
                    <li key={`p-${x.code}`}>
                      Language: {x.name} ({x.code}) ·{" "}
                      {Object.keys(x.strings).length} translations
                    </li>
                  ))}
                </ul>
                <p>
                  Missing translations fall back to English. User notes and
                  names are never translated. Interview-format items are
                  excluded from the learner library.
                </p>
                <details>
                  <summary>Full validated document</summary>
                  <pre
                    style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                  >
                    {JSON.stringify(preview, null, 2)}
                  </pre>
                </details>
                <button
                  style={button}
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const result = await api<ContentSnapshot>(
                        "/admin/content",
                        {
                          method: "PUT",
                          body: JSON.stringify({
                            baseRevision: published.revision,
                            document: preview,
                          }),
                        },
                      );
                      setPublished(result);
                      setPreview(null);
                      setMessage(
                        `Revision ${result.revision} published. Online apps refresh within 60 seconds or on next resume. Offline devices update when connected.`,
                      );
                    })
                  }
                >
                  Apply to all devices
                </button>
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
