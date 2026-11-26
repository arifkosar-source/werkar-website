const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const RESEND_ENDPOINT = "https://api.resend.com/emails";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function secureEqual(left, right) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] || 0) ^ (b[i] || 0);
  return diff === 0;
}

function isAdmin(request, env) {
  const expected = env.ADMIN_TOKEN || "";
  const supplied = request.headers.get("authorization") || "";
  return expected.length >= 32 && supplied.startsWith("Bearer ") && secureEqual(supplied.slice(7), expected);
}

async function notifyByEmail(row, env) {
  const recipients = [...new Set((env.MAIL_TO || "").split(",").map(value => value.trim()).filter(Boolean))];
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !recipients.length) return false;

  const lines = [
    `Name: ${row.name}`, `Email: ${row.email}`, `Phone: ${row.phone || "—"}`,
    `Category: ${row.category}`, `Project type: ${row.project_type || "—"}`,
    `Location: ${row.location || "—"}`, "", "Project details:", row.details
  ];
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [recipients[0]],
      ...(recipients.length > 1 ? { bcc: recipients.slice(1) } : {}),
      reply_to: row.email,
      subject: `WERKAR project enquiry — ${row.category}`,
      text: lines.join("\n")
    })
  });
  return response.ok;
}

async function submitInquiry(request, env) {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!env.DB) return json({ error: "Inquiry storage is not configured yet." }, 503);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ error: "Invalid origin" }, 403);

  let payload;
  try { payload = await request.json(); } catch { return json({ error: "Invalid request body" }, 400); }
  // Honeypot field: accept quietly to deter basic automated spam.
  if (clean(payload.website, 200)) return json({ ok: true });

  const row = {
    id: crypto.randomUUID(),
    name: clean(payload.name, 160),
    email: clean(payload.email, 254).toLowerCase(),
    phone: clean(payload.phone, 60),
    category: clean(payload.category, 160),
    project_type: clean(payload.projectType, 100),
    location: clean(payload.location, 180),
    details: clean(payload.message, 5000)
  };
  if (!row.name || !row.category || !row.details || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    return json({ error: "Please complete the required fields with a valid email address." }, 400);
  }

  await env.DB.prepare(`INSERT INTO inquiries (id, name, email, phone, category, project_type, location, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(row.id, row.name, row.email, row.phone, row.category, row.project_type, row.location, row.details)
    .run();

  let notified = false;
  try { notified = await notifyByEmail(row, env); } catch (error) { console.error("Inquiry notification failed", error); }
  try {
    await env.DB.prepare("UPDATE inquiries SET notification_sent = ? WHERE id = ?")
      .bind(notified ? 1 : 0, row.id).run();
  } catch (error) { console.error("Could not update inquiry notification status", error); }
  return json({ ok: true, id: row.id, notificationSent: notified }, 201);
}

async function adminApi(request, env, pathname) {
  if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
  if (!env.DB) return json({ error: "Inquiry storage is not configured yet." }, 503);
  if (request.method === "GET" && pathname === "/api/admin/inquiries") {
    const result = await env.DB.prepare(`SELECT id, name, email, phone, category, project_type,
      location, details, created_at, status, notification_sent FROM inquiries
      ORDER BY created_at DESC LIMIT 500`).all();
    return json({ inquiries: result.results || [] });
  }
  const match = pathname.match(/^\/api\/admin\/inquiries\/([a-f0-9-]+)\/status$/i);
  if (request.method === "PATCH" && match) {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid request body" }, 400); }
    const status = body.status === "reviewed" ? "reviewed" : body.status === "new" ? "new" : "";
    if (!status) return json({ error: "Invalid status" }, 400);
    const result = await env.DB.prepare("UPDATE inquiries SET status = ? WHERE id = ?").bind(status, match[1]).run();
    if (!result.meta?.changes) return json({ error: "Inquiry not found" }, 404);
    return json({ ok: true });
  }
  return json({ error: "Not found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/inquiries") return await submitInquiry(request, env);
      if (url.pathname.startsWith("/api/admin/")) return await adminApi(request, env, url.pathname);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("WERKAR request failed", error);
      return json({ error: "The request could not be completed." }, 500);
    }
  }
};
