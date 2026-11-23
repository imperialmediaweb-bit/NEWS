import type { SiteConfig } from "@/config/site-config";
import { mockupOf } from "@/config/design-cfg";
import { artOf } from "@/config/state-art";

/**
 * Thin ribbon under each newspaper's masthead on article pages: the state's
 * own illustration (landscape, ridge, dusk sky or county scene) washed in the
 * paper's ink colour, with the section breadcrumb. Papers without art get the
 * ink colour with a faint diagonal rule pattern.
 */
export default function StateBand({ site, categorySlug }: { site: SiteConfig; categorySlug: string }) {
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d";
  const acc = m?.acc || site.accent || "#b91c1c";
  const a = artOf(site.slug);
  const art = a.landscape || a.masthead || a.sky || a.county;
  const section = categorySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="state-band relative h-[58px] overflow-hidden text-white md:h-[86px]" style={{ background: ink }}>
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={art} alt="" aria-hidden className="sb-drift absolute inset-0 h-full w-full object-cover opacity-60" />
      ) : (
        <div aria-hidden className="absolute inset-0 opacity-[.12]" style={{ backgroundImage: "repeating-linear-gradient(135deg,#fff 0 1px,transparent 1px 14px)" }} />
      )}
      <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${ink} 18%, ${ink}cc 45%, transparent)` }} />
      <nav aria-label="Breadcrumb" className="relative mx-auto flex h-full max-w-[1200px] items-center gap-3 px-4 text-[12px] font-bold uppercase tracking-[.22em] md:text-[13px]">
        <span className="h-[3px] w-8 md:w-12" style={{ background: acc }} />
        <a href="/" className="text-white/80 hover:text-white">{site.state}</a>
        <span className="text-white/50">/</span>
        <a href={`/${categorySlug}`} className="text-white hover:underline">{section}</a>
      </nav>
      <style>{`@keyframes sbDrift{from{transform:scale(1.08) translateX(0)}to{transform:scale(1.08) translateX(-3%)}}.sb-drift{animation:sbDrift 24s ease-in-out infinite alternate}@media (prefers-reduced-motion:reduce){.sb-drift{animation:none}}`}</style>
    </div>
  );
}
