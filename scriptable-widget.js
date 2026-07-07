// Recovery Tracker — quote widget (Scriptable)
// Lock screen: quote only — no background, large text. Home screen: full dark card.
// Layout values come from the server when available, so future tweaks need no re-paste.
const URL_BASE = "https://fastidious-taiyaki-f29d4d.netlify.app/.netlify/functions/quote";
const KEY = "75rPrcOkpYPZ5f68j2f8ysVmgSTvgMTd";

let full = "A bad day is not a bad trend.";
let short = full;
let steady = null;
let style = {};
try {
  const tz = -(new Date().getTimezoneOffset() / 60);
  const r = new Request(URL_BASE + "?key=" + KEY + "&tz=" + tz);
  const j = await r.loadJSON();
  if (j && j.quote) { full = j.quote; short = j.short || j.quote; steady = j.steady; style = j.style || {}; }
} catch (e) {}

const fam = config.widgetFamily || "";
const w = new ListWidget();
w.url = "https://fastidious-taiyaki-f29d4d.netlify.app/index.html";
w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

if (fam.indexOf("accessory") === 0) {
  // ---- LOCK SCREEN: no background, big centered text ----
  w.addAccessoryWidgetBackground = style.bg === true; // default: OFF
  w.setPadding(0, 0, 0, 0);
  w.addSpacer();
  const q = w.addText(short);
  q.font = Font.boldSystemFont(style.size || 16);
  q.lineLimit = 3;
  q.minimumScaleFactor = 0.55;
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
