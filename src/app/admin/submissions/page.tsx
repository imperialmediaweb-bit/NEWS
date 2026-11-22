import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { ensureSubmissionsTable, SUBMISSION_TYPES, type SubmissionType } from "@/lib/submissions";
import { insertFeedItem } from "@/lib/pipeline/dedup";

export const dynamic = "force-dynamic";

/**
 * Review queue for reader submissions. Approve sends one to the normal rewrite
 * queue (same relevance check and rules as any source, credited to the
 * reader); reject keeps it out. Protected by the admin login (middleware).
 */
type Row = {
  id: number; site_slug: string; state: string; type: SubmissionType; title: string; body: string; city: string | null;
  event_date: string | null; name: string; email: string; phone: string | null; photo_url: string | null; video_url: string | null;
  status: string; created_at: string;
};

async function decide(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const action = String(formData.get("action"));
  const note = String(formData.get("note") || "").slice(0, 500);
  await ensureSubmissionsTable();
  const { rows } = await pool.query<Row>("SELECT * FROM submissions WHERE id = $1 AND status = 'pending'", [id]);
  const s = rows[0];
  if (!s) return;
  // a closing is shown as a line on /alerts, not rewritten into a story
  if (action === "approve" && s.type !== "closing") {
    const section = s.type === "event" ? "life" : s.type === "achievement" ? "local-news" : "local-news";
    const facts = [
      s.city ? `Place: ${s.city}, ${s.state}.` : `State: ${s.state}.`,
      s.event_date ? `When: ${s.event_date}.` : "",
      `Submitted to the newsroom by a reader, ${s.name}.`,
    ].filter(Boolean).join(" ");
    await insertFeedItem(
      {
        guid: `submission:${s.id}`,
        title: s.title,
        link: `https://${sites[s.site_slug]?.domain || ""}/submit#${s.id}`,
        description: `${s.photo_url ? `<!--img:${s.photo_url}-->` : ""}${s.body}\n\n${facts}`,
        pubDate: new Date().toISOString(),
        source: `Reader submission (${s.name})`,
      },
      `reader:${s.type}`,
      section,
      s.state
    );
  }
  await pool.query("UPDATE submissions SET status = $2, note = $3, reviewed_at = now() WHERE id = $1", [id, action === "approve" ? "approved" : "rejected", note || null]);
  revalidatePath("/admin/submissions");
}

export default async function SubmissionsPage({ searchParams }: { searchParams: { status?: string } }) {
  await ensureSubmissionsTable();
  const status = ["pending", "approved", "rejected"].includes(searchParams.status || "") ? searchParams.status! : "pending";
  const { rows } = await pool.query<Row>("SELECT * FROM submissions WHERE status = $1 ORDER BY created_at DESC LIMIT 100", [status]);
  return (
    <div className="mx-auto max-w-[1100px] p-6">
      <h1 className="text-2xl font-bold">Reader submissions</h1>
      <p className="mt-1 text-sm text-gray-600">
        Approve sends it to the rewrite queue (facts only, same rules as every source). Check names, places and photos first; anything accusing a person needs an official source.
      </p>
      <nav className="mt-4 flex gap-3 text-sm">
        {["pending", "approved", "rejected"].map((s) => (
          <a key={s} href={`/admin/submissions?status=${s}`} className={s === status ? "font-bold underline" : "text-blue-700"}>{s}</a>
        ))}
      </nav>
      {rows.length === 0 && <p className="mt-8 text-gray-500">Nothing {status}.</p>}
      <div className="mt-6 space-y-6">
        {rows.map((s) => (
          <div key={s.id} className="rounded border border-gray-300 bg-white p-4">
            <div className="text-xs uppercase text-gray-500">
              #{s.id} · {SUBMISSION_TYPES[s.type] || s.type} · {sites[s.site_slug]?.name || s.site_slug} · {new Date(s.created_at).toLocaleString("en-US")}
            </div>
            <h2 className="mt-1 text-lg font-bold">{s.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-[15px]">{s.body}</p>
            <p className="mt-2 text-sm text-gray-700">
              {s.city && <>📍 {s.city} · </>}{s.event_date && <>🗓 {s.event_date} · </>}
              From {s.name} &lt;{s.email}&gt;{s.phone ? ` · ${s.phone}` : ""}
            </p>
            {s.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.photo_url} alt="" className="mt-3 max-h-72 rounded" />
            )}
            {s.video_url && <p className="mt-2 text-sm"><a href={s.video_url} target="_blank" rel="noreferrer" className="text-blue-700 underline">Video link</a></p>}
            {status === "pending" && (
              <form action={decide} className="mt-4 flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={s.id} />
                <input name="note" placeholder="Note (optional)" className="flex-1 rounded border px-2 py-1 text-sm" />
                <button name="action" value="approve" className="rounded bg-green-700 px-4 py-1.5 text-sm font-bold text-white">Approve</button>
                <button name="action" value="reject" className="rounded bg-gray-600 px-4 py-1.5 text-sm font-bold text-white">Reject</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
