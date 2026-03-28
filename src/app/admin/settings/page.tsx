"use client";

import { useState } from "react";
import { sites } from "@/config/sites";
import { Loader2, CheckCircle, XCircle, BarChart3, Download } from "lucide-react";

interface GaResult {
  slug: string;
  name: string;
  gaId: string | null;
  error?: string;
  status: "waiting" | "running" | "done";
}

export default function SettingsPage() {
  const siteList = Object.values(sites);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<GaResult[]>([]);

  const handleImportAllGa = async () => {
    setImporting(true);
    const allResults: GaResult[] = siteList.map((s) => ({
      slug: s.slug,
      name: s.name,
      gaId: null,
      status: "waiting" as const,
    }));
    setResults([...allResults]);

    // Process 5 at a time
    for (let i = 0; i < siteList.length; i += 5) {
      const batch = siteList.slice(i, i + 5);

      // Mark running
      for (let j = 0; j < batch.length; j++) {
        allResults[i + j] = { ...allResults[i + j], status: "running" };
      }
      setResults([...allResults]);

      const batchResults = await Promise.all(
        batch.map(async (s, j) => {
          try {
            const res = await fetch("/api/admin/import-ga", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ siteSlug: s.slug }),
            });
            const data = await res.json();
            return { index: i + j, gaId: data.gaId || null, error: data.error };
          } catch {
            return { index: i + j, gaId: null, error: "Request failed" };
          }
        })
      );

      for (const r of batchResults) {
        allResults[r.index] = {
          ...allResults[r.index],
          gaId: r.gaId,
          error: r.error,
          status: "done",
        };
      }
      setResults([...allResults]);
    }

    setImporting(false);
  };

  const found = results.filter((r) => r.gaId).length;
  const done = results.filter((r) => r.status === "done").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Settings & SEO</h1>
      <p className="text-gray-500 mb-6">Import Google Analytics codes and manage SEO settings.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={20} className="text-[#c1121f]" />
              <h2 className="font-bold">Google Analytics</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Automatically extract GA measurement IDs from your WordPress sites. Scans each site&apos;s HTML for GA4 (G-), Universal Analytics (UA-), or GTM codes.
            </p>

            <button
              onClick={handleImportAllGa}
              disabled={importing}
              className="w-full py-3 rounded-xl font-bold text-white bg-[#c1121f] hover:bg-[#8b0000] disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
            >
              {importing ? (
                <><Loader2 size={18} className="animate-spin" /> Scanning {done}/{siteList.length}...</>
              ) : (
                <><Download size={18} /> Import All GA Codes</>
              )}
            </button>

            {done > 0 && (
              <div className="mt-4 text-center py-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{found}</p>
                <p className="text-xs text-green-600">GA codes found out of {done} scanned</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <h2 className="font-bold mb-3">SEO Status</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Sitemap.xml (dynamic from DB)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Robots.txt</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Open Graph meta tags</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Twitter Cards</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>JSON-LD Structured Data (articles)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Canonical URLs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>WordPress sitemap_index.xml compatible</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold mb-4">
              GA Codes {done > 0 && `(${found} found / ${done} scanned)`}
            </h2>

            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
                <p>Click &quot;Import All GA Codes&quot; to scan WordPress sites.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {results.map((result, idx) => (
                  <div key={idx} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                    result.gaId ? "bg-green-50 border-green-200"
                    : result.status === "done" ? "bg-yellow-50 border-yellow-200"
                    : result.status === "running" ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex items-center gap-3">
                      {result.gaId ? <CheckCircle size={18} className="text-green-500" />
                      : result.status === "done" ? <XCircle size={18} className="text-yellow-500" />
                      : result.status === "running" ? <Loader2 size={18} className="text-blue-500 animate-spin" />
                      : <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />}
                      <div>
                        <p className="font-medium text-sm">{result.name}</p>
                        {result.gaId && <p className="text-xs text-green-600 font-mono">{result.gaId}</p>}
                        {!result.gaId && result.error && <p className="text-xs text-yellow-600">{result.error}</p>}
                      </div>
                    </div>
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
