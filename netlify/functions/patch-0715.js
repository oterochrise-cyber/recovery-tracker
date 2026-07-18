// One-shot correction: upgrade the Jul 15 18:22 event to the full panic-attack record and
// sync that night's review, recomputing its success score. Key-gated; snapshots first.
// Temporary — remove after use.
const admin = require("firebase-admin");
function init() {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  return admin.firestore();
}
const STAND_KEYS = ["s_space", "s_anger", "s_window", "s_ate", "s_hydrate", "s_trained", "s_work", "s_tool", "s_self", "s_connect"];
const num = v => v == null || v === "" ? 0 : +v;
const blank = v => v == null || v === "" ? null : v;
const avg = a => { const x = a.filter(v => v != null); return x.length ? x.reduce((s, b) => s + +b, 0) / x.length : null; };
function successScore(DB, n, date) {
  const triVal = v => v === "Yes" ? 2 : v === "Partially" ? 1 : 0;
  const standPts = STAND_KEYS.reduce((s, k) => s + triVal(n[k]), 0);
  const evs = (DB.events || []).filter(e => e.date === date);
  let scPts, recBonus = 0, impulse = 0;
  if (evs.length) {
    const sc = avg(evs.map(e => e.self_control != null ? e.self_control : null));
    scPts = sc != null ? (sc / 2) * 10 : 8;
    const dropped = evs.filter(e => blank(e.anxiety_after) != null && num(e.anxiety_after) < num(e.anxiety)).length;
    recBonus = evs.length ? (dropped / evs.length) * 10 : 0;
    impulse = evs.filter(e => e.contacted_val && e.contacted_val !== "No" && e.contact_nature === "Impulsive").length;
  } else { scPts = 8; recBonus = 6; }
  return Math.max(0, Math.min(100, Math.round((standPts / 20) * 60 + (scPts / 10) * 30 + (recBonus / 10) * 10 - impulse * 6)));
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
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "POST the patch payload" };
  const data = JSON.parse(event.body);
  const today = new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);
  await db.doc("users/" + uid + "/tracker/snap-" + today + "-pre-patch0715")
    .set({ json: docSnap.data().json, at: Date.now(), reason: "pre-patch backup" });
  const now = Date.now();
  const m = data.event.match;
  const ev = (DB.events || []).find(e => e.date === m.date && e.log_time === m.time && e.event_type === m.event_type);
  if (!ev) return { statusCode: 404, body: "event not found" };
  Object.assign(ev, data.event.set);
  ev._u = now;
  const nd = data.nightly.date;
  const n = Object.assign({}, DB.nightly[nd] || {}, data.nightly.set);
  n.success = successScore(DB, n, nd);
  n._u = now; DB.nightly[nd] = n;
  const payload = JSON.stringify(DB);
  await db.doc("users/" + uid + "/tracker/data")
    .set({ json: payload, updatedAt: admin.firestore.FieldValue.serverTimestamp(), device: "claude-patch" });
  return { statusCode: 200, headers: { "content-type": "application/json" },
    body: JSON.stringify({ patched: ev.event_type + " " + ev.date + " " + ev.log_time, newDayScore: n.success, bytes: payload.length }) };
};
