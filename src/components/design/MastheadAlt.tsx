/**
 * The two masthead arrangements the 50 mockups use, for families whose own
 * masthead is the other one: logo at the left with the menu on the same line,
 * or logo centred with the menu underneath (with the mockup's artwork behind
 * it when the state has some). Colours come from the family's CSS variables.
 */
const Search = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg>
);

export function InlineMast({ logo, name, nav, active, font, ink }: { logo: string; name: string; nav: Array<[string, string]>; active?: string; font: string; ink: string }) {
  return (
    <div className="mx-auto hidden max-w-[1340px] items-center gap-8 px-4 py-2 md:flex">
      <a href="/" aria-label={name} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} width={300} height={150} className="h-[112px] w-auto" />
      </a>
      <nav className="ml-auto">
        <ul className={`${font} flex items-center gap-7 whitespace-nowrap text-[19px] font-semibold`} style={{ color: ink }}>
          {nav.map(([l, h]) => {
            const on = active && h === `/${active}`;
            return <li key={l}><a href={h} className={`pc-navlink ${on ? "is-on" : ""}`} aria-current={on ? "page" : undefined}>{l}</a></li>;
          })}
          <li><a href="/search" aria-label="Search" className="hover:opacity-70"><Search /></a></li>
        </ul>
      </nav>
    </div>
  );
}

export function CenteredMast({ logo, name, nav, active, font, ink, art, compact = false }: { logo: string; name: string; nav: Array<[string, string]>; active?: string; font: string; ink: string; art?: string; compact?: boolean }) {
  return (
    <div className="hidden md:block">
      <div className="relative overflow-hidden">
        {art && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={art} alt="" width={1536} height={460} className="absolute inset-0 h-full w-full object-cover opacity-90 mix-blend-multiply" />
        )}
        <div className={`relative mx-auto max-w-[1340px] px-4 text-center ${compact ? "py-1" : "py-4"}`}>
          <a href="/" aria-label={name} className="inline-block rounded-xl px-6" style={art ? { background: "radial-gradient(closest-side, rgba(255,255,255,.85), rgba(255,255,255,0))" } : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={name} width={360} height={180} className={`mx-auto w-auto ${compact ? "h-[100px]" : "h-[150px]"}`} />
          </a>
        </div>
      </div>
      <nav className="relative mx-auto max-w-[1340px] border-y px-4" style={{ borderColor: `${ink}33` }}>
        <ul className={`${font} flex items-center justify-center gap-10 py-2.5 text-[18px] font-bold`} style={{ color: ink }}>
          {nav.map(([l, h]) => {
            const on = active && h === `/${active}`;
            return <li key={l}><a href={h} className={`pc-navlink ${on ? "is-on" : ""}`} aria-current={on ? "page" : undefined}>{l}</a></li>;
          })}
        </ul>
        <a href="/search" aria-label="Search" className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: ink }}><Search /></a>
      </nav>
    </div>
  );
}
