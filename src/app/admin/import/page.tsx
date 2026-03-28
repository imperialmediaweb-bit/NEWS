"use client";

import { useState, useRef } from "react";
import { sites } from "@/config/sites";
import { Download, CheckCircle, XCircle, Loader2, Upload, FileText, Play, Zap } from "lucide-react";

interface ImportResult {
  site: string;
  slug: string;
  status: "success" | "error" | "running" | "waiting";
  imported: number;
  skipped: number;
  page: number;
  totalPages: number;
  message?: string;
}

export default function ImportPage() {
  const siteList = Object.values(sites);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [mode, setMode] = useState<"auto" | "xml">("auto");
  const [xmlSite, setXmlSite] = useState(siteList[0]?.slug || "");
  const [xmlFiles, setXmlFiles] = useState<File[]>([]);
  const [parallel, setParallel] = useState(3);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  // Import one page of one site via server
  async function importPage(siteSlug: string, page: number): Promise<{
    imported: number;
    skipped: number;
    totalPages: number;
    done: boolean;
    error?: string;
  }> {
    const res = await fetch("/api/admin/import-site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteSlug, page }),
    });
    return res.json();
  }

  // Import one full site page by page
  async function importFullSite(
    siteSlug: string,
    siteName: string,
    index: number,
    allResults: ImportResult[]
  ) {
    let page = 1;
    let totalImported = 0;
    let totalSkipped = 0;

    allResults[index] = { ...allResults[index], status: "running", message: "Starting..." };
    setResults([...allResults]);

    while (!abortRef.current) {
      try {
        const data = await importPage(siteSlug, page);

        if (data.error) {
          allResults[index] = {
            ...allResults[index],
            status: "error",
            message: data.error,
            imported: totalImported,
            skipped: totalSkipped,
          };
          setResults([...allResults]);
          return;
        }

        totalImported += data.imported;
        totalSkipped += data.skipped;

        allResults[index] = {
          ...allResults[index],
          imported: totalImported,
          skipped: totalSkipped,
          page,
          totalPages: data.totalPages,
          message: `Page ${page}/${data.totalPages}`,
        };
        setResults([...allResults]);

        if (data.done) break;
        page++;
      } catch (err) {
        allResults[index] = {
          ...allResults[index],
          status: "error",
          message: String(err),
          imported: totalImported,
        };
        setResults([...allResults]);
        return;
      }
    }

    allResults[index] = {
      ...allResults[index],
      status: "success",
      message: `${totalImported} articles imported`,
    };
    setResults([...allResults]);
  }

  // Auto import all sites with parallelism
  const handleAutoImport = async () => {
    setImporting(true);
    abortRef.current = false;

    const allResults: ImportResult[] = siteList.map((s) => ({
      site: s.name,
      slug: s.slug,
      status: "waiting" as const,
      imported: 0,
      skipped: 0,
      page: 0,
      totalPages: 0,
    }));
    setResults([...allResults]);

    // Process sites in batches of `parallel`
    let i = 0;
    while (i < siteList.length && !abortRef.current) {
      const batch = siteList.slice(i, i + parallel);
      const promises = batch.map((site, batchIdx) =>
        importFullSite(site.slug, site.name, i + batchIdx, allResults)
      );
      await Promise.all(promises);
      i += parallel;
    }

    setImporting(false);
  };

  // XML Import
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
        const res = await fetch("/api/admin/import-xml", { method: "POST", body: formData });
        const data = await res.json();
        newResults.push({
          site: `${xmlSite} (${file.name})`,
          slug: xmlSite,
          status: data.success ? "success" : "error",
          imported: data.imported || 0,
          skipped: data.skipped || 0,
          page: 0,
          totalPages: 0,
          message: data.error || `${data.total || 0} items in file`,
        });
      } catch {
        newResults.push({
          site: `${xmlSite} (${file.name})`,
          slug: xmlSite,
          status: "error",
          imported: 0,
          skipped: 0,
          page: 0,
          totalPages: 0,
          message: "Upload failed",
        });
      }
      setResults([...newResults]);
    }
    setImporting(false);
  };

  const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
  const totalDone = results.filter((r) => r.status === "success" || r.status === "error").length;
  const totalSuccess = results.filter((r) => r.status === "success").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Import from WordPress</h1>
      <p className="text-gray-500 mb-6">Import articles from all 50 WordPress sites.</p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("auto")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            mode === "auto" ? "bg-[#c1121f] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Zap size={16} className="inline mr-2" />
          Auto Import All 50
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
        <div className="lg:col-span-1">
          {mode === "auto" ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold mb-3">Auto Import</h2>
              <p className="text-sm text-gray-500 mb-4">
                Server fetches articles from each WordPress site and saves to database.
              </p>

              <label className="block text-sm font-medium mb-1">Parallel imports</label>
              <select
                value={parallel}
                onChange={(e) => setParallel(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg mb-4 outline-none"
              >
                <option value="1">1 site at a time (slow, safe)</option>
                <option value="3">3 sites at a time (recommended)</option>
                <option value="5">5 sites at a time (fast)</option>
                <option value="10">10 sites at a time (very fast)</option>
              </select>

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
                  <p className="text-xs text-gray-400 mt-1">{totalSuccess}/{results.length} sites done</p>
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
                  <option key={site.slug} value={site.slug}>{site.name}</option>
                ))}
              </select>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#c1121f] hover:bg-red-50 transition-colors"
              >
                <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Click to select XML file(s)</p>
              </div>
              <input ref={fileRef} type="file" accept=".xml" multiple className="hidden"
                onChange={(e) => { if (e.target.files) setXmlFiles(Array.from(e.target.files)); }} />
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
              <button onClick={handleXmlImport} disabled={xmlFiles.length === 0 || importing}
                className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-[#c1121f] hover:bg-[#8b0000] disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors">
                {importing ? <><Loader2 size={18} className="animate-spin" /> Importing...</> : <><Upload size={18} /> Import XML</>}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold mb-4">
              Import Progress {totalDone > 0 && `(${totalDone}/${results.length})`}
            </h2>
            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Download size={48} className="mx-auto mb-4 opacity-30" />
                <p>Click &quot;Start Import All 50 Sites&quot; to begin.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {results.map((result, idx) => (
                  <div key={idx} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                    result.status === "success" ? "bg-green-50 border-green-200"
                    : result.status === "error" ? "bg-red-50 border-red-200"
                    : result.status === "running" ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex items-center gap-3">
                      {result.status === "success" ? <CheckCircle size={18} className="text-green-500" />
                      : result.status === "error" ? <XCircle size={18} className="text-red-500" />
                      : result.status === "running" ? <Loader2 size={18} className="text-blue-500 animate-spin" />
                      : <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />}
                      <div>
                        <p className="font-medium text-sm">{result.site}</p>
                        {result.message && <p className="text-xs text-gray-500">{result.message}</p>}
                      </div>
                    </div>
                    {result.imported > 0 && (
                      <div className="text-right text-sm">
                        <p className="font-medium text-green-700">+{result.imported.toLocaleString()}</p>
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
