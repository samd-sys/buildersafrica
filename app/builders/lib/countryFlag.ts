// Maps common country names to ISO 3166-1 alpha-2 codes, then converts
// that code to its flag emoji. Covers African countries plus other
// common ones; falls back to a globe icon for anything unrecognized
// so a typo or unusual entry never breaks the UI.
const COUNTRY_CODES: Record<string, string> = {
  algeria: "DZ", angola: "AO", benin: "BJ", botswana: "BW",
  "burkina faso": "BF", burundi: "BI", cameroon: "CM", "cape verde": "CV",
  "central african republic": "CF", chad: "TD", comoros: "KM",
  congo: "CG", "dr congo": "CD", "democratic republic of the congo": "CD",
  djibouti: "DJ", egypt: "EG", "equatorial guinea": "GQ", eritrea: "ER",
  eswatini: "SZ", ethiopia: "ET", gabon: "GA", gambia: "GM", ghana: "GH",
  guinea: "GN", "guinea-bissau": "GW", "ivory coast": "CI",
  "cote d'ivoire": "CI", kenya: "KE", lesotho: "LS", liberia: "LR",
  libya: "LY", madagascar: "MG", malawi: "MW", mali: "ML",
  mauritania: "MR", mauritius: "MU", morocco: "MA", mozambique: "MZ",
  namibia: "NA", niger: "NE", nigeria: "NG", rwanda: "RW",
  "sao tome and principe": "ST", senegal: "SN", seychelles: "SC",
  "sierra leone": "SL", somalia: "SO", "south africa": "ZA",
  "south sudan": "SS", sudan: "SD", tanzania: "TZ", togo: "TG",
  tunisia: "TN", uganda: "UG", zambia: "ZM", zimbabwe: "ZW",
  "united states": "US", usa: "US", "united kingdom": "GB", uk: "GB",
  canada: "CA", germany: "DE", france: "FR", india: "IN", china: "CN",
  brazil: "BR", australia: "AU", "united arab emirates": "AE",
};

export function countryToFlag(country?: string | null): string {
  if (!country) return "🌍";
  const code = COUNTRY_CODES[country.trim().toLowerCase()];
  if (!code) return "🌍";

  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}