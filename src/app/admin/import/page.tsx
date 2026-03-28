"use client";

import { useState, useRef } from "react";
import { sites } from "@/config/sites";
import { Download, CheckCircle, XCircle, Loader2, Upload, FileText, Play, Zap } from "lucide-react";

interface ImportResult {
  site: string;
  status: "success" | "error" | "running" | "waiting";
  imported: number;
  skipped: number;
  total: number;
  message?: string;
}

function stripHtml(html: string): string {
  return (html || "").replace(/<[^>]*>/g, "").trim();
}

export default function ImportPage() {
  const siteList = Object.values(sites);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [mode, setMode] = useState<"auto" | "xml">("auto");
  const [xmlSite, setXmlSite] = useState(siteList[0]?.slug || "");
  const [xmlFiles, setXmlFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  // === AUTO IMPORT — runs in YOUR browser, bypasses Cloudflare ===
  const handleAutoImport = async () => {
    setImporting(true);
    abortRef.current = false;

    const allResults: ImportResult[] = siteList.map((s) => ({
      site: s.name,
      status: "waiting" as const,
      imported: 0,
      skipped: 0,
      total: 0,
    }));
    setResults([...allResults]);

    for (let i = 0; i < siteList.length; i++) {
      if (abortRef.current) break;

      const site = siteList[i];
      allResults[i] = { ...allResults[i], status: "running", message: "Connecting..." };
      setResults([...allResults]);

      let imported = 0;
      let skipped = 0;
      let page = 1;
      let totalPages = 1;
      let failed = false;

      while (page <= totalPages && !abortRef.current) {
        try {
          // Fetch from WordPress — FROM YOUR BROWSER (not server!)
          let wpUrl = `https://www.${site.domain}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=author,wp:featuredmedia,wp:term`;

          let res = await fetch(wpUrl).catch(() => null);

          // Try without www
          if (!res || !res.ok) {
            wpUrl = `https://${site.domain}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=author,wp:featuredmedia,wp:term`;
            res = await fetch(wpUrl).catch(() => null);
          }

          if (!res || !res.ok) {
            if (page === 1) {
              allResults[i] = { ...allResults[i], status: "error", message: `API returned ${res?.status || "no response"}` };
              failed = true;
            }
            break;
          }

          totalPages = parseInt(res.headers.get("x-wp-totalpages") || "1");
          const posts = await res.json();

          if (!Array.isArray(posts) || posts.length === 0) break;

          // Transform posts
          const articles = posts.map((post: Record<string, unknown>) => {
            const titleObj = post.title as Record<string, string> | undefined;
            const contentObj = post.content as Record<string, string> | undefined;
            const excerptObj = post.excerpt as Record<string, string> | undefined;
            const embedded = post._embedded as Record<string, unknown[]> | undefined;
            const authors = embedded?.author as Array<Record<string, string>> | undefined;
            const media = embedded?.["wp:featuredmedia"] as Array<Record<string, string>> | undefined;
            const terms = embedded?.["wp:term"] as Array<Array<Record<string, string>>> | undefined;

            return {
              title: stripHtml(titleObj?.rendered || ""),
              slug: (post.slug as string) || "",
              content: contentObj?.rendered || "",
              summary: stripHtml(excerptObj?.rendered || ""),
              category: terms?.[0]?.[0]?.slug || "general",
              author: authors?.[0]?.name || "Staff Reporter",
              featured_image: media?.[0]?.source_url || "",
              published_at: (post.date as string) || new Date().toISOString(),
              wp_id: post.id as number,
            };
          }).filter((a: { title: string }) => a.title);

          // Send to our API to save in DB
          const saveRes = await fetch("/api/admin/save-articles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ siteSlug: site.slug, articles }),
          });

          const saveData = await saveRes.json();
          imported += saveData.imported || 0;
          skipped += saveData.skipped || 0;

          allResults[i] = {
            ...allResults[i],
            imported,
            skipped,
            total: totalPages * 100,
            message: `Page ${page}/${totalPages}`,
          };
          setResults([...allResults]);

          page++;

          // Small delay to not overwhelm WordPress
          await new Promise((r) => setTimeout(r, 800));
        } catch (err) {
          if (page === 1) {
            allResults[i] = { ...allResults[i], status: "error", message: String(err) };
            failed = true;
          }
          break;
        }
      }

      if (!failed) {
        allResults[i] = {
          ...allResults[i],
          status: "success",
          message: `${imported} articles from ${page - 1} pages`,
        };
      }
      setResults([...allResults]);
    }

    setImporting(false);
  };

  // === XML Import ===
  const handleXmlImport = async () => {
    if (xmlFiles.length === 0 || !xmlSite) return;
    setImporting(true);
    setResults([]);

    const newResults: ImportResult[] = [];

    for (const file of xmlFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("site", xmlSite);

      try {
        const res = await fetch("/api/admin/import-xml", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        newResults.push({
          site: `${xmlSite} (${file.name})`,
          status: data.success ? "success" : "error",
          imported: data.imported || 0,
          skipped: data.skipped || 0,
          total: data.total || 0,
          message: data.error || `${data.total || 0} items in file`,
        });
      } catch {
        newResults.push({
          site: `${xmlSite} (${file.name})`,
          status: "error",
          imported: 0,
          skipped: 0,
          total: 0,
          message: "Upload failed",
        });
      }
      setResults([...newResults]);
    }
    setImporting(false);
  };

  const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
  const totalDone = results.filter((r) => r.status === "success" || r.status === "error").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Import from WordPress</h1>
      <p className="text-gray-500 mb-6">
        Import articles from all 50 WordPress sites automatically.
      </p>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("auto")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            mode === "auto" ? "bg-[#c1121f] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Zap size={16} className="inline mr-2" />
          Auto Import All 50 (Recommended)
        </button>
        <button
          onClick={() => setMode("xml")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            mode === "xml" ? "bg-[#c1121f] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Upload size={16} className="inline mr-2" />
          XML Upload
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-1">
          {mode === "auto" ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold mb-3">Auto Import</h2>
              <p className="text-sm text-gray-500 mb-4">
                Imports all 50 WordPress sites automatically. Fetches articles directly from your browser — Cloudflare won&apos;t block it.
              </p>

              <div className="bg-green-50 rounded-lg p-3 mb-4 text-sm text-green-700">
                <strong>How it works:</strong>
                <br />1. Your browser fetches articles from each WordPress site
                <br />2. Sends them to Railway database
                <br />3. All automatic — just click Start!
              </div>

              <button
                onClick={handleAutoImport}
                disabled={importing}
                className="w-full py-3 rounded-xl font-bold text-white bg-[#c1121f] hover:bg-[#8b0000] disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
              >
                {importing ? (
                  <><Loader2 size={18} className="animate-spin" /> Importing {totalDone}/{siteList.length}...</>
                ) : (
                  <><Play size={18} /> Start Import All 50 Sites</>
                )}
              </button>

              {importing && (
                <button
                  onClick={() => { abortRef.current = true; }}
                  className="w-full mt-2 py-2 rounded-xl font-medium text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Stop Import
                </button>
              )}

              {totalImported > 0 && (
                <div className="mt-4 text-center py-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{totalImported.toLocaleString()}</p>
                  <p className="text-xs text-green-600">articles imported</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold mb-4">XML Upload</h2>
              <label className="block text-sm font-medium mb-1">Select Site</label>
              <select
                value={xmlSite}
                onChange={(e) => setXmlSite(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4 outline-none"
              >
                {siteList.map((site) => (
                  <option key={site.slug} value={site.slug}>
                    {site.name}
                  </option>
                ))}
              </select>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#c1121f] hover:bg-red-50 transition-colors"
              >
                <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Click to select XML file(s)</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xml"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) setXmlFiles(Array.from(e.target.files));
                }}
              />

              {xmlFiles.length > 0 && (
                <div className="mt-3 space-y-1">
                  {xmlFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <FileText size={14} />
                      <span className="truncate">{f.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleXmlImport}
                disabled={xmlFiles.length === 0 || importing}
                className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-[#c1121f] hover:bg-[#8b0000] disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
              >
                {importing ? (
                  <><Loader2 size={18} className="animate-spin" /> Importing...</>
                ) : (
                  <><Upload size={18} /> Import XML</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold mb-4">
              Import Progress
              {totalDone > 0 && ` (${totalDone}/${results.length})`}
            </h2>

            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Download size={48} className="mx-auto mb-4 opacity-30" />
                <p>Click &quot;Start Import All 50 Sites&quot; to begin.</p>
                <p className="text-sm mt-2">Runs in your browser — no Cloudflare issues!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                      result.status === "success"
                        ? "bg-green-50 border-green-200"
                        : result.status === "error"
                        ? "bg-red-50 border-red-200"
                        : result.status === "running"
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.status === "success" ? (
                        <CheckCircle size={18} className="text-green-500" />
                      ) : result.status === "error" ? (
                        <XCircle size={18} className="text-red-500" />
                      ) : result.status === "running" ? (
                        <Loader2 size={18} className="text-blue-500 animate-spin" />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{result.site}</p>
                        {result.message && (
                          <p className="text-xs text-gray-500">{result.message}</p>
                        )}
                      </div>
                    </div>
                    {(result.imported > 0 || result.status === "success") && (
                      <div className="text-right text-sm">
                        <p className="font-medium text-green-700">+{result.imported}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
