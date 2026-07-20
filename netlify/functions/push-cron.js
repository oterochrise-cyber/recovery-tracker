// Scheduled every 15 min (netlify.toml). Sends: 8am briefing nudge, 2pm + 6pm contextual
// words, 9:30pm close-the-day — deduped per day via a pushlog doc. ?test=1&key=... sends immediately.
const webpush = require("web-push");
const admin = require("firebase-admin");
const { buildCtx, pickQuote } = require("../lib/quotes");

function init() {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  webpush.setVapidDetails("mailto:chris.otero.healthadvisor@gmail.com",
    process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  return admin.firestore();
}

function compose(slotId, ctx, quote) {
  if (slotId === "morning") return { title: "🧭 Your briefing is ready", body: quote.text, tag: "rt-morning", url: "./index.html" };
  if (slotId === "night") return { title: "🌙 Close the day", body: "Two minutes, honest answers. " + quote.text, tag: "rt-night", url: "./index.html" };
  if (slotId === "test") return { title: "🔔 Test — you're wired up", body: quote.text, tag: "rt-test", url: "./index.html" };
  return { title: "🧭 Word for the moment", body: quote.text, tag: "rt-" + slotId, url: "./index.html" };
}

exports.handler = async (event) => {
  const qp = (event && event.queryStringParameters) || {};
  const isTest = qp.test === "1";
  if (isTest && qp.key !== process.env.QUOTE_KEY) return { statusCode: 401, body: "unauthorized" };
  let db;
  try { db = init(); } catch (e) { return { statusCode: 500, body: "env not configured: " + e.message }; }

  const userRefs = await db.collection("users").listDocuments();
  let sent = 0; const log = [];
  for (const u of userRefs) {
    try {
      const pushDoc = await db.doc("users/" + u.id + "/tracker/push").get();
      if (!pushDoc.exists || !pushDoc.data().sub || pushDoc.data().enabled === false) continue;
      const sub = JSON.parse(pushDoc.data().sub);
      const tz = pushDoc.data().tz != null ? +pushDoc.data().tz : -4;
      const local = new Date(Date.now() + tz * 3600 * 1000);
      const hh = local.getUTCHours(), mm = local.getUTCMinutes();
      const today = local.toISOString().slice(0, 10);
      let slotId = null;
      if (isTest) slotId = "test";
      else if (hh === 8 && mm < 15) slotId = "morning";
      else if (hh === 14 && mm < 15) slotId = "midday";
      else if (hh === 18 && mm < 15) slotId = "evening";
      else if (hh === 21 && mm >= 30 && mm < 45) slotId = "night";
      if (!slotId) continue;

      const markerRef = db.doc("users/" + u.id + "/tracker/pushlog");
      const mDoc = await markerRef.get();
      let sentMap = mDoc.exists ? (mDoc.data().sent || {}) : {};
      if (!isTest && sentMap[today + ":" + slotId]) continue;

      let ctx = { hour: hh, minute: mm, seedDate: today };
      try {
        const dataDoc = await db.doc("users/" + u.id + "/tracker/data").get();
        if (dataDoc.exists && dataDoc.data().json) {
          ctx = Object.assign(buildCtx(JSON.parse(dataDoc.data().json), today, hh), { seedDate: today, minute: mm });
        }
      } catch (e) { log.push("ctx: " + e.message); }

      const payload = compose(slotId, ctx, pickQuote(ctx));
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload));
        sent++;
        if (!isTest) {
          sentMap[today + ":" + slotId] = Date.now();
          // prune markers older than 7 days
          const cutoff = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
          sentMap = Object.fromEntries(Object.entries(sentMap).filter(([k]) => k.slice(0, 10) >= cutoff));
          await markerRef.set({ sent: sentMap }, { merge: false });
        }
      } catch (e) {
        log.push("send: " + (e.statusCode || "") + " " + e.message);
        if (e.statusCode === 404 || e.statusCode === 410) {
          await db.doc("users/" + u.id + "/tracker/push").set({ sub: null, enabled: false }, { merge: true });
        }
      }
    } catch (e) { log.push("user: " + e.message); }
  }
  return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ sent, log }) };
};
