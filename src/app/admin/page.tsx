"use client";

import { useEffect, useState } from "react";
import { Globe, FileText, TrendingUp, Eye } from "lucide-react";

interface DashboardStats {
  totalSites: number;
  totalArticles: number;
  todayArticles: number;
  totalViews: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback for when DB is not connected yet
        setStats({
          totalSites: 50,
          totalArticles: 0,
          todayArticles: 0,
          totalViews: 0,
        });
        setLoading(false);
      });
  }, []);

  const cards = [
    {
      label: "Total Sites",
      value: stats?.totalSites ?? 0,
      icon: Globe,
      color: "bg-blue-500",
    },
    {
      label: "Total Articles",
      value: stats?.totalArticles?.toLocaleString() ?? "0",
      icon: FileText,
      color: "bg-green-500",
    },
    {
      label: "Published Today",
      value: stats?.todayArticles ?? 0,
      icon: TrendingUp,
      color: "bg-[#c1121f]",
    },
    {
      label: "Total Views",
      value: stats?.totalViews?.toLocaleString() ?? "0",
      icon: Eye,
      color: "bg-purple-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4"
          >
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon size={24} className="text-white" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">{card.label}</p>
              <p className="text-2xl font-bold">
                {loading ? "..." : card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/admin/publish"
              className="block px-4 py-3 bg-[#c1121f] text-white rounded-lg text-center font-medium hover:bg-[#8b0000] transition-colors"
            >
              Publish New Article
            </a>
            <a
              href="/admin/import"
              className="block px-4 py-3 bg-gray-900 text-white rounded-lg text-center font-medium hover:bg-gray-700 transition-colors"
            >
              Import from WordPress
            </a>
            <a
              href="/admin/articles"
              className="block px-4 py-3 border-2 border-gray-200 rounded-lg text-center font-medium hover:bg-gray-50 transition-colors"
            >
              Manage Articles
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Database</span>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${stats ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {stats ? "Connected" : "Connecting..."}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Sites Active</span>
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                50
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Auto-Import</span>
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                Not configured
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Google Analytics</span>
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                Site Kit integrated
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
