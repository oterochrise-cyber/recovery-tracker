// Shared quote bank + context logic for push-cron and quote functions.
// t = full text · s = short (lock screen; omitted when t is already short)
// Tags: heldline, postslip, milestone, red, risk, weekend, morning, afternoon, evening, night, generic
const QUOTES = [
  // ——— week-3 pack (Jul 20) — his words: realistic, action-focused, no false reassurance ———
  { t: "My character is built by how I act while I'm hurting.", g: ["risk", "heldline", "postslip", "generic"] },
  { t: "Uncertainty is uncomfortable, not dangerous.", g: ["risk", "red", "afternoon", "generic"] },
  { t: "Feel everything. Chase nothing.", g: ["risk", "weekend", "evening", "generic"] },
  { t: "I don't need answers to keep moving.", g: ["risk", "morning", "postslip", "generic"] },
  { t: "I am becoming someone pain cannot control.", g: ["milestone", "morning", "heldline", "generic"] },
  { t: "I refuse to let one chapter define my life.", g: ["postslip", "generic"] },
  { t: "My future is bigger than my current pain.", g: ["red", "generic"] },
  { t: "I will become someone this pain was worth creating.", g: ["milestone", "generic"] },
  { t: "Peace is built, not found.", g: ["generic", "morning"] },
  { t: "The strongest move today is self-control.", g: ["risk", "morning"] },
  { t: "My peace is no longer dependent on another person.", g: ["milestone", "generic"] },
  { t: "I don't have to solve today to survive today.", g: ["red", "risk"] },
  { t: "My mind wants certainty. My job is to stay steady.", g: ["risk", "afternoon"] },
  { t: "Not knowing is no longer an emergency.", g: ["risk", "red"] },
  { t: "I choose progress over certainty.", g: ["generic", "morning"] },
  { t: "Every urge I don't act on is a victory.", g: ["heldline", "risk"] },
  { t: "My emotions are real. My actions are my choice.", g: ["risk", "postslip"] },
  { t: "Discipline is remembering who I want to become.", g: ["risk", "morning"] },
  { t: "Temporary emotion. Permanent character.", g: ["risk", "evening"] },
  { t: "I don't negotiate with emotional impulses.", g: ["risk", "weekend", "night"] },
  { t: "Love doesn't require chasing.", g: ["risk", "weekend"] },
  { t: "The right people don't require convincing.", g: ["generic", "evening"] },
  { t: "If it's meant for me, I won't have to abandon myself to keep it.", g: ["generic", "night"] },
  { t: "Closure begins when I stop demanding it from someone else.", g: ["postslip", "generic"] },
  { t: "I release what I cannot control.", g: ["night", "weekend", "generic"] },
  { t: "One hard day is not a broken life.", g: ["postslip", "red"] },
  { t: "Recovery is measured in trends, not moments.", g: ["postslip", "milestone"] },
  { t: "Today's goal is simple: leave stronger than I woke up.", g: ["morning"] },
  { t: "Small wins compound into a new life.", g: ["milestone"] },
  { t: "Consistency will accomplish what emotion never could.", g: ["morning", "generic"] },
  // ——— held the line ———
  { t: "An hour ago you felt the pull and didn't move. That's not nothing — that's the whole program.", s: "You felt the pull and didn't move. That's the program.", g: ["heldline"] },
  { t: "You just proved the urge wrong. It said you had to act. You didn't.", s: "The urge said act. You didn't. Proof.", g: ["heldline"] },
  { t: "The rep only counts when it's hard. That one counted.", g: ["heldline"] },
  { t: "Stay calm. Stay proud.", g: ["heldline", "risk"] },
  // ——— after a slip ———
  { t: "A slip is data, not a verdict. The phone is down. Today is already a different day.", s: "A slip is data, not a verdict. Today is new.", g: ["postslip"] },
  { t: "You rebuild trust with yourself one clean day at a time. Start now.", s: "Rebuild trust one clean day at a time.", g: ["postslip"] },
  { t: "No spiraling about the spiral. One clean hour, then another.", s: "No spiraling about the spiral. One clean hour.", g: ["postslip"] },
  { t: "Healing isn't linear.", g: ["postslip", "milestone"] },
  // ——— milestones ———
  { t: "Look at that number. Nobody gave it to you. Nobody can take it without your permission.", s: "Nobody gave you that number. Nobody takes it.", g: ["milestone"] },
  { t: "Milestone days are proof days. This is who you said you'd become.", s: "Proof day. This is who you said you'd become.", g: ["milestone"] },
  { t: "Notice the progress.", g: ["milestone"] },
  { t: "Less panic. More peace.", g: ["milestone"] },
  { t: "You're becoming yourself again.", g: ["milestone"] },
  { t: "Small wins become big changes.", g: ["milestone"] },
  { t: "One day you'll thank yourself for not giving up.", g: ["milestone"] },
  { t: "You are recovering. Keep going.", g: ["milestone"] },
  // ——— red body ———
  { t: "Your body is running on fumes — panic will sound louder than it is today. Don't negotiate with it.", s: "Body's on fumes. Don't trust loud feelings today.", g: ["red"] },
  { t: "Red body, boring day. Three meals, a walk, an early night. Heroics are for green days.", s: "Red body, boring day. Meals, walk, early night.", g: ["red"] },
  { t: "Whatever feels urgent today probably isn't. Low recovery writes fiction.", s: "Nothing is as urgent as it feels today.", g: ["red"] },
  { t: "Rest is productive.", g: ["red", "evening"] },
  // ——— risk / trigger days ———
  { t: "Yesterday's urge echoes into today. Pre-decide now: if it comes, it's the pause, not the phone.", s: "If it comes: the pause, not the phone.", g: ["risk"] },
  { t: "High-risk days don't need perfect. They need boring, fed, and busy.", s: "Boring, fed, and busy beats perfect.", g: ["risk"] },
  { t: "This feeling will pass.", g: ["risk"] },
  { t: "Observe. Don't react.", g: ["risk"] },
  { t: "Pain is temporary. Character is permanent.", g: ["risk"] },
  { t: "You don't need to prove anything.", g: ["risk"] },
  { t: "You've survived every trigger so far.", g: ["risk"] },
  { t: "Choose dignity.", g: ["risk"] },
  { t: "Your healing matters more than this moment.", g: ["risk"] },
  { t: "Let her choices belong to her.", g: ["risk"] },
  { t: "She doesn't determine your value.", g: ["risk"] },
  { t: "The urge will pass.", g: ["risk", "evening", "generic"] },
  { t: "Feel it. Don't feed it.", g: ["risk", "generic"] },
  // ——— weekend ———
  { t: "Weekends have no schedule — build one by noon, or the day builds itself.", s: "Build the weekend by noon, or it builds itself.", g: ["weekend"] },
  { t: "Weekends are where slips live. Plans are where they die.", s: "Weekends breed slips. Make plans.", g: ["weekend"] },
  { t: "Today doesn't need to be great. Gym, people, and a phone that stays boring.", s: "Gym. People. Boring phone.", g: ["weekend"] },
  { t: "Don't check what she's doing this weekend. You already know what you're doing: building.", s: "Her weekend isn't your business. Yours is.", g: ["weekend"] },
  { t: "Social media hits harder on weekends. Skip the feed, keep the streak.", s: "Skip the feed. Keep the streak.", g: ["weekend"] },
  { t: "A weekend won alone still counts. A weekend won with friends counts double.", s: "Weekends count double with company. Call someone.", g: ["weekend"] },
  { t: "Turn pain into strength.", g: ["weekend", "afternoon"] },
  { t: "Every rep is recovery.", g: ["weekend", "afternoon"] },
  { t: "Build the man you'll be proud of.", g: ["weekend", "morning"] },
  { t: "Train your body. Heal your mind.", g: ["weekend", "evening"] },
  { t: "Lift heavier than your thoughts.", g: ["weekend", "afternoon"] },
  { t: "Leave the anger here.", g: ["weekend", "evening"] },
  { t: "Progress is your new obsession.", g: ["weekend", "generic"] },
  // ——— morning ———
  { t: "Today is another opportunity to become stronger.", g: ["morning"] },
  { t: "Lead with purpose, not emotion.", g: ["morning"] },
  { t: "Protect your peace before anything else.", g: ["morning", "generic"] },
  { t: "Your future isn't waiting on anyone.", g: ["morning"] },
  { t: "Show up for yourself first.", g: ["morning"] },
  { t: "You survived yesterday. Build today.", g: ["morning"] },
  { t: "One good decision at a time.", g: ["morning", "generic"] },
  { t: "Your worth doesn't depend on who stayed.", g: ["morning", "generic"] },
  { t: "Walk in with confidence. You belong here.", g: ["morning"] },
  { t: "The goal today is progress, not perfection.", g: ["morning"] },
  { t: "Stand tall. You're building your next chapter.", g: ["morning", "generic"] },
  { t: "Set the intention. Days with a spine bend less.", g: ["morning"] },
  { t: "Today's job: be the man the briefing thinks you are.", s: "Be the man the briefing thinks you are.", g: ["morning"] },
  { t: "Walk in calm, brief, professional. Nothing to prove, nothing to fix.", s: "Calm, brief, professional. Nothing to prove.", g: ["morning"] },
  // ——— afternoon / work ———
  { t: "Stay present. Don't let your mind steal today.", g: ["afternoon"] },
  { t: "Focus on what you can control.", g: ["afternoon"] },
  { t: "Your career deserves your full attention.", g: ["afternoon"] },
  { t: "Don't trade today's opportunities for yesterday's memories.", s: "Don't trade today for yesterday's memories.", g: ["afternoon"] },
  { t: "Protect your energy.", g: ["afternoon"] },
  { t: "Respond. Don't react.", g: ["afternoon", "generic"] },
  { t: "You are more than this breakup.", g: ["afternoon"] },
  { t: "Discipline over emotion.", g: ["afternoon", "morning", "generic"] },
  { t: "One conversation doesn't define your day.", g: ["afternoon"] },
  { t: "The best revenge is becoming unrecognizable.", g: ["afternoon"] },
  { t: "Mid-day check: eaten? water? shoulders down? Fix what's fixable in five minutes.", s: "Eaten? Water? Shoulders down?", g: ["afternoon"] },
  { t: "The afternoon dip is chemistry, not truth. Eat something and reassess.", s: "The dip is chemistry, not truth. Eat first.", g: ["afternoon"] },
  // ——— evening ———
  { t: "The hardest part of today is almost over.", g: ["evening"] },
  { t: "You made it through another day.", g: ["evening"] },
  { t: "Your mind is tired. Don't believe every thought.", g: ["evening"] },
  { t: "Healing happens quietly.", g: ["evening"] },
  { t: "You don't need answers tonight.", g: ["evening"] },
  { t: "Peace is stronger than panic.", g: ["evening"] },
  { t: "Tomorrow is another chance.", g: ["evening"] },
  { t: "Decide now what tonight is for — before the night decides for you.", s: "Decide what tonight is for. Before it decides.", g: ["evening"] },
  { t: "Ordinary evenings are how nervous systems heal. Gym, dinner, a call, a shower.", s: "Ordinary evenings heal. Gym, dinner, a call.", g: ["evening"] },
  { t: "Close the day in the app tonight. The score is how you acted, and you acted.", s: "Close the day. The score is how you acted.", g: ["evening"] },
  // ——— night / before bed ———
  { t: "You are safe.", g: ["night"] },
  { t: "Nothing needs to be solved tonight.", g: ["night"] },
  { t: "Sleep heals what worry cannot.", g: ["night"] },
  { t: "Your nervous system deserves rest.", g: ["night"] },
  { t: "Tomorrow doesn't need tonight's anxiety.", g: ["night"] },
  { t: "Your future self is already proud of you.", g: ["night"] },
  { t: "Let today end.", g: ["night"] },
  { t: "You can miss someone without chasing them.", g: ["night", "generic"] },
  { t: "Release what you cannot control.", g: ["night"] },
  { t: "You don't have to carry this into tomorrow.", g: ["night"] },
  { t: "Nothing true gets decided after 10pm. Put the night to bed and check the math in the morning.", s: "Nothing true is decided after 10pm.", g: ["night"] },
  { t: "Night thoughts are loud because it's quiet — not because they're right.", s: "Night thoughts are loud, not right.", g: ["night"] },
  { t: "The phone stays down. Whatever it promises, it's lying about the price.", s: "The phone stays down. It lies about the price.", g: ["night"] },
  // ——— generic / anytime ———
  { t: "A bad day is not a bad trend.", g: ["generic"] },
  { t: "Feel everything. Act on almost none of it. That's the discipline.", s: "Feel everything. Act on almost none of it.", g: ["generic"] },
  { t: "The calm you're building can't be given to you — which means it can't be taken either.", s: "Calm you built can't be taken.", g: ["generic"] },
  { t: "Six weeks of evidence beats six years of promises. Keep collecting.", s: "Evidence beats promises. Keep collecting.", g: ["generic"] },
  { t: "You don't need closure to move forward.", g: ["generic"] },
  { t: "Heal for yourself, not for the hope that someone comes back.", s: "Heal for yourself. Not for a maybe.", g: ["generic"] },
  // ——— week-2 mantras (favorites multi-tagged for frequency) ———
  { t: "Respect the space.", g: ["generic", "morning", "risk"] },
  { t: "Build, don't chase.", g: ["generic", "morning", "afternoon"] },
  { t: "Today's win: no contact.", g: ["generic", "evening", "night"] },
  { t: "Work. Gym. Heal. Repeat.", g: ["generic", "morning", "weekend"] },
  { t: "Protect your peace.", g: ["generic", "afternoon", "evening"] },
  { t: "One day at a time.", g: ["generic", "morning", "night"] },
  { t: "Choose peace over pursuit.", g: ["generic"] },
  { t: "Stay busy. Stay grounded.", g: ["weekend", "afternoon"] },
  { t: "Win the day.", g: ["morning"] },
  { t: "Heal, don't react.", g: ["risk"] },
  { t: "Growth needs space.", g: ["generic"] },
  { t: "Focus on your mission.", g: ["afternoon"] },
  { t: "No chasing.", g: ["risk", "generic"] },
  { t: "Earn your future.", g: ["morning"] },
  { t: "Become the prize.", g: ["generic"] },
  { t: "Control what you can.", g: ["generic"] },
  { t: "Let actions speak.", g: ["generic"] },
  { t: "Strong men stay steady.", g: ["risk", "generic"] },
  { t: "Silence is strength.", g: ["risk", "night"] },
  { t: "Patience over panic.", g: ["risk"] },
  { t: "Peace is the goal.", g: ["evening", "generic"] },
  { t: "Choose yourself today.", g: ["morning"] },
  { t: "Stay present.", g: ["afternoon"] },
  { t: "Keep moving forward.", g: ["generic"] },
  { t: "Breathe. Don't react.", g: ["risk"] },
  { t: "Your future is waiting.", g: ["morning"] },
  { t: "Respect yourself first.", g: ["generic"] },
  { t: "Don't feed the spiral.", g: ["risk", "night"] },
  { t: "Self-respect over reassurance.", g: ["generic", "night"] }
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
  const dow = new Date(today + "T12:00:00Z").getUTCDay();
  const weekend = dow === 0 || dow === 6;
  return { heldRecent, slip, rec, steady, milestone, risk, weekend, hour };
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
  if (ctx.weekend) order.push("weekend");
  order.push(slot, "generic");
  // pool the top matching groups so context still leads but the rotation is rich
  const pool = [];
  for (const tag of order) {
    QUOTES.forEach(q => { if (q.g.indexOf(tag) >= 0 && pool.indexOf(q) < 0) pool.push(q); });
    if (pool.length >= 10) break;
  }
  const list = pool.length ? pool : QUOTES;
  const seed = parseInt((ctx.seedDate || "20260101").replace(/-/g, ""), 10) + h; // rotates EVERY hour
  const q = list[seed % list.length];
  return { text: q.t, short: q.s || q.t, tag: q.g[0] };
}

module.exports = { QUOTES, buildCtx, pickQuote };
