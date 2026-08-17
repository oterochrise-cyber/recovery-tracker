// Shared quote bank + context logic for push-cron and quote functions.
// t = full text · s = short (lock screen; omitted when t is already short)
// Tags: heldline, postslip, milestone, red, risk, weekend, morning, afternoon, evening, night, generic
const QUOTES = [
  { t: "The hardest part of trusting God isn't believing the promise. It's trusting His timing when it doesn't match my plan.", s: "Trusting His timing when it doesn't match my plan.", g: ["wk7", "morning", "evening", "generic"] },
  { t: "Consistency is how I act when I don't get the response I wanted.", g: ["wk7", "afternoon", "heldline", "generic"] },
  { t: "I can let a good moment be good without making it answer the future.", g: ["wk7", "evening", "afternoon", "generic"] },
  { t: "Yesterday was good. I do not need to know what happened after I left for it to remain good.", s: "Yesterday was good. I don't need to know what came after for it to stay good.", g: ["wk7", "morning", "risk", "generic"] },
  { t: "I can miss the life I expected and still build the life in front of me.", g: ["wk7", "evening", "night", "generic"] },
  { t: "What almost broke me can become wisdom I give to someone else.", g: ["wk7", "afternoon", "generic"] },
  { t: "I can care deeply without going into rescue mode.", g: ["wk7", "afternoon", "risk", "generic"] },
  { t: "Small consistent actions include knowing when to give space.", g: ["wk7", "afternoon", "heldline", "generic"] },
  { t: "The day I wanted didn't happen, but my life still did.", g: ["wk7", "evening", "night", "generic"] },
  { t: "Some seasons aren't meant to make sense while you're living them. Trust that God is working in ways you can't yet see.", s: "Seasons don't have to make sense yet. God is working unseen.", g: ["wk6", "morning", "evening", "night", "generic"] },
  { t: "The peace came before the answer.", g: ["wk6", "wk7", "morning", "afternoon", "evening", "night", "generic"] },
  { t: "Surrender did not close my heart; it released my grip.", g: ["wk6", "wk7", "morning", "evening", "generic"] },
  { t: "I can keep my heart open without keeping my hands on the outcome.", s: "Heart open. Hands off the outcome.", g: ["wk6", "wk7", "morning", "afternoon", "evening", "generic"] },
  { t: "I can grieve the moment without judging the whole story.", g: ["wk6", "afternoon", "evening", "generic"] },
  { t: "A longer timeline is not the same as a lost future.", g: ["wk6", "morning", "evening", "night", "generic"] },
  { t: "The day can hurt without being a bad day.", g: ["wk6", "wk7", "evening", "night", "generic"] },
  { t: "Grief and peace can exist in the same body.", g: ["wk6", "wk7", "evening", "generic"] },
  { t: "This is a wave, not a verdict.", g: ["wk6", "wk7", "morning", "red", "risk", "postslip", "generic"] },
  { t: "My nervous system can be loud without being right.", g: ["wk6", "wk7", "morning", "afternoon", "red", "risk", "generic"] },
  { t: "A missing reassurance is not negative information.", g: ["wk6", "wk7", "afternoon", "risk", "heldline", "generic"] },
  { t: "Peace can return before closeness does.", g: ["wk6", "afternoon", "evening", "generic"] },
  { t: "Repair can begin before it feels warm.", g: ["wk6", "afternoon", "evening", "generic"] },
  { t: "I said what was mine to say. Now I can let it land.", g: ["wk6", "evening", "night", "heldline", "generic"] },
  { t: "I can miss her without losing myself.", g: ["wk6", "wk7", "evening", "night", "generic"] },
  { t: "Even while I hurt, I still have something valuable to give.", g: ["wk6", "wk7", "morning", "afternoon", "generic"] },
  // ——— week-5 pack (Aug 3): surrender & steadiness — hope without ownership of the ending ———
  { t: "The pain came back. I did not go backward.", g: ["wk6", "wk7", "wk5", "postslip", "morning", "milestone", "generic"] },
  { t: "Healing is not feeling less. It is responding differently.", g: ["wk6", "wk7", "wk5", "morning", "evening", "milestone", "generic"] },
  { t: "I saw her, felt everything, and kept walking.", g: ["wk5", "heldline", "milestone"] },
  { t: "I am not waiting to feel better before I live better.", g: ["wk6", "wk7", "wk5", "morning", "afternoon", "generic"] },
  { t: "I no longer confuse not being alone with being at peace.", g: ["wk5", "evening", "night", "generic"] },
  { t: "Hope can stay. Chasing cannot.", g: ["wk5", "night", "evening", "risk", "generic"] },
  { t: "Don't rush to label a season a failure just because God hasn't revealed its purpose yet.", s: "Don't call it failure before God reveals its purpose.", g: ["wk5", "evening", "red", "generic"] },
  { t: "My uncertainty does not threaten God's certainty.", g: ["wk5", "afternoon", "risk", "red", "generic"] },
  { t: "God's silence is not permission to write the answer for Him.", g: ["wk5", "night", "risk", "generic"] },
  { t: "Surrender is not losing hope. It is releasing ownership of the ending.", s: "Surrender isn't losing hope. It's releasing the ending.", g: ["wk5", "night", "evening", "generic"] },
  { t: "I returned to the places that hurt and refused to let them own me.", s: "I went back to the places that hurt. They don't own me.", g: ["wk5", "morning", "milestone", "generic"] },
  { t: "Chemistry showed me what I wanted. Conflict showed me what I need.", s: "Chemistry showed what I wanted. Conflict showed what I need.", g: ["wk5", "evening", "generic"] },
  { t: "I can still love her. I will not lose myself to prove it.", g: ["wk5", "heldline", "evening"] },
  { t: "I can grieve what I lost without returning to what made me small.", g: ["wk5", "evening", "generic"] },
  { t: "This week proved I can be in pain without becoming powerless.", g: ["wk5", "milestone", "evening"] },
  { t: "Faith is not knowing the ending. It is trusting God without one.", g: ["wk5", "night", "generic"] },
  { t: "I do not need to know what God is doing to trust that He is working.", s: "I don't need to know what God is doing to trust He's working.", g: ["wk6", "wk5", "morning", "night", "generic"] },
  { t: "I may not know what comes next, but God is not confused.", g: ["wk5", "afternoon", "red", "risk"] },
  { t: "I asked God for His will—not His agreement with mine.", g: ["wk6", "wk7", "wk5", "morning", "night", "generic"] },
  { t: "I cannot hear God clearly while demanding that He follow my script.", s: "I can't hear God while demanding He follow my script.", g: ["wk5", "night", "generic"] },
  { t: "I asked God for clarity; now I must be willing to hear an answer I did not write.", s: "I asked for clarity. I must accept an answer I didn't write.", g: ["wk5", "evening", "night", "generic"] },
  { t: "I can believe God is working without deciding what His work must produce.", s: "I can trust God is working without deciding what it produces.", g: ["wk5", "evening", "generic"] },
  { t: "I can want one outcome and still trust God with another.", g: ["wk6", "wk7", "wk5", "morning", "evening", "generic"] },
  { t: "Trust becomes real when certainty is no longer available.", g: ["wk5", "afternoon", "risk", "red"] },
  { t: "I will not call this season wasted while God is still using it.", g: ["wk5", "morning", "red", "generic"] },
  { t: "What broke my plan may still be building my purpose.", g: ["wk6", "wk7", "wk5", "morning", "generic"] },
  { t: "I will not judge the chapter before God reveals the fruit.", g: ["wk5", "evening", "generic"] },
  { t: "Sometimes faith gives me the courage to go. Sometimes grace gives me the strength to stay.", s: "Faith gives courage to go. Grace gives strength to stay.", g: ["wk5", "evening", "generic"] },
  { t: "Staying today does not mean staying forever; it means refusing to let pain make the decision.", s: "Staying today isn't forever. It's not letting pain decide.", g: ["wk6", "wk5", "morning", "red"] },
  { t: "I can hold hope without turning it into a prophecy.", g: ["wk5", "evening", "night", "risk"] },
  { t: "I do not have to kill hope to stop controlling the outcome.", g: ["wk5", "night", "evening", "generic"] },
  { t: "If the door is meant to open, I will not have to destroy myself standing outside it.", s: "I won't destroy myself standing outside a door.", g: ["wk5", "night", "heldline"] },
  { t: "No version of this makes my growth wasted.", g: ["wk5", "morning", "milestone", "generic"] },
  { t: "What was real does not have to be permanent to have mattered.", g: ["wk5", "evening", "generic"] },
  { t: "I cannot love someone into emotional availability.", g: ["wk5", "evening", "heldline", "generic"] },
  { t: "I am not responsible for carrying both sides of a relationship.", g: ["wk5", "evening", "generic"] },
  { t: "An unanswered question is not an emergency.", g: ["wk5", "afternoon", "risk"] },
  { t: "Curiosity does not require action.", g: ["wk5", "afternoon", "risk", "heldline"] },
  { t: "A hard moment can revisit me without taking me back.", g: ["wk5", "postslip", "red", "generic"] },
  // ——— week-4 pack (Jul 28): Calm before certainty — catch the story early, soothe before seeking, hope without hold ———
  { t: "I can calm down before I know.", g: ["wk6", "wk7", "wk4","wk5", "morning", "afternoon", "evening", "night", "risk", "red", "heldline", "generic"] },
  { t: "Trust the evidence, not the adrenaline.", g: ["wk4","wk5", "afternoon", "evening", "risk", "red", "generic"] },
  { t: "My body is asking for safety, not information.", g: ["wk4","wk5", "afternoon", "night", "risk", "red", "generic"] },
  { t: "I am becoming the man I need and want to be.", g: ["wk4","wk5", "morning", "evening", "milestone", "generic"] },
  { t: "I can hold hope without putting my life on hold.", g: ["wk6", "wk7", "wk4","wk5", "morning", "evening", "generic"] },
  { t: "I do not need every detail to trust God.", g: ["wk4","wk5", "evening", "night", "risk", "generic"] },
  { t: "Today is mine before it belongs to any memory.", g: ["wk6", "wk7", "wk4","wk5", "morning"] },
  { t: "My first thought does not decide my day.", g: ["wk6", "wk7", "wk4","wk5", "morning", "red"] },
  { t: "Dreams are processing, not prophecy.", g: ["wk6", "wk7", "night", "wk4","wk5", "morning", "red"] },
  { t: "Good sleep still counts when the dreams are hard.", g: ["wk4", "morning"] },
  { t: "Start with God. Stay with today.", g: ["wk4", "morning", "generic"] },
  { t: "I wake up to build, not investigate.", g: ["wk6", "wk7", "wk4","wk5", "morning", "risk"] },
  { t: "One day at a time is enough.", g: ["wk4", "morning", "generic"] },
  { t: "No update is an emergency.", g: ["wk4","wk5", "afternoon", "risk"] },
  { t: "I can see what triggers me and stay with myself.", g: ["wk4", "afternoon", "risk"] },
  { t: "Another person's presence can spike me without controlling me.", g: ["wk4","wk5", "afternoon", "risk"] },
  { t: "A glance is not a message.", g: ["wk4","wk5", "afternoon", "risk"] },
  { t: "A hello can be only a hello.", g: ["wk4","wk5", "afternoon"] },
  { t: "I can let neutral be neutral.", g: ["wk4","wk5", "afternoon", "generic"] },
  { t: "I do not need to interpret someone else to regulate myself.", g: ["wk4","wk5", "afternoon", "risk"] },
  { t: "The office is shared space; my focus is still mine.", g: ["wk4","wk5", "afternoon"] },
  { t: "Another person's schedule is not my assignment.", g: ["wk4","wk5", "afternoon", "risk"] },
  { t: "Unusual does not mean dangerous.", g: ["wk4","wk5", "afternoon", "risk", "red"] },
  { t: "The feeling is real. The story is still unproven.", g: ["wk4","wk5", "afternoon", "risk", "red", "generic"] },
  { t: "Slow day. Small task. Steady mind.", g: ["wk4","wk5", "afternoon", "red"] },
  { t: "The workday is over; the investigation is over.", g: ["wk4","wk5", "evening", "risk"] },
  { t: "Caring is not checking.", g: ["wk4","wk5", "evening", "risk", "generic"] },
  { t: "Checking is not connection.", g: ["wk4","wk5", "evening", "night", "risk"] },
  { t: "Reassurance fades. Self-trust stays.", g: ["wk4","wk5", "evening", "generic"] },
  { t: "I can miss someone without making them tonight's task.", g: ["wk4", "evening", "night"] },
  { t: "My peace can return before the situation changes.", g: ["wk4", "evening", "generic"] },
  { t: "I can be proud of someone without abandoning myself.", g: ["wk4", "evening"] },
  { t: "Tonight is for living, not decoding.", g: ["wk4","wk5", "evening", "night"] },
  { t: "Tomorrow does not need tonight's analysis.", g: ["wk4","wk5", "night"] },
  { t: "No checking after dark.", g: ["wk4","wk5", "night", "risk"] },
  { t: "Rest is part of recovery.", g: ["wk4","wk5", "night", "red"] },
  { t: "My mind can revisit the past; I do not have to follow.", g: ["wk4", "night"] },
  { t: "God can work while I rest.", g: ["wk4","wk5", "night", "generic"] },
  { t: "I leave the outcome with God and keep becoming.", g: ["wk4","wk5", "night", "generic"] },
  { t: "This weekend is mine to live.", g: ["wk4","wk5", "weekend", "morning"] },
  { t: "The last hard weekend does not own this one.", g: ["wk4","wk5", "weekend", "morning"] },
  { t: "I can build new memories without erasing old ones.", g: ["wk4", "weekend", "afternoon"] },
  { t: "I am allowed to enjoy today without betraying what I felt.", g: ["wk4","wk5", "weekend", "afternoon"] },
  { t: "One good weekend proved I can build another.", g: ["wk4", "weekend", "morning", "milestone"] },
  { t: "I do not have to spend the weekend waiting.", g: ["wk4","wk5", "weekend", "evening"] },
  { t: "This is a trigger, not a trap.", g: ["wk4","wk5", "risk", "red"] },
  { t: "Pause before the story becomes a crisis.", g: ["wk4","wk5", "risk", "red"] },
  { t: "What am I telling myself? What do I need? How do I change course early?", g: ["wk4","wk5", "risk", "red"] },
  { t: "Nothing bad has been confirmed.", g: ["wk4","wk5", "risk", "red"] },
  { t: "My growth does not need an audience.", g: ["wk4","wk5", "heldline"] },
  { t: "Respecting space is strength, not surrender.", g: ["wk4","wk5", "heldline"] },
  { t: "I don't have to tell her I understand; I can show it.", g: ["wk4","wk5", "heldline"] },
  { t: "I can care without reaching.", g: ["wk4","wk5", "heldline"] },
  { t: "Every update I do not seek strengthens self-trust.", g: ["wk4","wk5", "heldline"] },
  { t: "One calm choice changes the pattern.", g: ["wk4","wk5", "heldline"] },
  { t: "The urge will peak and pass.", g: ["wk4","wk5", "heldline"] },
  { t: "One check is a slip, not a collapse.", g: ["wk4","wk5", "postslip"] },
  { t: "Stop here. The next choice still belongs to me.", g: ["wk4","wk5", "postslip"] },
  { t: "I do not punish myself; I change course.", g: ["wk4","wk5", "postslip"] },
  { t: "Progress resumes with the next action.", g: ["wk4","wk5", "postslip"] },
  { t: "Recovery is not never getting triggered; it is returning sooner.", g: ["wk4","wk5", "milestone"] },
  { t: "I calmed down before reassurance arrived.", g: ["wk4","wk5", "milestone", "heldline"] },
  { t: "My nervous system can learn.", g: ["wk4","wk5", "milestone", "red"] },
  { t: "I can be triggered and still have a great day.", g: ["wk4","wk5", "milestone", "postslip"] },
  { t: "I do not need to feel perfect to perform.", g: ["wk4","wk5", "milestone", "red"] },
  { t: "One good weekend changed what I believed was possible.", g: ["wk4", "milestone", "weekend"] },
  { t: "This is what becoming looks like.", g: ["wk4","wk5", "milestone"] },
  { t: "My relationship with God is between me and God.", g: ["wk4","wk5", "evening", "generic"] },
  { t: "Don't expect to hear God while keeping my Bible closed.", g: ["wk4", "night", "morning"] },
  { t: "Nothing in life that matters happens in a hurry, so why assume we can hear God's voice in a hurry?", s: "Nothing that matters happens in a hurry.", g: ["wk4","wk5", "evening", "generic"] },
  { t: "I do not have to force every door.", g: ["wk4","wk5", "afternoon", "night", "generic"] },
  { t: "I keep walking. God handles the timing.", g: ["wk4","wk5", "morning", "evening", "generic"] },
  // ——— week-3 pack v2 (Jul 20, 78 quotes) — slot-tagged so time of day leads; weekend lines wait for weekends ———
  { t: "I am becoming someone pain cannot control.", g: ["wk3", "morning", "milestone", "heldline", "generic"] },
  { t: "My character is built by how I act while I'm hurting.", g: ["wk6", "wk7", "wk3", "wk4","wk5", "morning", "afternoon", "risk", "heldline", "postslip", "generic"] },
  { t: "I refuse to let one chapter define my life.", g: ["wk3", "evening", "postslip", "generic"] },
  { t: "My future is bigger than my current pain.", g: ["wk3", "evening", "red", "generic"] },
  { t: "I will become someone this pain was worth creating.", g: ["wk3", "night", "milestone", "generic"] },
  { t: "Feel everything. Chase nothing.", g: ["wk3", "wk4","wk5", "evening", "night", "risk", "generic"] },
  { t: "Peace is built, not found.", g: ["wk3", "wk4", "morning", "generic"] },
  { t: "The strongest move today is self-control.", g: ["wk3", "wk4", "morning", "risk"] },
  { t: "I don't need answers to keep moving.", g: ["wk3", "wk4","wk5", "morning", "afternoon", "risk", "postslip", "generic"] },
  { t: "My peace is no longer dependent on another person.", g: ["wk3", "evening", "milestone", "generic"] },
  { t: "Uncertainty is uncomfortable, not dangerous.", g: ["wk3", "afternoon", "risk", "red", "generic"] },
  { t: "I don't have to solve today to survive today.", g: ["wk3", "wk4", "morning", "red", "risk"] },
  { t: "My mind wants certainty. My job is to stay steady.", g: ["wk3", "afternoon", "risk"] },
  { t: "Not knowing is no longer an emergency.", g: ["wk3", "afternoon", "risk", "red"] },
  { t: "I choose progress over certainty.", g: ["wk3", "wk4", "morning", "generic"] },
  { t: "Every urge I don't act on is a victory.", g: ["wk3", "wk4", "afternoon", "heldline", "risk"] },
  { t: "My emotions are real. My actions are my choice.", g: ["wk3", "wk4", "afternoon", "risk", "postslip"] },
  { t: "Discipline is remembering who I want to become.", g: ["wk3", "morning", "risk"] },
  { t: "Temporary emotion. Permanent character.", g: ["wk3", "evening", "risk"] },
  { t: "I don't negotiate with emotional impulses.", g: ["wk3", "night", "risk", "weekend"] },
  { t: "Love doesn't require chasing.", g: ["wk3", "night", "risk", "weekend"] },
  { t: "The right people don't require convincing.", g: ["wk3", "evening", "generic"] },
  { t: "If it's meant for me, I won't have to abandon myself to keep it.", g: ["wk3", "night", "generic"] },
  { t: "Closure begins when I stop demanding it from someone else.", g: ["wk3", "night", "postslip", "generic"] },
  { t: "I release what I cannot control.", g: ["wk3", "night", "weekend", "generic"] },
  { t: "One hard day is not a broken life.", g: ["wk3", "evening", "postslip", "red"] },
  { t: "Recovery is measured in trends, not moments.", g: ["wk3", "wk4","wk5", "evening", "postslip", "milestone"] },
  { t: "Today's goal is simple: leave stronger than I woke up.", g: ["wk3", "morning"] },
  { t: "Small wins compound into a new life.", g: ["wk3", "evening", "milestone"] },
  { t: "Consistency will accomplish what emotion never could.", g: ["wk3", "morning", "generic"] },
  { t: "I can carry uncertainty without letting it carry me.", g: ["wk3", "wk4", "afternoon", "evening", "risk", "red", "generic"] },
  { t: "Not every question deserves an immediate answer.", g: ["wk3", "afternoon", "risk"] },
  { t: "The future will reveal itself without my forcing it.", g: ["wk3", "wk4", "night", "generic"] },
  { t: "Peace begins where certainty ends.", g: ["wk3", "evening", "risk"] },
  { t: "I don't need to know what's next to take the next step.", g: ["wk3", "morning", "risk", "generic"] },
  { t: "Some chapters are meant to be lived, not solved.", g: ["wk3", "night", "generic"] },
  { t: "Every moment of restraint strengthens the man I'm becoming.", g: ["wk3", "wk4","wk5", "evening", "night", "heldline", "risk", "generic"] },
  { t: "Calm is my advantage.", g: ["wk3", "wk4","wk5", "morning", "afternoon", "risk", "red", "generic"] },
  { t: "I don't chase. I choose.", g: ["wk3", "night", "risk", "weekend"] },
  { t: "Today's discipline becomes tomorrow's confidence.", g: ["wk3", "morning", "generic"] },
  { t: "My emotions deserve respect, not obedience.", g: ["wk3", "afternoon", "risk", "postslip"] },
  { t: "I lead my emotions—they don't lead me.", g: ["wk3", "afternoon", "risk"] },
  { t: "Healing isn't forgetting. It's hurting less each time.", g: ["wk3", "evening", "postslip", "generic"] },
  { t: "I'm allowed to miss someone without needing them back.", g: ["wk3", "evening", "risk", "generic"] },
  { t: "My heart can ache while my life still moves forward.", g: ["wk3", "evening", "generic"] },
  { t: "Pain is part of my story, not my identity.", g: ["wk3", "evening", "red", "generic"] },
  { t: "I'm rebuilding, even on the days I don't feel it.", g: ["wk3", "morning", "red", "postslip"] },
  { t: "The life I'm creating is worth the discomfort of today.", g: ["wk3", "morning", "generic"] },
  { t: "I was whole before this. I'll be whole after it.", g: ["wk3", "wk4","wk5", "morning", "evening", "postslip", "red", "generic"] },
  { t: "No one else's decision determines my value.", g: ["wk3", "afternoon", "risk", "generic"] },
  { t: "I don't need to prove my worth to anyone.", g: ["wk3", "afternoon", "generic"] },
  { t: "I trust the man I'm becoming.", g: ["wk3", "wk4", "morning", "milestone", "generic"] },
  { t: "The right people recognize my value without persuasion.", g: ["wk3", "evening", "night", "risk", "generic"] },
  { t: "I never have to beg for what is meant for me.", g: ["wk3", "night", "risk", "weekend"] },
  { t: "Love given freely never needs to be chased.", g: ["wk3", "night", "weekend", "generic"] },
  { t: "I release what I cannot control and invest in what I can.", g: ["wk6", "wk7", "wk3", "morning", "generic"] },
  { t: "The past has a voice, not a vote.", g: ["wk3", "wk4", "night", "postslip", "generic"] },
  { t: "I stop carrying what no longer carries me.", g: ["wk3", "evening", "generic"] },
  { t: "Closure is something I build, not something I'm given.", g: ["wk3", "night", "postslip", "generic"] },
  { t: "Be the man others find steady in chaos.", g: ["wk3", "afternoon", "risk"] },
  { t: "My response is my reputation.", g: ["wk3", "wk4", "afternoon", "risk"] },
  { t: "Pressure reveals character.", g: ["wk3", "afternoon", "risk", "red"] },
  { t: "Lead yourself first.", g: ["wk3", "morning", "generic"] },
  { t: "Strong leaders stay calm when emotions run high.", g: ["wk3", "afternoon", "risk"] },
  { t: "Today's decisions become tomorrow's legacy.", g: ["wk3", "morning", "night", "generic"] },
  { t: "Control the controllable. Accept the rest.", g: ["wk3", "wk4","wk5", "morning", "afternoon", "risk", "red", "generic"] },
  { t: "Facts over fear.", g: ["wk3", "wk4", "morning", "risk", "red"] },
  { t: "Respond with reason, not reaction.", g: ["wk3", "afternoon", "risk"] },
  { t: "The obstacle is the training.", g: ["wk3", "morning", "red", "generic"] },
  { t: "Nothing outside me owns my peace unless I surrender it.", g: ["wk3", "night", "risk", "generic"] },
  { t: "Strength is quiet.", g: ["wk3", "evening", "generic"] },
  { t: "One year from now, I'll thank myself for today's restraint.", g: ["wk3", "night", "heldline", "generic"] },
  { t: "Every disciplined day is a vote for my future.", g: ["wk3", "morning", "milestone", "generic"] },
  { t: "I'm building a life that doesn't depend on one person.", g: ["wk3", "evening", "milestone", "generic"] },
  { t: "The future I'm working toward deserves today's sacrifice.", g: ["wk3", "morning", "night", "risk", "generic"] },
  { t: "This season is preparing me for something greater.", g: ["wk3", "evening", "red", "generic"] },
  { t: "Keep becoming the man your future family deserves.", g: ["wk3", "night", "weekend", "generic"] },
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
  { t: "Show up for yourself first.", g: ["morning"] },
  { t: "You survived yesterday. Build today.", g: ["morning"] },
  { t: "One good decision at a time.", g: ["morning", "generic"] },
  { t: "Your worth doesn't depend on who stayed.", g: ["morning", "generic"] },
  { t: "Walk in with confidence. You belong here.", g: ["morning"] },
  { t: "The goal today is progress, not perfection.", g: ["morning"] },
  { t: "Stand tall. You're building your next chapter.", g: ["morning", "generic"] },
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
  for (let i = 0; i < 200; i++) { // was 60 — capped the widget streak count and killed the 90/180 milestones
    const d = iso(new Date(new Date(today + "T12:00:00Z").getTime() - i * 864e5));
    const hasData = (D.morning || {})[d] || (D.nightly || {})[d] || on(d).length || (D.goals || {})[d];
    if (!hasData) { if (i === 0) continue; else break; }
    if (on(d).some(e => e.contacted_val && e.contacted_val !== "No" && e.contact_nature === "Impulsive")) break;
    steady++;
  }
  const milestone = [3, 7, 14, 21, 28, 42, 56, 90, 180].indexOf(steady) >= 0;
  const risk = Math.max(0, ...yE.map(e => num(e.urge_contact))) >= 6;
  const dow = new Date(today + "T12:00:00Z").getUTCDay();
  const weekend = dow === 0 || dow === 6;
  return { heldRecent, slip, rec, steady, milestone, risk, weekend, hour };
}

