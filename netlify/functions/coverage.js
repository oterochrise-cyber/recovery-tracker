// Read-only coverage report: which days have events / morning / nightly / WHOOP / journal /
// activities / goals. Key-gated, GET only, writes nothing. Temporary — remove after use.
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

  const from = qp.from || "2026-07-01", to = qp.to || "2026-12-31";
  const days = {};
  const day = d => (days[d] = days[d] || { events: 0, activities: 0 });
  (DB.events || []).forEach(e => { if (e.date >= from && e.date <= to) day(e.date).events++; });
  (DB.activities || []).forEach(a => { if (a.date >= from && a.date <= to) day(a.date).activities++; });
  Object.entries(DB.morning || {}).forEach(([d, m]) => {
    if (d < from || d > to) return;
    const x = day(d);
    x.whoop = m.recovery_pct != null;
    x.morningManual = m.m_anxiety != null || m.m_sleepq != null || m.intention != null;
  });
  Object.keys(DB.nightly || {}).forEach(d => { if (d >= from && d <= to) day(d).nightly = true; });
  Object.keys(DB.journal || {}).forEach(d => { if (d >= from && d <= to) day(d).journal = true; });
  Object.entries(DB.goals || {}).forEach(([d, g]) => {
    if (d < from || d > to) return;
    day(d).goals = Object.keys(g).filter(k => k !== "_u" && g[k] === true);
  });
  const lastImport = (DB.whoopImports || []).slice(-1)[0];

  return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({
    updatedDevice: docSnap.data().device || null,
    days,
    lastWhoopImport: lastImport ? lastImport.ts : null,
    totals: { events: (DB.events || []).length, activities: (DB.activities || []).length }
  }) };
};
