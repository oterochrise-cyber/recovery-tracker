// Read-only data-integrity report: record counts, per-store coverage, and the full list
// of cloud snapshots/backups. ?dump=1 additionally returns the complete DB json (for an
// offline archive). Key-gated, GET only, writes nothing. Temporary — remove after use.
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
  const raw = docSnap.data().json;
  const DB = JSON.parse(raw);

  const span = o => { const k = Object.keys(o || {}).sort(); return k.length ? k[0] + " → " + k[k.length - 1] + " (" + k.length + " days)" : "none"; };
  const trackerDocs = await db.collection("users/" + uid + "/tracker").listDocuments();
  const snaps = [];
  for (const d of trackerDocs) {
    if (d.id === "data" || d.id === "push" || d.id === "pushlog") continue;
    const s = await d.get();
    const j = s.exists && s.data().json;
    snaps.push({ id: d.id, bytes: j ? j.length : 0, events: j ? (JSON.parse(j).events || []).length : null });
  }
  snaps.sort((a, b) => a.id < b.id ? -1 : 1);

  const report = {
    uid,
    lastWriter: docSnap.data().device || null,
    updatedAt: docSnap.data().updatedAt ? docSnap.data().updatedAt.toDate().toISOString() : null,
    docBytes: raw.length,
    counts: {
      events: (DB.events || []).length,
      activities: (DB.activities || []).length,
      morningDays: span(DB.morning),
      nightlyDays: span(DB.nightly),
      journalDays: span(DB.journal),
      goalDays: Object.keys(DB.goals || {}).length,
      whoopImports: (DB.whoopImports || []).length,
      quotesSeen: undefined
    },
    snapshots: snaps
  };
  if (qp.dump === "1") report.json = raw;
  return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(report) };
};