const START_DATE = "2026-07-01";
function packFor(today) { // weekly packs exist for wks 3–5; any other week rotates the full bank
  if (!today) return null;
  const w = Math.floor((Date.parse(today + "T12:00:00Z") - Date.parse(START_DATE + "T12:00:00Z")) / 864e5 / 7) + 1;
  return w === 3 ? "wk3" : w === 4 ? "wk4" : w === 5 ? "wk5" : w === 6 ? "wk6" : (w === 7 || w === 8) ? "wk7" : null;
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
  const PACK_ONLY = packFor(ctx.seedDate);
  let bank = PACK_ONLY ? QUOTES.filter(q => q.g.indexOf(PACK_ONLY) >= 0) : QUOTES;
  if (!bank.length) bank = QUOTES;
  if (!ctx.weekend) bank = bank.filter(q => q.g.indexOf("weekend") < 0); // weekend lines wait for the weekend
  // active-context lines (held urge, slip, milestone, red, risk) bypass the time-of-day gate,
  // so trigger-only lines appear ONLY when their trigger is live; otherwise the slot leads
  const ctxTags = order.slice(0, Math.max(0, order.length - 2));
  const ctxBank = bank.filter(q => ctxTags.some(t => q.g.indexOf(t) >= 0));
  const slotBank = bank.filter(q => q.g.indexOf(slot) >= 0);
  let B = ctxBank.concat(slotBank.filter(q => ctxBank.indexOf(q) < 0));
  if (!B.length) B = bank;
  const pool = [];
  for (const tag of order) {
    B.forEach(q => { if (q.g.indexOf(tag) >= 0 && pool.indexOf(q) < 0) pool.push(q); });
    if (pool.length >= 14) break;
  }
  let list = pool.length ? pool : B;
  list = list.concat(list.filter(q => q.w > 1)); // weighted lines (w:2) appear twice per cycle
  const half = h * 2 + ((ctx.minute || 0) >= 30 ? 1 : 0);
  const seed = parseInt((ctx.seedDate || "20260101").replace(/-/g, ""), 10) * 48 + half; // rotates every 30 minutes
  const q = list[seed % list.length];
  return { text: q.t, short: q.s || q.t, tag: q.g[0] };
}

module.exports = { QUOTES, buildCtx, pickQuote };
