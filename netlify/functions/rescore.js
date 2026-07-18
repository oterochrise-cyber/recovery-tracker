// One-shot rescore: recompute every stored nightly.success with the v2 formula
// (45% standards + 22% self-control + 8% recovery [panic excluded] + 25% day rating
// − 6/impulsive contact). Key-gated; snapshots first. Temporary — remove after use.
const admin = require("firebase-admin");

function init() {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  return admin.firestore();
}

const STAND_KEYS = ["s_space", "s_anger", "s_window", "s_ate", "s_hydrate", "s_trained", "s_work", "s_tool", "s_self", "s_connect"];
const num = v => v == null || v === "" ? 0 : +v;
const blank = v => v == null || v === "" ? null : v;
const avg = a => { const x = a.filter(v => v != null); return x.length ? x.reduce((s, b) => s + +b, 0) / x.length : null; };

function successScoreV2(DB, n, date) { // mirror of the v2 client formula
  const triVal = v => v === "Yes" ? 2 : v === "Partially" ? 1 : 0;
  const standPts = STAND_KEYS.reduce((s, k) => s + triVal(n[k]), 0);
  const evs = (DB.events || []).filter(e => e.date === date);
  let scPts, recBonus = 0, impulse = 0;
  if (evs.length) {
    const sc = avg(evs.map(e => e.self_control != null ? e.self_control : null));
    scPts = sc != null ? (sc / 2) * 10 : 8;
    const calm = evs.filter(e => e.event_type !== "Panic");
    const dropped = calm.filter(e => blank(e.anxiety_after) != null && num(e.anxiety_after) < num(e.anxiety)).length;
    recBonus = calm.length ? (dropped / calm.length) * 10 : 0;
    impulse = evs.filter(e => e.contacted_val && e.contacted_val !== "No" && e.contact_nature === "Impulsive").length;
  } else { scPts = 8; recBonus = 6; }
  const dr = blank(n.day_rating);
  let s = (standPts / 20) * 45 + (scPts / 10) * 22 + (recBonus / 10) * 8 - impulse * 6;
  s = dr != null ? s + (+dr / 10) * 25 : s * (100 / 75);
  return Math.max(0, Math.min(100, Math.round(s)));
}

exports.handler = async (event) => {
  const qp = (event && event.queryStringParameters) || {};
  if (qp.key !== process.env.QUOTE_KEY) return { statusCode: 401, body: "unauthorized" };
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "POST to rescore" };
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
  DB.nightly = DB.nightly || {};

  const today = new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);
  await db.doc("users/" + uid + "/tracker/snap-" + today + "-pre-rescore")
    .set({ json: docSnap.data().json, at: Date.now(), reason: "pre-rescore backup (formula v1 scores)" });

  const now = Date.now();
  const changes = {};
  Object.keys(DB.nightly).sort().forEach(d => {
    const n = DB.nightly[d];
    const before = n.success != null ? n.success : null;
    const after = successScoreV2(DB, n, d);
    if (before !== after) { changes[d] = before + " -> " + after; }
    n.success = after; n._u = now;
  });

  const payload = JSON.stringify(DB);
  await db.doc("users/" + uid + "/tracker/data")
    .set({ json: payload, updatedAt: admin.firestore.FieldValue.serverTimestamp(), device: "claude-rescore" });

  return { statusCode: 200, headers: { "content-type": "application/json" },
    body: JSON.stringify({ nights: Object.keys(DB.nightly).length, changed: changes, bytes: payload.length }) };
};
