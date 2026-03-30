"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Globe,
  Send,
  Download,
  Settings,
  Menu,
  Zap,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/articles", label: "Articles", icon: FileText },
  { href: "/admin/sites", label: "Sites", icon: Globe },
  { href: "/admin/publish", label: "Publish", icon: Send },
  { href: "/admin/import", label: "Import", icon: Download },
  { href: "/admin/domains", label: "Domains", icon: Globe },
  { href: "/admin/settings", label: "Settings & SEO", icon: Settings },
  { href: "/admin/pipeline", label: "Pipeline", icon: Zap },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111] text-white transform transition-transform lg:translate-x-0 lg:static ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">
            <span className="text-white">NEWS</span>
            <span className="text-[#c1121f]"> ADMIN</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">50-Site Control Panel</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#c1121f] text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b px-6 py-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setMobileOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 className="font-bold">
            <span>NEWS</span>
            <span className="text-[#c1121f]"> ADMIN</span>
          </h1>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
