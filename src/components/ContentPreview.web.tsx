import React, { useState } from "react";
import type { ContentDocument } from "../shared/content";
import { youtubeId } from "../shared/content";

function changes(
  before: { key: string; value: unknown }[],
  after: { key: string; value: unknown }[],
) {
  const old = new Map(before.map((x) => [x.key, JSON.stringify(x.value)]));
  const next = new Map(after.map((x) => [x.key, JSON.stringify(x.value)]));
  return {
    added: [...next.keys()].filter((k) => !old.has(k)),
    updated: [...next.keys()].filter(
      (k) => old.has(k) && old.get(k) !== next.get(k),
    ),
    removed: [...old.keys()].filter((k) => !next.has(k)),
  };
}
export default function ContentPreview({
  document,
  published,
}: {
  document: ContentDocument;
  published: ContentDocument;
}) {
  const [tab, setTab] = useState("Lessons");
  const [language, setLanguage] = useState(document.languages[0]?.code || "");
  const [lessonId, setLessonId] = useState(document.lessons[0]?.id || "");
  const [playing, setPlaying] = useState<string | null>(null);
  const diff = changes(
    [
      ...published.lessons.map((x) => ({ key: `Lesson: ${x.id}`, value: x })),
      ...published.videos.map((x) => ({ key: `Video: ${x.id}`, value: x })),
      ...published.languages.map((x) => ({
        key: `Language: ${x.code}`,
        value: x,
      })),
    ],
    [
      ...document.lessons.map((x) => ({ key: `Lesson: ${x.id}`, value: x })),
      ...document.videos.map((x) => ({ key: `Video: ${x.id}`, value: x })),
      ...document.languages.map((x) => ({
        key: `Language: ${x.code}`,
        value: x,
      })),
    ],
  );
  const lesson = document.lessons.find((x) => x.id === lessonId);
  const pack = document.languages.find((x) => x.code === language);
  return (
    <div className="config-preview">
      <div className="admin-kicker">STAGED CONFIGURATION · NOT LIVE</div>
      <h3>Review changes</h3>
      <div className="admin-metrics">
        {Object.entries(diff).map(([kind, items]) => (
          <div className="admin-stat" key={kind}>
            <strong>{items.length}</strong>
            <span>{kind}</span>
          </div>
        ))}
      </div>
      {diff.removed.length > 0 && (
        <div className="admin-warning">
          <strong>These managed items will be removed:</strong>
          <ul>
            {diff.removed.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      )}
      <details>
        <summary>See every added and updated item</summary>
        {(["added", "updated"] as const).map((kind) => (
          <div key={kind}>
            <h4>{kind}</h4>
            <ul>
              {diff[kind].map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
        ))}
      </details>
      <nav className="admin-preview-tabs" aria-label="Configuration preview">
        {["Lessons", "Videos", "Languages"].map((name) => (
          <button
            type="button"
            key={name}
            aria-pressed={tab === name}
            onClick={() => {
              setTab(name);
              setPlaying(null);
            }}
          >
            {name} (
            {name === "Lessons"
              ? document.lessons.length
              : name === "Videos"
                ? document.videos.length
                : document.languages.length}
            )
          </button>
        ))}
      </nav>
      {tab === "Lessons" && (
        <div>
          {document.lessons.length === 0 ? (
            <p>
              No managed lessons in this configuration. Bundled lessons remain
              available.
            </p>
          ) : (
            <>
              <label>
                Preview lesson
                <select
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                >
                  {document.lessons.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.title}
                    </option>
                  ))}
                </select>
              </label>
              {lesson && (
                <article className="learner-preview">
                  <span className="admin-kicker">
                    LEARN · {lesson.area} · {lesson.minutes} MIN
                  </span>
                  <h2>{lesson.title}</h2>
                  <p>{lesson.description}</p>
                  <p>{lesson.lesson}</p>
                  <h4>Rehearse</h4>
                  <ol>
                    {lesson.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  <div className="admin-challenge">
                    <h4>Real-life challenge</h4>
                    <p>{lesson.challenge}</p>
                  </div>
                </article>
              )}
            </>
          )}
        </div>
      )}
      {tab === "Videos" && (
        <div className="admin-video-grid">
          {document.videos.length === 0 && (
            <p>No managed videos in this configuration.</p>
          )}
          {document.videos.map((video) => {
            const id = youtubeId(video.url);
            return (
              <article className="learner-preview" key={video.id}>
                <span className="admin-kicker">
                  {video.audio} · {video.topic}
                </span>
                <h4>{video.title}</h4>
                <p>{video.author}</p>
                <p>{video.note}</p>
                <p>
                  <strong>Practice:</strong> {video.practice}
                </p>
                <p>
                  Sessions: {video.lessonIds.join(", ") || "General library"}
                </p>
                {video.format === "interview" && (
                  <p className="admin-warning">
                    Interview: excluded from the learner library.
                  </p>
                )}
                {playing === video.id ? (
                  id ? (
                    <iframe
                      title={video.title}
                      src={`https://www.youtube-nocookie.com/embed/${id}`}
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      style={{
                        width: "100%",
                        aspectRatio: "16 / 9",
                        border: 0,
                      }}
                    />
                  ) : (
                    <video
                      controls
                      playsInline
                      src={video.url}
                      style={{
                        width: "100%",
                        maxHeight: 300,
                        objectFit: "contain",
                      }}
                    />
                  )
                ) : (
                  <button type="button" onClick={() => setPlaying(video.id)}>
                    Preview video
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
      {tab === "Languages" && (
        <div>
          {!pack ? (
            <p>No language packs in this configuration.</p>
          ) : (
            <>
              <label>
                Preview language
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {document.languages.map((x) => (
                    <option key={x.code} value={x.code}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="admin-translation-table">
                <table>
                  <thead>
                    <tr>
                      <th>Original text</th>
                      <th>{pack.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(pack.strings).map(([key, value]) => (
                      <tr key={key}>
                        <td>{key}</td>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
      <p className="admin-footnote">
        Preview only. Nothing is published until you apply this configuration.
        Missing translations fall back to English.
      </p>
    </div>
  );
}
