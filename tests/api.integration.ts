import { localAccount } from "./fixtures/localAccount";
import test from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../src/coach";
const base = process.env.TEST_API_URL || "http://localhost:8787";
const runId = crypto.randomUUID();
const request = async (
  path: string,
  options: {
    method?: string;
    body?: unknown;
    cookie?: string;
    headers?: Record<string, string>;
    raw?: Uint8Array;
  } = {},
) => {
  const r = await fetch(`${base}/api${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Elevate-Request": "1",
      "CF-Connecting-IP": runId,
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...options.headers,
    },
    body: options.raw
      ? new Uint8Array(options.raw).buffer
      : options.body
        ? JSON.stringify(options.body)
        : undefined,
  });
  return r;
};
test("D1 account isolation, sync conflicts, private media, export, recovery, and deletion", async () => {
  const email = `a-${runId}@example.com`,
    password = "a-strong-test-password-2026";
  const data = await localAccount(email, password, base);
  await localAccount(`b-${runId}@example.com`, password, base);
  const a = await request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(a.status, 200);

  assert.equal(data.recoveryCode.length, 64);
  const cookie = a.headers.get("set-cookie")!.split(";")[0];
  assert.match(a.headers.get("set-cookie")!, /HttpOnly/);
  const b = await request("/auth/login", {
    method: "POST",
    body: { email: `b-${runId}@example.com`, password },
  });
  assert.equal(b.status, 200);
  const other = b.headers.get("set-cookie")!.split(";")[0];
  assert.equal((await request("/state")).status, 401);
  const s = {
    ...initialState(),
    memories: [
      {
        id: "m",
        text: "I prefer concise practice.",
        at: new Date().toISOString(),
      },
    ],
  };
  assert.equal(
    (
      await request("/state", {
        method: "PUT",
        cookie,
        body: { state: s, revision: 0 },
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request("/state", {
        method: "PUT",
        cookie,
        body: { state: s, revision: 0 },
      })
    ).status,
    409,
  );
  const own = (await (await request("/state", { cookie })).json()) as {
    state: typeof s;
    revision: number;
  };
  assert.equal(own.state.memories[0].text, "I prefer concise practice.");
  assert.equal(own.revision, 1);
  const theirs = (await (
    await request("/state", { cookie: other })
  ).json()) as { state: typeof s };
  assert.equal(theirs.state.memories.length, 0);
  assert.equal(
    (
      await request("/state", {
        method: "PUT",
        cookie,
        body: { state: { ...s, version: 99 }, revision: 1 },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/media", {
        method: "POST",
        cookie,
        headers: { "Content-Type": "image/png", "X-Media-Purpose": "photo" },
        raw: new Uint8Array([1]),
      })
    ).status,
    400,
  );
  const uploaded = await request("/media", {
    method: "POST",
    cookie,
    headers: {
      "Content-Type": "image/png",
      "X-Media-Purpose": "photo",
      "X-Media-Consent": "yes",
      "X-Retention-Days": "7",
    },
    raw: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
  });
  assert.equal(uploaded.status, 201);
  const media = (await uploaded.json()) as { id: string };
  assert.equal(
    (await request(`/media/${media.id}`, { cookie: other })).status,
    404,
  );
  assert.equal((await request(`/media/${media.id}`, { cookie })).status, 200);
  assert.equal(
    (
      await request("/coach", {
        method: "POST",
        cookie,
        body: { message: "Help me", consent: true },
      })
    ).status,
    410,
  );
  assert.equal(
    (
      await request("/coach", {
        method: "POST",
        cookie,
        body: { message: "Help me", consent: false },
      })
    ).status,
    410,
  );
  const exported = (await (await request("/export", { cookie })).json()) as {
    account: { email: string };
    state: typeof s;
  };
  assert.equal(exported.account.email, email);
  assert.equal(exported.state.memories.length, 1);
  const rejected = await request("/state", {
    method: "PUT",
    cookie,
    headers: { Origin: "https://untrusted.example" },
    body: { state: s, revision: 1 },
  });
  assert.equal(rejected.status, 403);
  const noHeader = await fetch(`${base}/api/state`, {
    method: "PUT",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ state: s, revision: 1 }),
  });
  assert.equal(noHeader.status, 403);
  const recovered = await request("/auth/recover", {
    method: "POST",
    body: {
      email,
      password: "another-strong-password-2026",
      recoveryCode: data.recoveryCode,
    },
  });
  assert.equal(recovered.status, 200);
  const rotated = recovered.headers.get("set-cookie")!.split(";")[0];
  assert.equal((await request("/state", { cookie })).status, 401);
  assert.equal(
    (
      await request("/auth/recover", {
        method: "POST",
        body: { email, password, recoveryCode: data.recoveryCode },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/account", {
        method: "DELETE",
        cookie: rotated,
        body: { password: "wrong" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/account", {
        method: "DELETE",
        cookie: rotated,
        body: { password: "another-strong-password-2026" },
      })
    ).status,
    200,
  );
  assert.equal((await request("/state", { cookie: rotated })).status, 401);
  assert.equal(
    (
      await request("/account", {
        method: "DELETE",
        cookie: other,
        body: { password },
      })
    ).status,
    200,
  );
});
