// One-shot WHOOP merge bridge: POST pre-transformed {morning,journal,gymGoals,importFiles}
// (client-parser-identical values) into the cloud tracker doc. Key-gated; snapshots first.
// GET ?verify=1 reports current whoop coverage. Temporary — remove after use.
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
  DB.morning = DB.morning || {}; DB.journal = DB.journal || {}; DB.goals = DB.goals || {}; DB.whoopImports = DB.whoopImports || [];

  if (qp.verify === "1") {
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({
      uid,
      morningWhoopDates: Object.keys(DB.morning).filter(d => DB.morning[d]._whoop).sort(),
      journalDates: Object.keys(DB.journal).sort(),
      gymGoalDates: Object.keys(DB.goals).filter(d => DB.goals[d] && DB.goals[d].gym).sort(),
      whoopImports: DB.whoopImports.length
    }) };
  }
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "POST the merge payload" };

  let data;
  try { data = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: "invalid JSON body" }; }
  const today = new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);
  await db.doc("users/" + uid + "/tracker/snap-" + today + "-pre-whoop")
    .set({ json: docSnap.data().json, at: Date.now(), reason: "pre-whoop-import backup" });

  const now = Date.now();
  let md = 0, jd = 0, gg = 0;
  for (const [d, fields] of Object.entries(data.morning || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const m = DB.morning[d] || {};
    for (const [k, v] of Object.entries(fields)) {
      if (k === "workout_strain") m.workout_strain = String(Math.max(+(m.workout_strain || 0), +v));
      else m[k] = String(v);
    }
    m._u = now; m._whoop = 1; DB.morning[d] = m; md++;
  }
  for (const [d, qs] of Object.entries(data.journal || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const J = DB.journal[d] || {};
    for (const [q, a] of Object.entries(qs)) J[q] = !!a;
    J._u = now; DB.journal[d] = J; jd++;
  }
  for (const d of (data.gymGoals || [])) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const g = DB.goals[d] || {};
    g.gym = true; g._u = now; DB.goals[d] = g; gg++;
  }
  if (Array.isArray(data.importFiles)) {
    DB.whoopImports.push({ id: now, ts: new Date().toISOString(), files: data.importFiles.map(f => ({ name: String(f.name), note: String(f.note) })) });
    if (DB.whoopImports.length > 30) DB.whoopImports = DB.whoopImports.slice(-30);
  }

  const payload = JSON.stringify(DB);
  await db.doc("users/" + uid + "/tracker/data")
    .set({ json: payload, updatedAt: admin.firestore.FieldValue.serverTimestamp(), device: "claude-whoop-import" });

  return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({
    merged: { morningDays: md, journalDays: jd, gymGoals: gg },
    bytes: payload.length,
    morningWhoopDates: Object.keys(DB.morning).filter(d => DB.morning[d]._whoop).sort()
  }) };
};
