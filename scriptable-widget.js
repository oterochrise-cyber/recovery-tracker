// Recovery Tracker — quote widget (Scriptable)
// Works on BOTH the lock screen (compact) and the home screen (full dark card).
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

const fam = config.widgetFamily || "";
const w = new ListWidget();
w.url = "https://fastidious-taiyaki-f29d4d.netlify.app/index.html"; // tap opens the app

if (fam.indexOf("accessory") === 0) {
  // ---- LOCK SCREEN: compact ----
  w.addAccessoryWidgetBackground = true;
  const top = w.addText("🧭 " + (steady != null ? steady + "d steady" : "RECOVERY"));
  top.font = Font.boldSystemFont(11);
  w.addSpacer(2);
  const q = w.addText(quote);
  q.font = Font.systemFont(11);
  q.lineLimit = 2;
  q.minimumScaleFactor = 0.8;
} else {
  // ---- HOME SCREEN: full dark card ----
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
  w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
}

if (config.runsInWidget) { Script.setWidget(w); }
else { await w.presentMedium(); }
Script.complete();
