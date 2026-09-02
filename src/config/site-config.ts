export interface SiteConfig {
  slug: string;
  domain: string;
  name: string;
  logoFirst: string;
  logoSecond: string;
  city: string;
  state: string;
  stateAbbr: string;
  tagline: string;
  gaMeasurementId?: string;
  /** State identity colour — drives the whole site theme via CSS vars. */
  accent: string;
  /** Darker shade of accent, used for hovers and active nav. */
  accentDark: string;
}
