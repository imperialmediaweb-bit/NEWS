export interface SiteConfig {
  /** Unique slug used as identifier, e.g. "alaska-express" */
  slug: string;
  /** Full display name, e.g. "Alaska Express" */
  name: string;
  /** First part of name for logo (red box), e.g. "ALASKA" */
  logoFirst: string;
  /** Second part of name for logo (black box), e.g. "EXPRESS" */
  logoSecond: string;
  /** City name, e.g. "Anchorage" */
  city: string;
  /** State full name, e.g. "Alaska" */
  state: string;
  /** State abbreviation, e.g. "AK" */
  stateAbbr: string;
  /** Tagline displayed under the logo */
  tagline: string;
}
