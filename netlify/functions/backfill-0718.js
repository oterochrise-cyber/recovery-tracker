// One-shot combined backfill (Jul 14-18): events+activities, WHOOP merge, and check-ins
// with server-computed success scores — in that order, one POST. Key-gated; snapshots
// first. Temporary — remove after use.
const admin = require("firebase-admin");

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return admin.firestore();
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(+v || 0)));
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
  DB.events = DB.events || []; DB.activities = DB.activities || []; DB.morning = DB.morning || {};
  DB.nightly = DB.nightly || {}; DB.journal = DB.journal || {}; DB.goals = DB.goals || {}; DB.whoopImports = DB.whoopImports || [];

  if (event.httpMethod !== "POST") return { statusCode: 405, body: "POST the backfill payload" };
  let data;
  try { data = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: "invalid JSON body" }; }

  const today = new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);
  await db.doc("users/" + uid + "/tracker/snap-" + today + "-pre-backfill")
    .set({ json: docSnap.data().json, at: Date.now(), reason: "pre-backfill backup" });

  const now = Date.now();
  const out = { events: 0, activities: 0, skipped: 0, whoopDays: 0, journalDays: 0, gymGoals: 0, mornings: 0, nights: 0, dayScores: {} };

  // -- phase 1: events + activities (client paste-import semantics, sig-deduped) --
  const sig = e => [e.date, e.log_time || "", e.event_type || ""].join("|");
  const have = new Set(DB.events.map(sig));
  (data.events || []).forEach((ev, i) => {
    if (!ev || !ev.date) return;
    const d = String(ev.date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > today) return;
    const tm = (ev.time && /^\d{1,2}:\d{2}/.test(String(ev.time))) ? String(ev.time).slice(0, 5).padStart(5, "0") : "12:00";
    const rec = { id: now + i, ts: d + "T" + tm + ":00", date: d, log_date: d, log_time: tm };
    ["event_type", "trigger", "location", "what_happened", "thoughts", "reframe", "helped_most", "do_differently", "contacted_val", "contact_nature"]
      .forEach(k => { if (ev[k] != null && ev[k] !== "") rec[k] = String(ev[k]); });
    ["anxiety", "anger", "urge_contact", "anxiety_after", "anger_after", "urge_after", "physical"]
      .forEach(k => { if (ev[k] != null && ev[k] !== "") rec[k] = clamp(ev[k], 0, 10); });
    if (ev.duration_min != null && ev.duration_min !== "") rec.duration_min = String(clamp(ev.duration_min, 0, 1440));
    if (ev.self_control != null) rec.self_control = clamp(ev.self_control, 0, 2);
    if (Array.isArray(ev.actions)) rec.actions = ev.actions.map(String);
    if (Array.isArray(ev.symptoms)) rec.symptoms = ev.symptoms.map(String);
    if (have.has(sig(rec))) { out.skipped++; return; }
    have.add(sig(rec));
    DB.events.push(rec); out.events++;
  });
  const haveAct = new Set(DB.activities.map(a => [a.date, a.time || "", a.activity || ""].join("|")));
  (data.activities || []).forEach((a, i) => {
    if (!a || !a.date) return;
    const d = String(a.date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > today) return;
    const rec = { id: now + 9000 + i, date: d, time: String(a.time || "12:00").slice(0, 5), category: a.category || "Personal", activity: a.activity || "Activity", _u: now };
    if (a.duration_min != null) rec.duration_min = String(Math.round(+a.duration_min || 0));
    if (a.felt_normal != null) rec.felt_normal = !!a.felt_normal;
    if (a.notes) rec.notes = String(a.notes);
    const k = [rec.date, rec.time, rec.activity].join("|");
    if (haveAct.has(k)) { out.skipped++; return; }
    haveAct.add(k);
    DB.activities.push(rec); out.activities++;
  });

  // -- phase 2: WHOOP merge (pre-transformed values; assign into existing records) --
  const w = data.whoop || {};
  for (const [d, fields] of Object.entries(w.morning || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const m = DB.morning[d] || {};
    for (const [k, v] of Object.entries(fields)) {
      if (k === "workout_strain") m.workout_strain = String(Math.max(+(m.workout_strain || 0), +v));
      else m[k] = String(v);
    }
    m._u = now; m._whoop = 1; DB.morning[d] = m; out.whoopDays++;
  }
  for (const [d, qs] of Object.entries(w.journal || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const J = DB.journal[d] || {};
    for (const [q, a] of Object.entries(qs)) J[q] = !!a;
    J._u = now; DB.journal[d] = J; out.journalDays++;
  }
  for (const d of (w.gymGoals || [])) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const g = DB.goals[d] || {};
    g.gym = true; g._u = now; DB.goals[d] = g; out.gymGoals++;
  }
  if (Array.isArray(w.importFiles)) {
    DB.whoopImports.push({ id: now, ts: new Date().toISOString(), files: w.importFiles.map(f => ({ name: String(f.name), note: String(f.note) })) });
    if (DB.whoopImports.length > 30) DB.whoopImports = DB.whoopImports.slice(-30);
  }

  // -- phase 3: check-ins (morning assign-in; nightly with computed success) --
  const c = data.checkins || {};
  for (const [d, fields] of Object.entries(c.morning || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const m = DB.morning[d] || {};
    Object.assign(m, fields);
    m._u = now; DB.morning[d] = m; out.mornings++;
  }
  for (const [d, fields] of Object.entries(c.nightly || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const n = Object.assign({}, DB.nightly[d] || {}, fields);
    n.success = successScore(DB, n, d);
    n._u = now; DB.nightly[d] = n; out.nights++;
    out.dayScores[d] = n.success;
  }

  const payload = JSON.stringify(DB);
  await db.doc("users/" + uid + "/tracker/data")
    .set({ json: payload, updatedAt: admin.firestore.FieldValue.serverTimestamp(), device: "claude-backfill" });

  out.bytes = payload.length;
  const byDate = {};
  DB.events.forEach(e => { if (e.date >= "2026-07-13") byDate[e.date] = (byDate[e.date] || 0) + 1; });
  out.eventsByDateFromJul13 = byDate;
  return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(out) };
};
