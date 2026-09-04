"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { BRAND } from "../lib/branding";

const navItems = [
  { label: "Home", href: "/feed" },
  { label: "Explore", href: "/explore" },

  { label: "Teams", href: "/dashboard/teams" },
  { label: "Family", href: "/dashboard/family" },

  { label: "Athlete", href: "/dashboard/public-profile" },

  { label: "Experience", href: "/dashboard/experience" },
  { label: "Achievements", href: "/dashboard/achievements" },
  { label: "Highlights", href: "/dashboard/highlights" },

  {
    label: "RADR Resumé",
    href: "/dashboard/resume",
    premium: true,
  },

  { label: BRAND.watchlistLabel, href: "/watchlist" },

  { label: "Dashboard", href: "/dashboard" },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 md:px-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
              {BRAND.name}
            </p>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/feed" &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#D8F200] text-[#0B1F5C]"
                        : "bg-[#081642] text-white/80 hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    <span>{item.label}</span>

                    {"premium" in item &&
                      item.premium && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] ${
                            isActive
                              ? "bg-[#0B1F5C]/10 text-[#0B1F5C]"
                              : "bg-[#D8F200] text-[#0B1F5C]"
                          }`}
                        >
                          Premium
                        </span>
                      )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <section>{children}</section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0B1F5C]/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-2">
          {[
            navItems[0], // Home
            navItems[1], // Explore
            navItems[2], // Teams
            navItems[3], // Family
            navItems[4], // Athlete
          ].map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href);

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