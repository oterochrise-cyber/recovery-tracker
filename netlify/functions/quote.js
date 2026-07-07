// Returns the current contextual quote as JSON — used by the Scriptable home-screen widget.
// GET /.netlify/functions/quote?key=QUOTE_KEY
const admin = require("firebase-admin");
const { buildCtx, pickQuote } = require("../lib/quotes");

exports.handler = async (event) => {
  const qp = (event && event.queryStringParameters) || {};
  if (qp.key !== process.env.QUOTE_KEY) return { statusCode: 401, body: "unauthorized" };
  try {
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
    }
    const db = admin.firestore();
    const tz = qp.tz != null ? +qp.tz : -4;
    const local = new Date(Date.now() + tz * 3600 * 1000);
    const today = local.toISOString().slice(0, 10);
    const hh = local.getUTCHours();
    let ctx = { hour: hh, seedDate: today }, steady = null;
    const users = await db.collection("users").listDocuments();
    if (users.length) {
      const dataDoc = await db.doc("users/" + users[0].id + "/tracker/data").get();
      if (dataDoc.exists && dataDoc.data().json) {
        ctx = Object.assign(buildCtx(JSON.parse(dataDoc.data().json), today, hh), { seedDate: today });
        steady = ctx.steady;
      }
    }
    const q = pickQuote(ctx);
    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "no-store" },
      body: JSON.stringify({ quote: q.text, short: q.short, tag: q.tag, steady: steady, date: today,
        style: { size: 22, bg: false } }) // max text size — quotes render as large as fits the frame
    };
  } catch (e) {
    return { statusCode: 500, body: "error: " + e.message };
  }
};
