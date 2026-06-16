"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

const navItems = [
  { label: "Home", href: "/feed" },
  { label: "Explore", href: "/explore" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Edit Profile", href: "/dashboard/public-profile" },
  { label: "Experience", href: "/dashboard/experience" },
  { label: "Achievements", href: "/dashboard/achievements" },
  { label: "Highlights", href: "/dashboard/highlights" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 md:px-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
              PLAYR Menu
            </p>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/feed" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#D8F200] text-[#0B1F5C]"
                        : "bg-[#081642] text-white/80 hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <section>{children}</section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0B1F5C]/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-2 py-2 text-center text-xs font-bold ${
                  isActive
                    ? "bg-[#D8F200] text-[#0B1F5C]"
                    : "bg-white/10 text-white/80"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}