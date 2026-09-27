import ContentPreview from "./ContentPreview.web";
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
  border: "1px solid #E5DFD3",
  borderRadius: 14,
  padding: 24,
  marginBottom: 20,
};
const button: React.CSSProperties = {
  background: "#344333",
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
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [createdUser, setCreatedUser] = useState<{
    user: { email: string };
    recoveryCode: string;
  } | null>(null);
  const [reviewed, setReviewed] = useState(false);
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
    setReviewed(false);
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
    setReviewed(false);
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
      className="admin-workspace"
      style={{
        maxWidth: 1240,
        width: "100%",
        flexShrink: 0,
        margin: "0 auto",
        padding: 24,
        color: "#344333",
        background: "#F7F3EC",
        fontFamily: "system-ui",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .admin-workspace { line-height: 1.6; }
        .admin-workspace h1 { font-size: clamp(30px, 4vw, 44px); margin: 8px 0; letter-spacing: -1.5px; }
        .admin-workspace h2 { margin-top: 0; font-size: 23px; }
        .admin-workspace section { scroll-margin-top: 24px; box-shadow: 0 4px 20px #34433306; }
        .admin-kicker { font-size: 11px; letter-spacing: 1.8px; font-weight: 700; color: #59634f; }
        .admin-navigation { display: flex; gap: 8px; flex-wrap: wrap; padding: 12px; background: #344333; border-radius: 14px; margin: 24px 0; }
        .admin-navigation a { color: white; text-decoration: none; padding: 10px 16px; border-radius: 8px; }
        .admin-navigation a:hover, .admin-navigation a:focus-visible { background: #526649; }
        .admin-metrics { display: grid; grid-template-columns: repeat(auto-fit,minmax(130px,1fr)); gap: 14px; margin: 18px 0 24px; }
        .admin-stat { background: #fff; padding: 20px; border: 1px solid #e5dfd3; border-radius: 14px; display: flex; flex-direction: column; }
        .admin-stat strong { font-size: 32px; line-height: 1.3; }
        .admin-stat span { font-size: 13px; color: #59634f; text-transform: capitalize; }
        .config-preview { border: 1px solid #d4d7c9; border-radius: 16px; background: #f7f3ec; padding: 22px; margin: 24px 0; }
        .admin-preview-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0; }
        .config-preview button { border: 1px solid #d4d7c9; background: white; color: #344333; padding: 12px 16px; border-radius: 10px; cursor: pointer; }
        .config-preview button[aria-pressed=true] { background: #344333; color: white; }
        .config-preview select { display: block; padding: 12px; width: 100%; margin: 8px 0 18px; border: 1px solid #d4d7c9; border-radius: 8px; background: white; color: #344333; }
        .learner-preview { background: white; border: 1px solid #e5dfd3; border-radius: 14px; padding: 24px; overflow-wrap: anywhere; }
        .learner-preview h2 { margin: 12px 0; font-family: Georgia, serif; }
        .admin-challenge { background: #e2e8d8; border-radius: 12px; padding: 16px; }
        .admin-challenge h4 { margin-top: 0; }
        .admin-video-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(min(280px,100%),1fr)); gap: 16px; }
        .admin-warning { background: #fff1e5; border-left: 3px solid #a36343; padding: 12px; overflow-wrap: anywhere; }
        .admin-translation-table { max-height: 380px; overflow: auto; }
        .admin-translation-table table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .admin-translation-table td,.admin-translation-table th { padding: 12px; text-align: left; border-bottom: 1px solid #d4d7c9; overflow-wrap: anywhere; }
        .admin-footnote { font-size: 13px; color: #59634f; }
        .admin-approval { display: flex; align-items: center; gap: 10px; margin-top: 20px; }
        .admin-approval input { width: 20px; height: 20px; accent-color: #425441; }
        .admin-workspace button:disabled { opacity: .45; cursor: not-allowed; }
        .admin-workspace button:focus-visible,.admin-workspace a:focus-visible { outline: 3px solid #a36343; outline-offset: 3px; }
        @media(max-width: 600px) { .config-preview { padding: 14px; } .learner-preview { padding: 16px; } }
      `}</style>
      <button style={button} onClick={() => router.push("/profile")}>
        ← Back to profile
      </button>
      <div className="admin-kicker">ELEVATE / CONTROL CENTER</div>
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
          <nav
            className="admin-navigation"
            aria-label="Administrator navigation"
          >
            <a href="#dashboard">Overview</a>
            <a href="#accounts">User accounts</a>
            <a href="#templates">Create content</a>
            <a href="#import">Preview & publish</a>
          </nav>
          <div className="admin-metrics">
            {[
              ["Managed lessons", published.document.lessons.length],
              ["Managed videos", published.document.videos.length],
              ["Language packs", published.document.languages.length],
              ["Live revision", published.revision],
            ].map(([label, value]) => (
              <div className="admin-stat" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <section id="dashboard" style={panel}>
            <span className="admin-kicker">LIVE CONTENT</span>
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
                  setReviewed(false);
                  setRaw("");
                  setTemplate("");
                  setUserEmail("");
                  setUserPassword("");
                  setCreatedUser(null);
                })
              }
            >
              Sign out
            </button>
          </section>
          <section id="accounts" style={panel}>
            <h2>Create a user account</h2>
            <p>
              Create a learner account and share its credentials privately with
              the user.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  setCreatedUser(null);
                  const result = await api<{
                    user: { email: string };
                    recoveryCode: string;
                  }>("/admin/users", {
                    method: "POST",
                    body: JSON.stringify({
                      email: userEmail,
                      password: userPassword,
                    }),
                  });
                  setCreatedUser(result);
                  setUserPassword("");
                  setUserEmail("");
                });
              }}
            >
              <label>
                User email
                <input
                  style={field}
                  type="email"
                  required
                  autoComplete="off"
                  value={userEmail}
                  onChange={(event) => setUserEmail(event.target.value)}
                />
              </label>
              <label>
                User password (12+ characters)
                <input
                  style={field}
                  type="password"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  value={userPassword}
                  onChange={(event) => setUserPassword(event.target.value)}
                />
              </label>
              <button style={button} disabled={busy} type="submit">
                Create user account
              </button>
            </form>
            {createdUser && (
              <div role="status">
                <p>Account created: {createdUser.user.email}</p>
                <p>
                  Save and share this recovery code privately. It is shown only
                  once:
                </p>
                <code style={{ overflowWrap: "anywhere" }}>
                  {createdUser.recoveryCode}
                </code>
                <div>
                  <button style={button} onClick={() => setCreatedUser(null)}>
                    I saved the recovery code
                  </button>
                </div>
              </div>
            )}
          </section>
          <section id="templates" style={panel}>
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
          <section id="import" style={panel}>
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
                  setReviewed(false);
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
                  setReviewed(false);
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
                <ContentPreview
                  key={JSON.stringify(preview)}
                  document={preview}
                  published={published.document}
                />
                <details>
                  <summary>Full validated document</summary>
                  <pre
                    style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                  >
                    {JSON.stringify(preview, null, 2)}
                  </pre>
                </details>
                <label className="admin-approval">
                  <input
                    type="checkbox"
                    checked={reviewed}
                    onChange={(e) => setReviewed(e.target.checked)}
                  />{" "}
                  I reviewed the preview and any removals.
                </label>
                <button
                  style={button}
                  disabled={busy || !reviewed}
                  onClick={() =>
                    void run(async () => {
                      if (!reviewed) return;
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
                      setReviewed(false);
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
