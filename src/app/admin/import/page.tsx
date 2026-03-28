"use client";

import { useState, useRef } from "react";
import { sites } from "@/config/sites";
import { Download, CheckCircle, XCircle, Loader2, Upload, FileText } from "lucide-react";

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
  const [mode, setMode] = useState<"api" | "xml">("xml");
  const [xmlSite, setXmlSite] = useState(siteList[0]?.slug || "");
  const [xmlFiles, setXmlFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

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

  // API Import (REST API — needs Cloudflare bypass)
  const handleApiImport = async () => {
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

  // XML Import (upload file — no Cloudflare needed)
  const handleXmlImport = async () => {
    if (xmlFiles.length === 0 || !xmlSite) return;
    setImporting(true);
    setResults([]);

    const newResults: ImportResult[] = [];

    for (const file of xmlFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("site", xmlSite);

      setResults((prev) => [
        ...prev,
        { site: `${xmlSite} (${file.name})`, status: "running", imported: 0, skipped: 0 },
      ]);

      try {
        const res = await fetch("/api/admin/import-xml", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        const result: ImportResult = {
          site: `${xmlSite} (${file.name})`,
          status: data.success ? "success" : "error",
          imported: data.imported || 0,
          skipped: data.skipped || 0,
          message: data.error || `Total items in file: ${data.total || 0}`,
        };
        newResults.push(result);
        setResults([...newResults]);
      } catch {
        const result: ImportResult = {
          site: `${xmlSite} (${file.name})`,
          status: "error",
          imported: 0,
          skipped: 0,
          message: "Upload failed — check DATABASE_URL",
        };
        newResults.push(result);
        setResults([...newResults]);
      }
    }
    setImporting(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Import from WordPress</h1>
      <p className="text-gray-500 mb-6">
        Import articles from your WordPress sites into the database.
      </p>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("xml")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            mode === "xml"
              ? "bg-[#c1121f] text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Upload size={16} className="inline mr-2" />
          XML Upload (Recommended)
        </button>
        <button
          onClick={() => setMode("api")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            mode === "api"
              ? "bg-[#c1121f] text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Download size={16} className="inline mr-2" />
          REST API (Needs Cloudflare bypass)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-1">
          {mode === "xml" ? (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-bold mb-4">XML Upload</h2>

                {/* Select Site */}
                <label className="block text-sm font-medium mb-1">Select Site</label>
                <select
                  value={xmlSite}
                  onChange={(e) => setXmlSite(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-4 outline-none"
                >
                  {siteList.map((site) => (
                    <option key={site.slug} value={site.slug}>
                      {site.name} ({site.domain})
                    </option>
                  ))}
                </select>

                {/* File Upload */}
                <label className="block text-sm font-medium mb-1">WordPress XML File</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#c1121f] hover:bg-red-50 transition-colors"
                >
                  <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Click to select XML file(s)
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    WordPress export .xml files
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xml"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setXmlFiles(Array.from(e.target.files));
                    }
                  }}
                />

                {/* Selected files */}
                {xmlFiles.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {xmlFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                        <FileText size={14} />
                        <span className="truncate">{f.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {(f.size / 1024 / 1024).toFixed(1)} MB
                        </span>
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
                    <>
                      <Loader2 size={18} className="animate-spin" /> Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} /> Import XML
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 mt-4">
                <h3 className="font-bold mb-3">How to export from WordPress:</h3>
                <ol className="space-y-2 text-sm text-gray-600 list-decimal pl-4">
                  <li>Go to <strong>wp-admin</strong> → <strong>Tools</strong> → <strong>Export</strong></li>
                  <li>Select <strong>&quot;Posts&quot;</strong></li>
                  <li>Click <strong>&quot;Download Export File&quot;</strong></li>
                  <li>Upload the .xml file here</li>
                </ol>
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-xs text-green-700">
                  No Cloudflare bypass needed! Works with any WordPress site.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold">Select Sites ({selectedSites.length})</h2>
                  <button onClick={selectAll} className="text-xs text-[#c1121f] font-medium hover:underline">
                    {selectedSites.length === siteList.length ? "Deselect All" : "Select All 50"}
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
                  onClick={handleApiImport}
                  disabled={selectedSites.length === 0 || importing}
                  className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
                >
                  {importing ? (
                    <><Loader2 size={18} className="animate-spin" /> Importing...</>
                  ) : (
                    <><Download size={18} /> Start API Import</>
                  )}
                </button>
              </div>
              <div className="bg-yellow-50 rounded-xl shadow-sm p-4 mt-4 text-sm text-yellow-700">
                ⚠️ REST API import requires Cloudflare to allow requests from Railway. Use XML upload if Cloudflare is blocking.
              </div>
            </>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6 mt-4">
            <h3 className="font-bold mb-3">What gets imported:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ Articles (title, content, slug, date)</li>
              <li>✅ Categories (all WP categories)</li>
              <li>✅ Featured Images (URLs, not files)</li>
              <li>✅ Authors</li>
              <li>✅ FIFU image URLs</li>
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
                {mode === "xml" ? (
                  <>
                    <p>Select a site, upload XML file(s), and click &quot;Import XML&quot;</p>
                    <p className="text-sm mt-2">
                      Export from WordPress: wp-admin → Tools → Export → Posts → Download
                    </p>
                  </>
                ) : (
                  <>
                    <p>Select sites and click &quot;Start API Import&quot; to begin.</p>
                    <p className="text-sm mt-2">
                      Each site takes ~3 minutes (15,000 articles × 100/request).
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((result, idx) => (
                  <div
                    key={idx}
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
                        <Loader2 size={18} className="text-yellow-500 animate-spin" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{result.site}</p>
                        {result.message && (
                          <p className="text-xs text-gray-500">{result.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium text-green-700">+{result.imported} imported</p>
                      {result.skipped > 0 && (
                        <p className="text-xs text-gray-400">{result.skipped} skipped</p>
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
