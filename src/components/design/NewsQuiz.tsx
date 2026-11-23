"use client";

import { useState } from "react";

export type QuizQ = { headline: string; answer: string; choices: string[]; href: string; image: string | null };

export default function NewsQuiz({ questions, state, siteName, domain, ink, acc }: { questions: QuizQ[]; state: string; siteName: string; domain: string; ink: string; acc: string }) {
  const [picked, setPicked] = useState<Record<number, string>>({});
  const done = Object.keys(picked).length === questions.length;
  const score = questions.filter((q, i) => picked[i] === q.answer).length;
  const shareText = `I got ${score}/${questions.length} on the ${state} news quiz from ${siteName}. Can you beat me?`;
  const shareUrl = `https://${domain}/quiz`;
  return (
    <div className="mt-8 space-y-6">
      {questions.map((q, i) => {
        const p = picked[i];
        return (
          <section key={i} className="overflow-hidden bg-white shadow-[0_14px_40px_-24px_rgba(0,0,0,.5)]" style={{ borderTop: `5px solid ${acc}` }}>
            {q.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={q.image} alt="" className="h-44 w-full object-cover md:h-56" loading={i < 2 ? "eager" : "lazy"} />
            )}
            <div className="p-5 md:p-6">
              <p className="text-[12px] font-black uppercase tracking-[.18em]" style={{ color: acc }}>Question {i + 1} of {questions.length}</p>
              <h2 className="mt-2 text-[21px] font-extrabold leading-snug md:text-[25px]"><span className="inline-block min-w-[90px] border-b-4 px-1 text-center" style={{ borderColor: acc }}>{p ? q.answer : "?????"}</span>: {q.headline}</h2>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {q.choices.map((c) => {
                  const right = c === q.answer, mine = p === c;
                  const bg = !p ? "#fff" : right ? "#16a34a" : mine ? "#dc2626" : "#fff";
                  return (
                    <button key={c} type="button" disabled={!!p} onClick={() => setPicked((x) => ({ ...x, [i]: c }))}
                      className="border-2 px-3 py-3 text-left text-[16px] font-bold transition hover:-translate-y-0.5 disabled:hover:translate-y-0"
                      style={{ background: bg, color: p && (right || mine) ? "#fff" : ink, borderColor: p && (right || mine) ? bg : "#d6d9e0" }}>
                      {c}{p && right ? " ✓" : p && mine ? " ✗" : ""}
                    </button>
                  );
                })}
              </div>
              {p && <a href={q.href} className="mt-3 inline-block text-[15px] font-bold underline" style={{ color: acc }}>Read the story ›</a>}
            </div>
          </section>
        );
      })}
      {done && (
        <section className="p-7 text-center text-white" style={{ background: ink }}>
          <p className="text-[14px] font-bold uppercase tracking-[.2em] opacity-80">Your score</p>
          <p className="mt-1 text-[64px] font-black leading-none">{score}/{questions.length}</p>
          <p className="mt-2 text-[17px]">{score >= questions.length - 1 ? `You really know ${state}!` : score >= questions.length / 2 ? "Not bad at all." : `Time to read more ${siteName}!`}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a className="px-5 py-3 font-black" style={{ background: acc }} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">Share on Facebook</a>
            <a className="bg-white px-5 py-3 font-black" style={{ color: ink }} href={`https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">Post on X</a>
            <a className="border border-white/50 px-5 py-3 font-black" href={`sms:?&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}>Text a friend</a>
          </div>
          <p className="mt-4 text-[14px] opacity-75">A new quiz every week.</p>
        </section>
      )}
    </div>
  );
}
