// Shared quote bank + context logic for push-cron and quote functions.
// Tags: heldline, postslip, milestone, red, risk, morning, afternoon, evening, night, generic
const QUOTES = [
  { t: "An hour ago you felt the pull and didn't move. That's not nothing — that's the whole program.", g: ["heldline"] },
  { t: "You just proved the urge wrong. It said you had to act. You didn't.", g: ["heldline"] },
  { t: "The rep only counts when it's hard. That one counted.", g: ["heldline"] },
  { t: "A slip is data, not a verdict. The phone is down. Today is already a different day.", g: ["postslip"] },
  { t: "You rebuild trust with yourself one clean day at a time. Start now.", g: ["postslip"] },
  { t: "No spiraling about the spiral. One clean hour, then another.", g: ["postslip"] },
  { t: "Look at that number. Nobody gave it to you. Nobody can take it without your permission.", g: ["milestone"] },
  { t: "Milestone days are proof days. This is who you said you'd become.", g: ["milestone"] },
  { t: "Your body is running on fumes — panic will sound louder than it is today. Don't negotiate with it.", g: ["red"] },
  { t: "Red body, boring day. Three meals, a walk, an early night. Heroics are for green days.", g: ["red"] },
  { t: "Whatever feels urgent today probably isn't. Low recovery writes fiction.", g: ["red"] },
  { t: "Yesterday's urge echoes into today. Pre-decide now: if it comes, it's the pause, not the phone.", g: ["risk"] },
  { t: "High-risk days don't need perfect. They need boring, fed, and busy.", g: ["risk"] },
  { t: "The feeling will make its pitch today. You've heard it before. You know how it ends.", g: ["risk"] },
  { t: "Set the intention. Days with a spine bend less.", g: ["morning"] },
  { t: "This morning's numbers are information, not instructions. You decide the day.", g: ["morning"] },
  { t: "Today's job: be the man the briefing thinks you are.", g: ["morning"] },
  { t: "Mid-day check: eaten? water? shoulders down? Fix what's fixable in five minutes.", g: ["afternoon"] },
  { t: "The afternoon dip is chemistry, not truth. Eat something and reassess.", g: ["afternoon"] },
  { t: "Whatever happened this morning is logged, not carried. The afternoon is new.", g: ["afternoon"] },
  { t: "Decide now what tonight is for — before the night decides for you.", g: ["evening"] },
  { t: "Ordinary evenings are how nervous systems heal. Gym, dinner, a call, a shower.", g: ["evening"] },
  { t: "Close the day in the app tonight. The score is how you acted, and you acted.", g: ["evening"] },
  { t: "Nothing true gets decided after 10pm. Put the night to bed and check the math in the morning.", g: ["night"] },
  { t: "Night thoughts are loud because it's quiet — not because they're right.", g: ["night"] },
  { t: "The phone stays down. Whatever it promises, it's lying about the price.", g: ["night"] },
  { t: "A bad day is not a bad trend.", g: ["generic"] },
  { t: "Feel everything. Act on almost none of it. That's the discipline.", g: ["generic"] },
  { t: "The calm you're building can't be given to you — which means it can't be taken either.", g: ["generic"] },
  { t: "Six weeks of evidence beats six years of promises. Keep collecting.", g: ["generic"] }
];

// Build context from the tracker's data JSON for a given local date ("YYYY-MM-DD") and hour.
function buildCtx(D, today, hour) {
  const iso = d => d.toISOString().slice(0, 10);
  const yd = iso(new Date(new Date(today + "T12:00:00Z").getTime() - 864e5));
  const events = (D.events || []);
  const on = d => events.filter(e => e.date === d);
  const num = x => (x === "" || x == null ? 0 : Number(x));
  const yE = on(yd), tE = on(today);
  const heldRecent = tE.some(e => e.self_control === 2 || (e.contacted_val === "No" && num(e.urge_contact) >= 6));
  const slip = yE.concat(tE).some(e => e.contacted_val && e.contacted_val !== "No" && e.contact_nature === "Impulsive");
  const m = (D.morning || {})[today] || {};
  const rec = m.recovery_pct != null && m.recovery_pct !== "" ? +m.recovery_pct : null;
  // steady streak: consecutive days (from today backwards) without impulsive contact
  let steady = 0;
  for (let i = 0; i < 60; i++) {
    const d = iso(new Date(new Date(today + "T12:00:00Z").getTime() - i * 864e5));
    const hasData = (D.morning || {})[d] || (D.nightly || {})[d] || on(d).length || (D.goals || {})[d];
    if (!hasData) { if (i === 0) continue; else break; }
    if (on(d).some(e => e.contacted_val && e.contacted_val !== "No" && e.contact_nature === "Impulsive")) break;
    steady++;
  }
  const milestone = [3, 7, 14, 21, 28, 42].indexOf(steady) >= 0;
  const risk = Math.max(0, ...yE.map(e => num(e.urge_contact))) >= 6;
  return { heldRecent, slip, rec, steady, milestone, risk, hour };
}

function pickQuote(ctx) {
  const h = ctx.hour != null ? ctx.hour : 12;
  const slot = h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
  const order = [];
  if (ctx.heldRecent) order.push("heldline");
  if (ctx.slip) order.push("postslip");
  if (ctx.milestone) order.push("milestone");
  if (ctx.rec != null && ctx.rec < 34) order.push("red");
  if (ctx.risk) order.push("risk");
  order.push(slot, "generic");
  for (const tag of order) {
    const c = QUOTES.filter(q => q.g.indexOf(tag) >= 0);
    if (c.length) {
      const seed = parseInt((ctx.seedDate || "20260101").replace(/-/g, ""), 10) + Math.floor(h / 3);
      return { text: c[seed % c.length].t, tag };
    }
  }
  return { text: QUOTES[QUOTES.length - 1].t, tag: "generic" };
}

module.exports = { QUOTES, buildCtx, pickQuote };
