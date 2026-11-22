import type { Signature } from "@/lib/local-data";
import { CountUp } from "./ExtrasFx";

/** The state's own figures (snow, storm reports, Lake Mead) on a full-width band in its colours. */
export default function SignatureStrip({ sig, ink, acc, head }: { sig: Signature; ink: string; acc: string; head: string }) {
  return (
    <section className="x-sig pc-in pc-up relative mt-12 overflow-hidden py-10 text-white" style={{ ["--x-ink" as string]: ink, ["--x-acc" as string]: acc } as React.CSSProperties}>
      <div className="relative mx-auto max-w-[1340px] px-4">
        <p className="text-[12px] font-bold uppercase tracking-[.22em]" style={{ color: acc }}>{sig.kicker}</p>
        <h2 className={`${head} mt-1 text-[32px] font-bold leading-tight md:text-[42px]`}>{sig.title}</h2>
        <div className="pc-in pc-stagger mt-6 grid grid-cols-2 gap-4 md:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]" style={{ ["--n" as string]: sig.items.length } as React.CSSProperties}>
          {sig.items.map((it) => {
            const num = parseFloat(it.value);
            const unit = it.value.replace(/^-?[\d.,]+/, "");
            return (
              <div key={it.label} className="x-tilt rounded-lg border border-white/15 bg-white/[.07] p-4 backdrop-blur-sm">
                <p className="text-[13px] font-semibold text-white/80">{it.label}</p>
                <p className={`${head} mt-1 text-[38px] font-bold leading-none`}>{Number.isFinite(num) && /^-?[\d.]+/.test(it.value) ? <><CountUp to={num} decimals={(it.value.split(" ")[0].split(".")[1] || "").replace(/\D/g, "").length} />{unit}</> : it.value}</p>
                {it.sub && <p className="mt-1 text-[12.5px] text-white/65">{it.sub}</p>}
              </div>
            );
          })}
        </div>
        {sig.note && <p className="mt-4 text-[14px] text-white/85">{sig.note}</p>}
        <p className="mt-2 text-[11px] text-white/50">{sig.link ? <a href={sig.link} target="_blank" rel="noopener" className="hover:underline">{sig.source}</a> : sig.source}</p>
      </div>
    </section>
  );
}
