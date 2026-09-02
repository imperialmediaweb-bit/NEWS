"use client";

import { useState, useRef, useEffect } from "react";
import { sites } from "@/config/sites";
import { Download, CheckCircle, XCircle, Loader2, Upload, FileText, Play, Zap, RefreshCw, SkipForward } from "lucide-react";

interface ImportResult {
  site: string;
  slug: string;
  status: "success" | "error" | "running" | "waiting" | "skipped";
  imported: number;
  skipped: number;
  page: number;
  totalPages: number;
  message?: string;
}

interface SiteStatus {
  name: string;
  count: number;
}

export default function ImportPage() {
  const siteList = Object.values(sites);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [mode, setMode] = useState<"auto" | "xml">("auto");
  const [xmlSite, setXmlSite] = useState(siteList[0]?.slug || "");
  const [xmlFiles, setXmlFiles] = useState<File[]>([]);
  const [parallel, setParallel] = useState(3);
  const [existingStatus, setExistingStatus] = useState<Record<string, SiteStatus>>({});
  const [loadingStatus, setLoadingStatus] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const [statusError, setStatusError] = useState("");

  // Load existing article counts on mount
  useEffect(() => {
    fetch("/api/admin/sites-status")
      .then((r) => r.json())
      .then((data) => {
        if (data._error) {
          setStatusError(data._error);
          setLoadingStatus(false);
          return;
        }
        setExistingStatus(data);
        setLoadingStatus(false);
      })
      .catch((err) => {
        setStatusError(String(err));
        setLoadingStatus(false);
      });
  }, []);

  const sitesWithArticles = Object.entries(existingStatus).filter(([, v]) => v && v.count > 0).length;
  const totalExistingArticles = Object.values(existingStatus).reduce((sum, v) => sum + (v?.count || 0), 0);

  // Import one page of one site via server
  async function importPage(siteSlug: string, page: number): Promise<{
    imported: number;
    skipped: number;
    totalPages: number;
    done: boolean;
    error?: string;
    alreadyComplete?: boolean;
    dbCount?: number;
    wpTotal?: number;
  }> {
    const res = await fetch("/api/admin/import-site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteSlug, page }),
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { imported: 0, skipped: 0, totalPages: 0, done: false, error: text.slice(0, 100) };
    }
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

    let consecutiveErrors = 0;

    while (!abortRef.current) {
      try {
        const data = await importPage(siteSlug, page);

        if (data.error) {
          // If it's Cloudflare blocking, stop this site
          if (data.error.includes("Cloudflare") || data.error.includes("Could not access")) {
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
          // Other errors (timeout etc) — skip this page, try next
          consecutiveErrors++;
          if (consecutiveErrors >= 3) {
            allResults[index] = {
              ...allResults[index],
              status: totalImported > 0 ? "success" : "error",
              message: totalImported > 0 ? `${totalImported} articles (stopped at page ${page})` : data.error,
              imported: totalImported,
              skipped: totalSkipped,
            };
            setResults([...allResults]);
            return;
          }
          page++;
          continue;
        }

        consecutiveErrors = 0;

        // Site already fully imported — skip instantly
        if (data.alreadyComplete) {
          allResults[index] = {
            ...allResults[index],
            status: "success",
            message: `Complete! ${data.dbCount}/${data.wpTotal} articles`,
            imported: 0,
            skipped: 0,
          };
          setResults([...allResults]);
          return;
        }

        totalImported += data.imported || 0;
        totalSkipped += data.skipped || 0;

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
        consecutiveErrors++;
        if (consecutiveErrors >= 3) {
          allResults[index] = {
            ...allResults[index],
            status: totalImported > 0 ? "success" : "error",
            message: totalImported > 0 ? `${totalImported} articles (stopped at page ${page})` : String(err),
            imported: totalImported,
          };
          setResults([...allResults]);
          return;
        }
        // Skip this page, try next
        allResults[index] = {
          ...allResults[index],
          message: `Page ${page} timeout, skipping...`,
        };
        setResults([...allResults]);
        page++;
      }
    }

    allResults[index] = {
      ...allResults[index],
      status: "success",
      message: `${totalImported} articles imported`,
    };
    setResults([...allResults]);
  }

  // Auto import with smart skip
  const handleAutoImport = async () => {
    setImporting(true);
    abortRef.current = false;

    // Build list — skip only fully imported sites (10,000+ articles) instantly
    // Sites with partial imports (< 10,000) continue importing
    const allResults: ImportResult[] = siteList.map((s) => {
      const existing = existingStatus[s.slug];
      const existingCount = existing?.count || 0;

      // 10,000+ = fully imported, skip instantly
      if (existingCount >= 10000) {
        return {
          site: s.name,
          slug: s.slug,
          status: "success" as const,
          imported: 0,
          skipped: 0,
          page: 0,
          totalPages: 0,
          message: `Complete! ${existingCount.toLocaleString()} articles in DB`,
        };
      }

      return {
        site: s.name,
        slug: s.slug,
        status: "waiting" as const,
        imported: 0,
        skipped: 0,
        page: 0,
        totalPages: 0,
        message: existingCount > 0 ? `${existingCount.toLocaleString()} in DB, continuing...` : undefined,
      };
    });
    setResults([...allResults]);

    // Only import sites that have 0 articles
    const toImport = allResults
      .map((r, i) => ({ ...r, index: i }))
      .filter((r) => r.status === "waiting");
    let nextIdx = 0;

    async function runNext(): Promise<void> {
      while (nextIdx < toImport.length && !abortRef.current) {
        const item = toImport[nextIdx];
        nextIdx++;
        await importFullSite(item.slug, item.site, item.index, allResults);
      }
    }

    // Start `parallel` workers, each picks up the next site when done
    const workers = Array.from({ length: Math.min(parallel, toImport.length) }, () => runNext());
    await Promise.all(workers);

    setImporting(false);
  };

  // Retry only failed sites
  const handleRetryFailed = async () => {
    setImporting(true);
    abortRef.current = false;

    const failedIndexes = results
      .map((r, i) => ({ ...r, index: i }))
      .filter((r) => r.status === "error");

    // Reset failed to waiting
    const updatedResults = [...results];
    for (const f of failedIndexes) {
      updatedResults[f.index] = { ...updatedResults[f.index], status: "waiting", message: "Retrying...", imported: 0, skipped: 0 };
    }
    setResults([...updatedResults]);

    let i = 0;
    while (i < failedIndexes.length && !abortRef.current) {
      const batch = failedIndexes.slice(i, i + parallel);
      const promises = batch.map((item) =>
        importFullSite(item.slug, item.site, item.index, updatedResults)
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
  const totalFailed = results.filter((r) => r.status === "error").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Import from WordPress</h1>
      <p className="text-gray-500 mb-6">Import articles from all 50 WordPress sites.</p>

      {/* Status error */}
      {statusError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="font-medium text-red-800">Could not load site status</p>
          <p className="text-xs text-red-600 mt-1 font-mono">{statusError}</p>
          <p className="text-xs text-gray-500 mt-2">Import will process all sites. Visit /api/admin/setup-db to create tables first.</p>
        </div>
      )}

      {/* Existing status banner */}
      {!loadingStatus && totalExistingArticles > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-800">
              {sitesWithArticles} sites already have {totalExistingArticles.toLocaleString()} articles in DB
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {siteList.length - sitesWithArticles} sites still need importing
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("auto")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            mode === "auto" ? "bg-[var(--accent)] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Zap size={16} className="inline mr-2" />
          Auto Import
        </button>
        <button
          onClick={() => setMode("xml")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            mode === "xml" ? "bg-[var(--accent)] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
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
                className="w-full py-3 rounded-xl font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
              >
                {importing ? (
                  <><Loader2 size={18} className="animate-spin" /> Importing {totalDone}/{results.length}...</>
                ) : (
                  <><Play size={18} /> Start Import</>
                )}
              </button>

              {/* Retry Failed button */}
              {totalFailed > 0 && !importing && (
                <button
                  onClick={handleRetryFailed}
                  className="w-full mt-2 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw size={18} /> Retry {totalFailed} Failed Sites
                </button>
              )}

              {importing && (
                <button
                  onClick={() => { abortRef.current = true; }}
                  className="w-full mt-2 py-2 rounded-xl font-medium text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Stop Import
                </button>
              )}

              {(totalImported > 0 || totalExistingArticles > 0) && (
                <div className="mt-4 text-center py-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">
                    {(totalImported + totalExistingArticles).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">total articles in DB</p>
                  {totalImported > 0 && (
                    <p className="text-xs text-gray-400 mt-1">+{totalImported.toLocaleString()} new this session</p>
                  )}
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
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[var(--accent)] hover:bg-red-50 transition-colors"
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
                className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors">
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
                <p>{loadingStatus ? "Loading site status..." : "Click \"Start Import\" to begin."}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {results.map((result, idx) => (
                  <div key={idx} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                    result.status === "success" ? "bg-green-50 border-green-200"
                    : result.status === "error" ? "bg-red-50 border-red-200"
                    : result.status === "running" ? "bg-blue-50 border-blue-200"
                    : result.status === "skipped" ? "bg-gray-50 border-gray-200 opacity-60"
                    : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex items-center gap-3">
                      {result.status === "success" ? <CheckCircle size={18} className="text-green-500" />
                      : result.status === "error" ? <XCircle size={18} className="text-red-500" />
                      : result.status === "running" ? <Loader2 size={18} className="text-blue-500 animate-spin" />
                      : result.status === "skipped" ? <SkipForward size={18} className="text-gray-400" />
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
