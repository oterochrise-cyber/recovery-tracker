// One-shot text updater: POST {updates:[{date,time,event_type,what_happened}]} — matches
// events by date+time+type, rewrites what_happened, stamps _u so the new _u-aware merge
// propagates the edit to all devices. Key-gated; snapshots first. Temporary — remove after use.
const admin = require("firebase-admin");

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return admin.firestore();
}

exports.handler = async (event) => {
  const qp = (event && event.queryStringParameters) || {};
  if (qp.key !== process.env.QUOTE_KEY) return { statusCode: 401, body: "unauthorized" };
  let db;
  try { db = init(); } catch (e) { return { statusCode: 500, body: "env not configured: " + e.message }; }

  const userRefs = await db.collection("users").listDocuments();
  let uid = null, docSnap = null;
  for (const u of userRefs) {
    const s = await db.doc("users/" + u.id + "/tracker/data").get();
    if (s.exists && s.data().json) { uid = u.id; docSnap = s; break; }
  }
  if (!uid) return { statusCode: 404, body: "no tracker doc found" };
  const DB = JSON.parse(docSnap.data().json);
  DB.events = DB.events || [];

  if (event.httpMethod !== "POST") return { statusCode: 405, body: "POST the updates payload" };
  let data;
  try { data = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: "invalid JSON body" }; }

  const today = new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);
  await db.doc("users/" + uid + "/tracker/snap-" + today + "-pre-condense")
    .set({ json: docSnap.data().json, at: Date.now(), reason: "pre-condense backup" });

  const byKey = {};
  DB.events.forEach(e => { byKey[[e.date, e.log_time, e.event_type].join("|")] = e; });
  const now = Date.now();
  let updated = 0; const missed = [];
  (data.updates || []).forEach(u => {
    const e = byKey[[u.date, u.time, u.event_type].join("|")];
    if (!e) { missed.push(u.date + " " + u.time); return; }
    if (u.what_happened) e.what_happened = String(u.what_happened);
    e._u = now; updated++;
  });

  const payload = JSON.stringify(DB);
  await db.doc("users/" + uid + "/tracker/data")
    .set({ json: payload, updatedAt: admin.firestore.FieldValue.serverTimestamp(), device: "claude-condense" });

  return { statusCode: 200, headers: { "content-type": "application/json" },
    body: JSON.stringify({ updated, missed, bytes: payload.length }) };
};
