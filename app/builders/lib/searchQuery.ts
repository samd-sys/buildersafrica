const KNOWN_COUNTRIES = [
  "kenya", "nigeria", "ghana", "south africa", "egypt", "morocco",
  "uganda", "tanzania", "rwanda", "ethiopia", "senegal", "zambia",
  "zimbabwe", "africa",
];

const STOPWORDS = new Set([
  "show", "me", "find", "developers", "developer", "with", "in",
  "designers", "designer", "experience", "and", "who", "are", "the",
  "a", "an", "of", "for", "based",
]);

export type ParsedQuery = {
  country: string | null;
  keywords: string[];
};

/**
 * Parses free-text queries like "Show me frontend developers in Kenya"
 * into a country filter + a list of skill/keyword terms to match
 * against a builder's skills, title, and bio.
 *
 * This is a simple heuristic parser so search works end-to-end today.
 * To upgrade to true AI-powered search later, replace the body of
 * this function with a call to an LLM endpoint that returns the same
 * { country, keywords } shape — nothing else in the search flow needs
 * to change.
 */
export function parseSearchQuery(raw: string): ParsedQuery {
  const lower = raw.toLowerCase().trim();
  if (!lower) return { country: null, keywords: [] };

  let country: string | null = null;
  for (const c of KNOWN_COUNTRIES) {
    if (lower.includes(c)) {
      country = c;
      break;
    }
  }

  const keywords = lower
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !STOPWORDS.has(word))
    .filter((word) => !(country && country.includes(word)));

  return { country, keywords };
}