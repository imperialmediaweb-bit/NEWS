"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Facebook, Plug, Trash2, ExternalLink, AlertTriangle, CheckCircle2, Send, Newspaper, Wand2 } from "lucide-react";
import { sites } from "@/config/sites";

interface FbPage {
  id: number;
  page_id: string;
  page_name: string;
  site_slug: string | null;
  category: string | null;
  connected_at: string;
  updated_at: string;
}

function FacebookAdminInner() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const errorMsg = searchParams.get("error");

  const [pages, setPages] = useState<FbPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [associating, setAssociating] = useState(false);
  const [associateResult, setAssociateResult] = useState<string | null>(null);

  const siteList = Object.values(sites);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/facebook/pages");
    if (res.ok) {
      const data = await res.json();
      setPages(data.pages || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateSite(page_id: string, site_slug: string) {
    await fetch("/api/facebook/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_id, site_slug }),
    });
    load();
  }

  async function autoAssociate() {
    setAssociating(true);
    const res = await fetch("/api/facebook/auto-associate", { method: "POST" });
    const data = await res.json();
    setAssociateResult(`${data.matched} asociate, ${data.already} deja setate, ${data.unmatched?.length || 0} nerecunoscute`);
    load();
    setAssociating(false);
  }

  async function testPost(page_id: string, page_name: string) {
    const message = prompt(`Mesaj de test pentru ${page_name}:`, `Test postare automată — ${new Date().toLocaleString("ro-RO")}`);
    if (!message) return;
    const link = prompt("Link (opțional, lasă gol pentru doar text):", "");
    const res = await fetch("/api/facebook/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_id, message, link: link || undefined }),
    });
    const data = await res.json();
    if (res.ok) alert(`✓ Postat! FB Post ID: ${data.fb_post_id}`);
    else alert(`✗ Eroare: ${data.error}`);
  }

  async function postLatestArticle(page_id: string, page_name: string) {
    if (!confirm(`Postează ultimul articol pe pagina ${page_name}?`)) return;
    const res = await fetch("/api/facebook/post-article", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_id }),
    });
    const data = await res.json();
    if (res.ok) {
      const commentInfo = data.comment_id
        ? `✓ Comentariu: ${data.comment_id}`
        : `⚠ Comentariu eșuat: ${data.comment_error || "?"}`;
      alert(`✓ Postat!\nArticol: ${data.article?.title}\nPost: ${data.post_id}\n${commentInfo}\nLink: ${data.link}`);
    } else {
      alert(`✗ Eroare: ${data.error}`);
    }
  }

  async function disconnect(page_id?: string) {
    if (!confirm(page_id ? "Deconectează această pagină?" : "Deconectează TOATE paginile?")) return;
    await fetch("/api/facebook/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(page_id ? { page_id } : {}),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Facebook</h1>
          <p className="text-gray-500 text-sm mt-1">Conectează paginile Facebook pentru postare automată</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={autoAssociate}
            disabled={associating}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" />
            {associating ? "Se asociază..." : "Asociere automată"}
          </button>
          <a
            href="/api/auth/facebook/start"
            className="inline-flex items-center gap-2 bg-[#1877f2] hover:bg-[#166fe0] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            <Facebook className="w-4 h-4" />
            Conectează Facebook
          </a>
        </div>
      </div>

      {connected && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {connected} pagini conectate cu succes!
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {associateResult && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 text-sm flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          {associateResult}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-blue-500" />
            <h2 className="font-bold text-sm">Pagini conectate ({pages.length})</h2>
          </div>
          {pages.length > 0 && (
            <button onClick={() => disconnect()} className="text-xs text-red-500 hover:text-red-700">
              Deconectează toate
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Se încarcă...</div>
        ) : pages.length === 0 ? (
          <div className="p-12 text-center">
            <Facebook className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nicio pagină conectată.</p>
            <p className="text-gray-400 text-xs mt-1">Apasă &quot;Conectează Facebook&quot; și autorizează contul.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                <th className="px-4 py-3">Pagină</th>
                <th className="px-4 py-3 hidden md:table-cell">Categorie FB</th>
                <th className="px-4 py-3">Site asociat</th>
                <th className="px-4 py-3 hidden lg:table-cell">Conectat</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pages.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.page_name}</div>
                    <div className="text-gray-400 text-xs font-mono">{p.page_id}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.category || "—"}</td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      defaultValue={p.site_slug || ""}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (p.site_slug || "")) updateSite(p.page_id, v);
                      }}
                      placeholder="ex: alabama-express"
                      list="site-slugs"
                      className="border rounded-lg px-2 py-1 text-xs w-full max-w-[180px] focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                    {new Date(p.connected_at).toLocaleDateString("ro-RO")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => postLatestArticle(p.page_id, p.page_name)} className="p-1 text-gray-400 hover:text-amber-500" title="Postează ultimul articol">
                        <Newspaper className="w-4 h-4" />
                      </button>
                      <button onClick={() => testPost(p.page_id, p.page_name)} className="p-1 text-gray-400 hover:text-green-500" title="Test postare custom">
                        <Send className="w-4 h-4" />
                      </button>
                      <a href={`https://facebook.com/${p.page_id}`} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-blue-500" title="Deschide pe Facebook">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button onClick={() => disconnect(p.page_id)} className="p-1 text-gray-400 hover:text-red-500" title="Deconectează">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <datalist id="site-slugs">
        {siteList.map((s) => (
          <option key={s.slug} value={s.slug}>{s.name}</option>
        ))}
      </datalist>
    </div>
  );
}

export default function FacebookAdminPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">Se încarcă...</div>}>
      <FacebookAdminInner />
    </Suspense>
  );
}
