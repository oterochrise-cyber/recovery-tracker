// Reads the tracker from Firestore.
// Since Sep 25, 2026 the tracker is stored as the SAME JSON text split into pieces
// ("part-data-v2-0", "part-data-v2-1", …) plus a manifest doc ("data-v2") holding the
// piece count, byte length and SHA-256 of the whole text — Firestore caps a single
// document at ~1 MB and the tracker outgrew it. Anything that doesn't reassemble to
// exactly that hash is refused. Falls back to the original single document ("data")
// if no manifest exists.
const crypto = require("crypto");

const STORE_DOC = "data-v2";
const STORE_FMT = "chunked-v1";
const partId = (base, i) => "part-" + base + "-" + i;

async function readChunked(db, uid, base) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const m = await db.doc("users/" + uid + "/tracker/" + base).get();
    if (!m.exists) return null;
    const man = m.data();
    if (man.fmt !== STORE_FMT) throw new Error("unknown storage format: " + man.fmt);
    const refs = Array.from({ length: man.parts }, (_, i) => db.doc("users/" + uid + "/tracker/" + partId(base, i)));
    const got = refs.length ? await db.getAll(...refs) : [];
    const byId = new Map(got.map(p => [p.id, p]));
    const ps = refs.map(r => byId.get(r.id));
    if (ps.every((p, i) => p && p.exists && p.data().gen === man.gen && p.data().i === i && typeof p.data().s === "string")) {
      const str = ps.map(p => p.data().s).join("");
      if (Buffer.byteLength(str, "utf8") === man.bytes &&
          crypto.createHash("sha256").update(str, "utf8").digest("hex") === man.sha256) return str;
    }
    await new Promise(r => setTimeout(r, 500 * (attempt + 1))); // a save may have landed mid-read — look again
  }
  throw new Error("tracker failed its integrity check");
}

async function loadTrackerJson(db, uid) {
  const v2 = await readChunked(db, uid, STORE_DOC);
  if (v2 !== null) return v2;
  const d = await db.doc("users/" + uid + "/tracker/data").get();
  return d.exists && d.data().json ? d.data().json : null;
}

module.exports = { loadTrackerJson, readChunked, partId, STORE_DOC, STORE_FMT };
