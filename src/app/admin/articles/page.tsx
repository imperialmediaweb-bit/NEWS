"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Trash2, Edit } from "lucide-react";

interface Article {
  id: number;
  title: string;
  slug: string;
  category: string;
  author: string;
  site_name?: string;
  published_at: string;
  is_featured: boolean;
  is_trending: boolean;
  views: number;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 25;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(perPage),
      ...(search && { search }),
      ...(siteFilter && { site: siteFilter }),
      ...(categoryFilter && { category: categoryFilter }),
    });
    fetch(`/api/admin/articles?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => {
        setArticles([]);
        setLoading(false);
      });
  }, [page, search, siteFilter, categoryFilter]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Articles</h1>
        <a
          href="/admin/publish"
          className="px-4 py-2 bg-[#c1121f] text-white rounded-lg font-medium hover:bg-[#8b0000] transition-colors"
        >
          + New Article
        </a>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c1121f] focus:border-transparent outline-none"
          />
        </div>
        <select
          value={siteFilter}
          onChange={(e) => {
            setSiteFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg outline-none"
        >
          <option value="">All Sites</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg outline-none"
        >
          <option value="">All Categories</option>
          <option value="local-news">Local News</option>
          <option value="us-news">US News</option>
          <option value="world-news">World News</option>
          <option value="politics">Politics</option>
          <option value="business">Business</option>
          <option value="technology">Technology</option>
          <option value="sports">Sports</option>
          <option value="entertainment">Entertainment</option>
          <option value="opinion">Opinion</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                Views
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No articles found. Import from WordPress or publish new articles.
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm line-clamp-1">
                      {article.title}
                    </p>
                    {article.site_name && (
                      <p className="text-xs text-gray-400">{article.site_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {article.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                    {new Date(article.published_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                    {article.views.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1 text-gray-400 hover:text-blue-500">
                        <Edit size={16} />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {total.toLocaleString()} articles total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded border disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-2 text-sm">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded border disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
