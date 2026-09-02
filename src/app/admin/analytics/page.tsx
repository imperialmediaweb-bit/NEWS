"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  RefreshCw,
  Globe,
  TrendingUp,
  Eye,
  ExternalLink,
} from "lucide-react";

interface AnalyticsData {
  totals: { today: number; week: number; month: number };
  sitesToday: { name: string; domain: string; state: string; views_today: number }[];
  sitesWeek: { name: string; domain: string; views_week: number }[];
  topPages: { path: string; title: string; domain: string; views: number }[];
  topReferrers: { source: string; views: number }[];
  hourlyTrend: { hour: string; views: number }[];
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const secret = localStorage.getItem("cron_secret") || "";
      const res = await fetch(
        "/api/analytics/stats?key=" + encodeURIComponent(secret)
      );
      if (res.ok) {
        setData(await res.json());
        setError(null);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(`Error ${res.status}: ${d.error || "Failed"}`);
      }
    } catch (err) {
      setError("Network error: " + String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("cron_secret")) {
      const secret = prompt("Enter CRON_SECRET:");
      if (secret) localStorage.setItem("cron_secret", secret);
    }
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[var(--accent)]" />
            Traffic Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time page views across all 50 state sites
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Today</span>
          </div>
          <p className="text-2xl font-bold">
            {(data?.totals?.today || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">This Week</span>
          </div>
          <p className="text-2xl font-bold">
            {(data?.totals?.week || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">This Month</span>
          </div>
          <p className="text-2xl font-bold">
            {(data?.totals?.month || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Hourly Trend Bar Chart */}
      {data?.hourlyTrend && data.hourlyTrend.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold mb-4">Last 24 Hours</h2>
          <div className="flex items-end gap-1 h-32">
            {data.hourlyTrend.map((h, i) => {
              const maxViews = Math.max(
                ...data.hourlyTrend.map((x) => x.views),
                1
              );
              const height = (h.views / maxViews) * 100;
              const hour = new Date(h.hour).getHours();
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-blue-400 rounded-t min-h-[2px]"
                    style={{ height: `${height}%` }}
                    title={`${hour}:00 — ${h.views} views`}
                  />
                  {i % 3 === 0 && (
                    <span className="text-[10px] text-gray-400">{hour}h</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traffic per Site (Today) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold mb-4">Traffic per Site (Today)</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(data?.sitesToday || []).map((site, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
              >
                <div>
                  <span className="font-medium">{site.state}</span>
                  <span className="text-gray-400 ml-2 text-xs">
                    {site.domain}
                  </span>
                </div>
                <span className="font-bold text-blue-600">
                  {site.views_today.toLocaleString()}
                </span>
              </div>
            ))}
            {(data?.sitesToday || []).length === 0 && (
              <p className="text-gray-400 text-center py-4">No traffic yet</p>
            )}
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold mb-4">Top Pages (Today)</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(data?.topPages || []).map((page, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
              >
                <div className="truncate mr-4 flex-1">
                  <span className="font-medium">
                    {page.title || page.path}
                  </span>
                  <span className="text-gray-400 ml-2 text-xs">
                    {page.domain}
                  </span>
                </div>
                <span className="font-bold text-green-600 whitespace-nowrap">
                  {page.views.toLocaleString()}
                </span>
              </div>
            ))}
            {(data?.topPages || []).length === 0 && (
              <p className="text-gray-400 text-center py-4">No data yet</p>
            )}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Top Referrers (Today)
          </h2>
          <div className="space-y-2">
            {(data?.topReferrers || []).map((ref, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
              >
                <span className="font-medium">{ref.source || "Direct"}</span>
                <span className="font-bold text-purple-600">
                  {ref.views.toLocaleString()}
                </span>
              </div>
            ))}
            {(data?.topReferrers || []).length === 0 && (
              <p className="text-gray-400 text-center py-4">No data yet</p>
            )}
          </div>
        </div>

        {/* Weekly per Site */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold mb-4">Traffic per Site (This Week)</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(data?.sitesWeek || []).map((site, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
              >
                <span className="font-medium">{site.name}</span>
                <span className="font-bold text-green-600">
                  {site.views_week.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
