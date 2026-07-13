// One-shot check-in backfill: POST {morning:{date:{fields}}, nightly:{date:{fields}}}.
// Morning fields merge into existing records (WHOOP data preserved); nightly records get
// success computed server-side with the app's exact successScore formula against that
// day's events. Key-gated; snapshots first. Temporary — remove after use.
const admin = require("firebase-admin");

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return admin.firestore();
}

const STAND_KEYS = ["s_space", "s_anger", "s_window", "s_ate", "s_hydrate", "s_trained", "s_work", "s_tool", "s_self", "s_connect"];
const num = v => v == null || v === "" ? 0 : +v;
const blank = v => v == null || v === "" ? null : v;
const avg = arr => { const xs = arr.filter(x => x != null); return xs.length ? xs.reduce((a, b) => a + +b, 0) / xs.length : null; };

function successScore(DB, n, date) { // mirror of the client function
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
  const s = (standPts / 20) * 60 + (scPts / 10) * 30 + (recBonus / 10) * 10 - impulse * 6;
  return Math.max(0, Math.min(100, Math.round(s)));
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
  DB.morning = DB.morning || {}; DB.nightly = DB.nightly || {};

  if (event.httpMethod !== "POST") return { statusCode: 405, body: "POST the check-ins payload" };
  let data;
  try { data = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: "invalid JSON body" }; }

  const today = new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);
  await db.doc("users/" + uid + "/tracker/snap-" + today + "-pre-checkins")
    .set({ json: docSnap.data().json, at: Date.now(), reason: "pre-checkins backup" });

  const now = Date.now();
  const scores = {};
  let md = 0, nd = 0;
  for (const [d, fields] of Object.entries(data.morning || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const m = DB.morning[d] || {};
    Object.assign(m, fields);
    m._u = now; DB.morning[d] = m; md++;
  }
  for (const [d, fields] of Object.entries(data.nightly || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const n = Object.assign({}, DB.nightly[d] || {}, fields);
    n.success = successScore(DB, n, d);
    n._u = now; DB.nightly[d] = n; nd++;
    scores[d] = n.success;
  }

  const payload = JSON.stringify(DB);
  await db.doc("users/" + uid + "/tracker/data")
    .set({ json: payload, updatedAt: admin.firestore.FieldValue.serverTimestamp(), device: "claude-checkins" });

  return { statusCode: 200, headers: { "content-type": "application/json" },
    body: JSON.stringify({ merged: { mornings: md, nights: nd }, dayScores: scores, bytes: payload.length }) };
};
