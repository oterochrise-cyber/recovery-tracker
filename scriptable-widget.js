// Recovery Tracker — quote widget (Scriptable)
// Lock screen: big, clean, short quote — no title. Home screen: full dark card.
const URL_BASE = "https://fastidious-taiyaki-f29d4d.netlify.app/.netlify/functions/quote";
const KEY = "75rPrcOkpYPZ5f68j2f8ysVmgSTvgMTd";

let full = "A bad day is not a bad trend.";
let short = full;
let steady = null;
try {
  const tz = -(new Date().getTimezoneOffset() / 60);
  const r = new Request(URL_BASE + "?key=" + KEY + "&tz=" + tz);
  const j = await r.loadJSON();
  if (j && j.quote) { full = j.quote; short = j.short || j.quote; steady = j.steady; }
} catch (e) {}

const fam = config.widgetFamily || "";
const w = new ListWidget();
w.url = "https://fastidious-taiyaki-f29d4d.netlify.app/index.html";
w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000); // ask iOS to refresh often

if (fam.indexOf("accessory") === 0) {
  // ---- LOCK SCREEN: quote only, big and readable ----
  w.addAccessoryWidgetBackground = true;
  w.setPadding(2, 4, 2, 4);
  w.addSpacer();
  const q = w.addText(short);
  q.font = Font.semiboldSystemFont(14);
  q.lineLimit = 3;
  q.minimumScaleFactor = 0.7;
  q.centerAlignText();
  w.addSpacer();
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
  const q = w.addText("“" + full + "”");
  q.font = Font.mediumSystemFont(14);
  q.textColor = new Color("#f5f8ff");
  q.minimumScaleFactor = 0.6;
  w.addSpacer();
}

if (config.runsInWidget) { Script.setWidget(w); }
else { await w.presentMedium(); }
Script.complete();
