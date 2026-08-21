/**
 * The 32 Qualities.
 *
 * Every player card carries one quality, drawn from this set. It's the collectable
 * element of the card — "which one did you get?" — and it's what makes two cards with
 * the same avatar still feel different.
 *
 * TWO DELIBERATE DESIGN CHOICES:
 *
 * 1. ASSIGNMENT IS DETERMINISTIC, NOT RE-ROLLED. The quality is derived from a hash of
 *    the player's id, so a player gets the same quality every time their card renders —
 *    on the site, in their email, on a printed card. A quality that changed on refresh
 *    would be worthless to collect and confusing to share.
 *
 * 2. EVERY QUALITY IS EQUALLY LIKELY. There are no rare or common tiers. Ranking Sat
 *    above Shukrana would be making a claim about which virtues matter more, which is
 *    not ours to make — and a child drawing a "common" virtue shouldn't feel short-changed.
 *
 * Because the quality is drawn rather than scored, nobody is being rated on their
 * character. That was the risk with numeric virtue stats; this design sidesteps it.
 */

export interface Quality {
  id: string;
  gurmukhi: string;
  /** Romanised Punjabi. */
  name: string;
  english: string;
  /** One line, written for a 12-year-old. Shown on the profile, not on the card face. */
  meaning: string;
}

export const QUALITIES: Quality[] = [
  { id: "sat",         gurmukhi: "ਸਤ",           name: "Sat",           english: "Truth",            meaning: "Living and speaking truthfully, even when it costs you." },
  { id: "santokh",     gurmukhi: "ਸੰਤੋਖ",        name: "Santokh",       english: "Contentment",      meaning: "Being at peace with what you have." },
  { id: "daya",        gurmukhi: "ਦਯਾ",          name: "Daya",          english: "Compassion",       meaning: "Feeling another person's difficulty as if it were your own." },
  { id: "dharam",      gurmukhi: "ਧਰਮ",          name: "Dharam",        english: "Righteousness",    meaning: "Doing what is right because it is right." },
  { id: "nimrata",     gurmukhi: "ਨਿਮਰਤਾ",       name: "Nimrata",       english: "Humility",         meaning: "Staying grounded, whether you win or lose." },
  { id: "pyaar",       gurmukhi: "ਪਿਆਰ",         name: "Pyaar",         english: "Love",             meaning: "Love without conditions attached to it." },
  { id: "sidak",       gurmukhi: "ਸਿਦਕ",         name: "Sidak",         english: "Faith",            meaning: "Holding firm when everything is testing you." },
  { id: "shanti",      gurmukhi: "ਸ਼ਾਂਤੀ",        name: "Shanti",        english: "Peace",            meaning: "A calm that doesn't depend on things going your way." },
  { id: "chardikala",  gurmukhi: "ਚੜ੍ਹਦੀ ਕਲਾ",   name: "Chardi Kala",   english: "Rising Spirits",   meaning: "Relentless optimism, in good times and bad." },
  { id: "seva",        gurmukhi: "ਸੇਵਾ",         name: "Seva",          english: "Selfless Service", meaning: "Serving others expecting nothing back." },
  { id: "simran",      gurmukhi: "ਸਿਮਰਨ",        name: "Simran",        english: "Remembrance",      meaning: "Keeping Waheguru in mind through everything you do." },
  { id: "nirbhau",     gurmukhi: "ਨਿਰਭਉ",        name: "Nirbhau",       english: "Fearless",         meaning: "Without fear of anyone or anything." },
  { id: "nirvair",     gurmukhi: "ਨਿਰਵੈਰ",       name: "Nirvair",       english: "Without Hatred",   meaning: "Carrying no enmity, even towards those against you." },
  { id: "santsipahi",  gurmukhi: "ਸੰਤ ਸਿਪਾਹੀ",   name: "Sant Sipahi",   english: "Saint-Soldier",    meaning: "The warrior spirit — gentle in peace, unbending in defence of others." },
  { id: "himmat",      gurmukhi: "ਹਿੰਮਤ",        name: "Himmat",        english: "Courage",          meaning: "Stepping forward when it would be easier not to." },
  { id: "sabar",       gurmukhi: "ਸਬਰ",          name: "Sabar",         english: "Patience",         meaning: "Waiting without complaint." },
  { id: "gyan",        gurmukhi: "ਗਿਆਨ",         name: "Gyan",          english: "Wisdom",           meaning: "Understanding, not just knowing." },
  { id: "vichar",      gurmukhi: "ਵਿਚਾਰ",        name: "Vichar",        english: "Reflection",       meaning: "Thinking deeply before acting." },
  { id: "sanjam",      gurmukhi: "ਸੰਜਮ",         name: "Sanjam",        english: "Self-Discipline",  meaning: "Control over your own habits and temper." },
  { id: "ekta",        gurmukhi: "ਏਕਤਾ",         name: "Ekta",          english: "Unity",            meaning: "Seeing one light in every person." },
  { id: "sarbat",      gurmukhi: "ਸਰਬੱਤ ਦਾ ਭਲਾ", name: "Sarbat da Bhala", english: "Welfare of All", meaning: "Wanting good for everyone, not just your own." },
  { id: "daan",        gurmukhi: "ਦਾਨ",          name: "Daan",          english: "Generosity",       meaning: "Giving freely, without keeping score." },
  { id: "insaaf",      gurmukhi: "ਇਨਸਾਫ਼",        name: "Insaaf",        english: "Justice",          meaning: "Standing up for fairness, especially for the weakest." },
  { id: "bharosa",     gurmukhi: "ਭਰੋਸਾ",        name: "Bharosa",       english: "Trust",            meaning: "Being someone others can rely on." },
  { id: "mithaas",     gurmukhi: "ਮਿਠਾਸ",        name: "Mithaas",       english: "Sweet Speech",     meaning: "Kindness in how you speak to people." },
  { id: "khima",       gurmukhi: "ਖਿਮਾ",         name: "Khima",         english: "Forgiveness",      meaning: "Letting go of a wrong done to you." },
  { id: "anakh",       gurmukhi: "ਅਣਖ",          name: "Anakh",         english: "Dignity",          meaning: "Self-respect that never tips into arrogance." },
  { id: "tiaag",       gurmukhi: "ਤਿਆਗ",         name: "Tiaag",         english: "Sacrifice",        meaning: "Giving something up for something greater." },
  { id: "shukrana",    gurmukhi: "ਸ਼ੁਕਰਾਨਾ",      name: "Shukrana",      english: "Gratitude",        meaning: "Thankfulness for what you've been given." },
  { id: "kirat",       gurmukhi: "ਕਿਰਤ",         name: "Kirat",         english: "Honest Work",      meaning: "Earning your way through honest effort." },
  { id: "vandchhakna", gurmukhi: "ਵੰਡ ਛਕਣਾ",     name: "Vand Chhakna",  english: "Sharing",          meaning: "Sharing what you have before you take your own." },
  { id: "dheeraj",     gurmukhi: "ਧੀਰਜ",         name: "Dheeraj",       english: "Perseverance",     meaning: "Carrying on when it stops being easy." },
];

/** Small stable string hash (FNV-1a). Same input always gives the same output. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * The quality for a player. Deterministic — the same seed always gives the same
 * quality, so a card never changes between the website, the email and the print.
 * Pass the player id (or their registration reference before an account exists).
 */
export function qualityFor(seed: string): Quality {
  return QUALITIES[hash(seed) % QUALITIES.length];
}

export function getQuality(id: string | null | undefined): Quality | undefined {
  return QUALITIES.find((q) => q.id === id);
}
