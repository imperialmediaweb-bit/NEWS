"use client";

import { useState } from "react";
import { sites } from "@/config/sites";
import { Download, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ImportResult {
  site: string;
  status: "success" | "error" | "running";
  imported: number;
  skipped: number;
  message?: string;
}

export default function ImportPage() {
  const siteList = Object.values(sites);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  const toggleSite = (slug: string) => {
    setSelectedSites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const selectAll = () => {
    if (selectedSites.length === siteList.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites(siteList.map((s) => s.slug));
    }
  };

  const handleImport = async () => {
    if (selectedSites.length === 0) return;
    setImporting(true);
    setResults(
      selectedSites.map((s) => ({
        site: s,
        status: "running" as const,
        imported: 0,
        skipped: 0,
      }))
    );

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sites: selectedSites }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults(
        selectedSites.map((s) => ({
          site: s,
          status: "error" as const,
          imported: 0,
          skipped: 0,
          message: "Connection failed — is DATABASE_URL set?",
        }))
      );
    }
    setImporting(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Import from WordPress</h1>
      <p className="text-gray-500 mb-6">
        Imports articles, categories, featured images (URLs), and WP Automatic
        campaign configs from each WordPress site via REST API.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Site selector */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">
                Select Sites ({selectedSites.length})
              </h2>
              <button
                onClick={selectAll}
                className="text-xs text-[#c1121f] font-medium hover:underline"
              >
                {selectedSites.length === siteList.length
                  ? "Deselect All"
                  : "Select All 50"}
              </button>
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-1">
              {siteList.map((site) => (
                <label
                  key={site.slug}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedSites.includes(site.slug)
                      ? "bg-red-50 border border-[#c1121f]"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSites.includes(site.slug)}
                    onChange={() => toggleSite(site.slug)}
                    className="accent-[#c1121f]"
                  />
                  <div>
                    <p className="text-sm font-medium">{site.name}</p>
                    <p className="text-xs text-gray-400">{site.domain}</p>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handleImport}
              disabled={selectedSites.length === 0 || importing}
              className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
            >
              {importing ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Importing...
                </>
              ) : (
                <>
                  <Download size={18} /> Start Import
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mt-4">
            <h3 className="font-bold mb-3">What gets imported:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">✅ Articles (title, content, slug, date)</li>
              <li className="flex gap-2">✅ Categories (all WP categories)</li>
              <li className="flex gap-2">✅ Featured Images (URLs, not files)</li>
              <li className="flex gap-2">✅ Authors</li>
              <li className="flex gap-2">✅ WP Automatic campaigns config</li>
              <li className="flex gap-2">✅ Google Analytics Measurement IDs</li>
              <li className="flex gap-2">✅ Google Search Console verification</li>
            </ul>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold mb-4">Import Results</h2>

            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Download size={48} className="mx-auto mb-4 opacity-30" />
                <p>Select sites and click &quot;Start Import&quot; to begin.</p>
                <p className="text-sm mt-2">
                  Each site takes ~3 minutes (15,000 articles × 100/request).
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.site}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                      result.status === "success"
                        ? "bg-green-50 border-green-200"
                        : result.status === "error"
                        ? "bg-red-50 border-red-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.status === "success" ? (
                        <CheckCircle size={18} className="text-green-500" />
                      ) : result.status === "error" ? (
                        <XCircle size={18} className="text-red-500" />
                      ) : (
                        <Loader2
                          size={18}
                          className="text-yellow-500 animate-spin"
                        />
                      )}
                      <div>
                        <p className="font-medium text-sm">{result.site}</p>
                        {result.message && (
                          <p className="text-xs text-gray-500">
                            {result.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium text-green-700">
                        +{result.imported} imported
                      </p>
                      {result.skipped > 0 && (
                        <p className="text-xs text-gray-400">
                          {result.skipped} skipped
                        </p>
                      )}
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
