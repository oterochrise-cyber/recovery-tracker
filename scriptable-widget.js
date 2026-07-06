// Recovery Tracker — home-screen quote widget (for the Scriptable app)
// Shows your current context-aware quote; iOS refreshes it periodically through the day.
// Setup: Scriptable app → + → paste this → name it "Recovery Quote" → add a Scriptable
// widget to your home screen → choose this script.

const URL_BASE = "https://fastidious-taiyaki-f29d4d.netlify.app/.netlify/functions/quote";
const KEY = "75rPrcOkpYPZ5f68j2f8ysVmgSTvgMTd";

let quote = "A bad day is not a bad trend.";
let steady = null;
try {
  const tz = -(new Date().getTimezoneOffset() / 60);
  const r = new Request(URL_BASE + "?key=" + KEY + "&tz=" + tz);
  const j = await r.loadJSON();
  if (j && j.quote) { quote = j.quote; steady = j.steady; }
} catch (e) {}

const w = new ListWidget();
w.backgroundColor = new Color("#06080d");
w.setPadding(14, 16, 14, 16);

const head = w.addStack();
const title = head.addText("🧭 RECOVERY");
title.font = Font.boldSystemFont(10);
title.textColor = new Color("#8fa0bf");
if (steady != null) {
  head.addSpacer();
  const s = head.addText(steady + "d steady");
  s.font = Font.boldSystemFont(10);
  s.textColor = new Color("#45e0c0");
}
w.addSpacer(8);

const q = w.addText("“" + quote + "”");
q.font = Font.mediumSystemFont(14);
q.textColor = new Color("#f5f8ff");
q.minimumScaleFactor = 0.6;

w.addSpacer();
w.url = "https://fastidious-taiyaki-f29d4d.netlify.app/index.html"; // tap opens the app
w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000); // ask iOS to refresh ~every 30 min

if (config.runsInWidget) { Script.setWidget(w); }
else { await w.presentMedium(); }
Script.complete();
