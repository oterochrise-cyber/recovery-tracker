// One-shot import bridge: POST {events:[…],activities:[…]} (same schema as the in-app
// Paste import) straight into the cloud tracker doc. Key-gated; writes a snapshot backup
// before touching anything. GET ?verify=1 returns per-date counts without writing.
// Temporary — remove after use (the key also ships in the public client).
const admin = require("firebase-admin");

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return admin.firestore();
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(+v || 0)));

exports.handler = async (event) => {
  const qp = (event && event.queryStringParameters) || {};
  if (qp.key !== process.env.QUOTE_KEY) return { statusCode: 401, body: "unauthorized" };
  let db;
  try { db = init(); } catch (e) { return { statusCode: 500, body: "env not configured: " + e.message }; }

  // locate the (single) user's tracker doc
  const userRefs = await db.collection("users").listDocuments();
  let uid = null, docSnap = null;
  for (const u of userRefs) {
    const s = await db.doc("users/" + u.id + "/tracker/data").get();
    if (s.exists && s.data().json) { uid = u.id; docSnap = s; break; }
  }
  if (!uid) return { statusCode: 404, body: "no tracker doc found" };
  const DB = JSON.parse(docSnap.data().json);
  DB.events = DB.events || []; DB.activities = DB.activities || [];

  const counts = {};
  DB.events.forEach(e => { counts[e.date] = (counts[e.date] || 0) + 1; });
  if (qp.verify === "1") {
    return { statusCode: 200, headers: { "content-type": "application/json" },
      body: JSON.stringify({ uid, totals: { events: DB.events.length, activities: DB.activities.length }, eventsByDate: counts }) };
  }
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "POST a paste-import JSON body" };

  let data;
  try { data = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: "invalid JSON body" }; }
  const today = new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10); // ET, matches client CUR intent

  // snapshot backup before any write (restorable from ⚙ → Data safety)
  await db.doc("users/" + uid + "/tracker/snap-" + today + "-pre-import")
    .set({ json: docSnap.data().json, at: Date.now(), reason: "pre-import backup" });

  const sig = e => [e.date, e.log_time || "", e.event_type || ""].join("|");
  const have = new Set(DB.events.map(sig));
  let ne = 0, na = 0, skipped = 0;

  (data.events || []).forEach((ev, i) => {
    if (!ev || !ev.date) return;
    const d = String(ev.date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > today) return;
    const tm = (ev.time && /^\d{1,2}:\d{2}/.test(String(ev.time))) ? String(ev.time).slice(0, 5).padStart(5, "0") : "12:00";
    const rec = { id: Date.now() + i, ts: d + "T" + tm + ":00", date: d, log_date: d, log_time: tm };
    ["event_type", "trigger", "location", "what_happened", "thoughts", "reframe", "helped_most", "do_differently", "contacted_val", "contact_nature"]
      .forEach(k => { if (ev[k] != null && ev[k] !== "") rec[k] = String(ev[k]); });
    ["anxiety", "anger", "urge_contact", "anxiety_after", "anger_after", "urge_after", "physical"]
      .forEach(k => { if (ev[k] != null && ev[k] !== "") rec[k] = clamp(ev[k], 0, 10); });
    if (ev.duration_min != null && ev.duration_min !== "") rec.duration_min = String(clamp(ev.duration_min, 0, 1440));
    if (ev.self_control != null) rec.self_control = clamp(ev.self_control, 0, 2);
    if (Array.isArray(ev.actions)) rec.actions = ev.actions.map(String);
    if (Array.isArray(ev.symptoms)) rec.symptoms = ev.symptoms.map(String);
    if (have.has(sig(rec))) { skipped++; return; } // idempotent re-runs
    have.add(sig(rec));
    DB.events.push(rec); ne++;
  });

  const haveAct = new Set(DB.activities.map(a => [a.date, a.time || "", a.activity || ""].join("|")));
  (data.activities || []).forEach((a, i) => {
    if (!a || !a.date) return;
    const d = String(a.date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > today) return;
    const rec = { id: Date.now() + 9000 + i, date: d, time: String(a.time || "12:00").slice(0, 5), category: a.category || "Personal", activity: a.activity || "Activity", _u: Date.now() };
    if (a.duration_min != null) rec.duration_min = String(Math.round(+a.duration_min || 0));
    if (a.felt_normal != null) rec.felt_normal = !!a.felt_normal;
    if (a.notes) rec.notes = String(a.notes);
    const k = [rec.date, rec.time, rec.activity].join("|");
    if (haveAct.has(k)) { skipped++; return; }
    haveAct.add(k);
    DB.activities.push(rec); na++;
  });

  const payload = JSON.stringify(DB);
  await db.doc("users/" + uid + "/tracker/data")
    .set({ json: payload, updatedAt: admin.firestore.FieldValue.serverTimestamp(), device: "claude-import" });

  const after = {};
  DB.events.forEach(e => { after[e.date] = (after[e.date] || 0) + 1; });
  return { statusCode: 200, headers: { "content-type": "application/json" },
    body: JSON.stringify({ imported: { events: ne, activities: na }, skipped, totals: { events: DB.events.length, activities: DB.activities.length }, bytes: payload.length, eventsByDate: after }) };
};
