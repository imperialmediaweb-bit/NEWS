"use client";

import type { SiteConfig } from "@/config/site-config";
import { designFor, type DesignFamily } from "@/lib/design-nou";
import MobileMenu from "@/components/design/live/MobileMenu";
import { LiveTopBar, LiveCompactHeader, LiveFooter, liveVars } from "@/components/design/live/shared";
import { PeachTopBar, PeachHeader, PeachFooter, peachVars } from "@/components/design/peach/shared";
import { TabTopBar, TabHeader, TabFooter, tabVars } from "@/components/design/tabloid/shared";
import { MagTopBar, MagHeader, MagFooter, magVars } from "@/components/design/magazine/shared";
import { BsTopBar, BsHeader, BsFooter, bsVars } from "@/components/design/broadsheet/shared";
import { CoTopBar, CoHeader, CoFooter, coVars } from "@/components/design/coastal/shared";
import { DkTopBar, DkHeader, DkFooter, dkVars } from "@/components/design/dark/shared";
import { WsTopBar, WsHeader, WsFooter, wsVars } from "@/components/design/western/shared";
import { GzTopBar, GzHeader, GzFooter, gzVars } from "@/components/design/gazette/shared";

/**
 * The newspaper's own top bar, header and footer on every secondary page
 * (contact, policies, submit, guides, weather…), so each site looks like
 * itself everywhere, not only on its front page and articles.
 */
type Parts = { Top: React.ComponentType<{ site: SiteConfig }>; Head: React.ComponentType<{ site: SiteConfig }>; Foot: React.ComponentType<{ site: SiteConfig }>; vars: (s: SiteConfig) => React.CSSProperties; dark?: boolean };
const C = (H: React.ComponentType<{ site: SiteConfig; MobileMenu: React.ComponentType<{ nav: Array<[string, string]> }>; compact?: boolean }>) =>
  function Head({ site }: { site: SiteConfig }) { return <H site={site} MobileMenu={MobileMenu} compact />; };

const PARTS: Record<DesignFamily, Parts> = {
  live: { Top: LiveTopBar, Head: ({ site }) => <LiveCompactHeader site={site} MobileMenu={MobileMenu} />, Foot: LiveFooter, vars: liveVars },
  peach: { Top: PeachTopBar, Head: C(PeachHeader), Foot: PeachFooter, vars: peachVars as Parts["vars"] },
  tabloid: { Top: TabTopBar, Head: C(TabHeader), Foot: TabFooter, vars: tabVars as Parts["vars"] },
  magazine: { Top: MagTopBar, Head: C(MagHeader), Foot: MagFooter, vars: magVars as Parts["vars"] },
  broadsheet: { Top: BsTopBar, Head: C(BsHeader), Foot: BsFooter, vars: bsVars as Parts["vars"] },
  coastal: { Top: CoTopBar, Head: C(CoHeader), Foot: CoFooter, vars: coVars as Parts["vars"] },
  dark: { Top: DkTopBar, Head: C(DkHeader), Foot: DkFooter, vars: dkVars as Parts["vars"], dark: true },
  western: { Top: WsTopBar, Head: C(WsHeader), Foot: WsFooter, vars: wsVars as Parts["vars"] },
  gazette: { Top: GzTopBar, Head: C(GzHeader), Foot: GzFooter, vars: gzVars as Parts["vars"] },
};

const partsOf = (site: SiteConfig) => PARTS[designFor(site.slug) || "live"] || PARTS.live;

export function FamilyHeader({ site }: { site: SiteConfig }) {
  const P = partsOf(site);
  return (
    <div style={P.vars(site)} className={P.dark ? "bg-[var(--dk-bg)] text-[#e9ddd3]" : "bg-white text-[#1b2233]"}>
      <P.Top site={site} />
      <P.Head site={site} />
    </div>
  );
}

export function FamilyFooter({ site }: { site: SiteConfig }) {
  const P = partsOf(site);
  return (
    <div style={P.vars(site)}>
      <P.Foot site={site} />
    </div>
  );
}
