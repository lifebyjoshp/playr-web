"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { BRAND } from "../lib/branding";
import {
  ActiveAthleteProfile,
  getActiveAthleteContext,
} from "../lib/activeAthlete";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [activeAthlete, setActiveAthlete] =
    useState<ActiveAthleteProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadNavigation = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setUser(currentUser);

      if (currentUser) {
        try {
          const context = await getActiveAthleteContext();

          if (mounted) {
            setActiveAthlete(context?.activeAthlete || null);
          }
        } catch (error) {
          console.error(
            "Unable to load active athlete for navigation:",
            error
          );

          if (mounted) {
            setActiveAthlete(null);
          }
        }
      } else {
        setActiveAthlete(null);
      }

      if (mounted) {
        setLoading(false);
      }
    };

    void loadNavigation();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        const currentUser = session?.user ?? null;

        setUser(currentUser);

        if (!currentUser) {
          setActiveAthlete(null);
          setLoading(false);
          return;
        }

        try {
          const context = await getActiveAthleteContext();

          if (mounted) {
            setActiveAthlete(context?.activeAthlete || null);
          }
        } catch (error) {
          console.error(
            "Unable to refresh active athlete for navigation:",
            error
          );

          if (mounted) {
            setActiveAthlete(null);
          }
        }

        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setMoreOpen(false);
    await supabase.auth.signOut();
    router.push("/");
  };

  const getHref = (href: string) => {
    return user ? href : "/login?message=login-required";
  };

  const publicProfileHref =
    user && activeAthlete?.public_slug
      ? `/p/${activeAthlete.public_slug}`
      : user
        ? "/dashboard/public-profile"
        : "/login?message=login-required";

  const isActive = (href: string) => {
    if (href === "/feed") {
      return pathname === "/feed";
    }

    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  };

  const profileIsActive =
    pathname.startsWith("/p/") ||
    pathname.startsWith("/dashboard/public-profile");

  const moreIsActive =
    pathname.startsWith("/watchlist") ||
    pathname.startsWith("/dashboard/resume") ||
    pathname === "/dashboard";

  const desktopNavItems = [
    {
      label: "Home",
      href: "/feed",
    },
    {
      label: "Explore",
      href: "/explore",
    },
    {
      label: "Watchlist",
      href: "/watchlist",
    },
    {
      label: "My Teams",
      href: "/dashboard/teams",
    },
    {
      label: "RADR Resumé",
      href: "/dashboard/resume",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
  ];

  const mobilePrimaryItems = [
    {
      label: "Home",
      href: "/feed",
      icon: "⌂",
    },
    {
      label: "Explore",
      href: "/explore",
      icon: "⌕",
    },
    {
      label: "Teams",
      href: "/dashboard/teams",
      icon: "◎",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1F5C]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href={user ? "/feed" : "/"}
            className="text-xl font-extrabold tracking-wide"
          >
            {BRAND.name}
          </Link>

          <nav className="hidden items-center gap-5 md:flex lg:gap-7">
            {desktopNavItems.map((item) => {
              const active = user && isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={getHref(item.href)}
                  className={`whitespace-nowrap text-sm font-medium transition ${
                    active
                      ? "text-[#D8F200]"
                      : "text-white/85 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {!loading && !user && (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-white/85 transition hover:text-white"
                >
                  Log in
                </Link>

                <Link
                  href="/signup"
                  className="rounded-xl bg-[#D8F200] px-4 py-2 text-sm font-bold text-[#0B1F5C]"
                >
                  Sign up
                </Link>
              </>
            )}

            {user && (
              <>
                <Link
                  href={publicProfileHref}
                  className="hidden rounded-xl bg-[#D8F200] px-4 py-2 text-sm font-bold text-[#0B1F5C] transition hover:brightness-95 sm:inline-flex"
                >
                  View My Profile
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 sm:px-4 sm:text-sm"
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {!loading && user && (
        <>
          {moreOpen && (
            <div
              className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm md:hidden"
              onClick={() => setMoreOpen(false)}
            >
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-[30px] border-t border-white/10 bg-[#0B1F5C] px-4 pb-[calc(env(safe-area-inset-bottom)+100px)] pt-4 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />

                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                      RADR
                    </p>

                    <h2 className="mt-1 text-xl font-extrabold">
                      More
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMoreOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white/80"
                    aria-label="Close menu"
                  >
                    ×
                  </button>
                </div>

                <div className="grid gap-2">
                  <Link
                    href="/watchlist"
                    className="rounded-2xl bg-[#081642] px-5 py-4 font-semibold text-white/90"
                  >
                    {BRAND.watchlistLabel}
                  </Link>

                  <Link
                    href="/dashboard/resume"
                    className="rounded-2xl bg-[#081642] px-5 py-4 font-semibold text-white/90"
                  >
                    RADR Resumé
                  </Link>

                  <Link
                    href="/dashboard"
                    className="rounded-2xl bg-[#081642] px-5 py-4 font-semibold text-white/90"
                  >
                    Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left font-semibold text-white/70"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
          )}

          <nav
            className="fixed left-3 right-3 z-[70] grid grid-cols-5 rounded-[22px] border border-white/10 bg-[#0B1F5C]/95 p-1.5 shadow-2xl backdrop-blur-xl md:hidden"
            style={{
              bottom: "calc(env(safe-area-inset-bottom) + 10px)",
            }}
          >
            {mobilePrimaryItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-[58px] flex-col items-center justify-center rounded-2xl px-1 text-center transition ${
                    active
                      ? "bg-white/10 text-[#D8F200]"
                      : "text-white/65"
                  }`}
                >
                  <span className="text-lg leading-none">
                    {item.icon}
                  </span>

                  <span className="mt-1 text-[10px] font-bold">
                    {item.label}
                  </span>
                </Link>
              );
            })}

            <Link
              href={publicProfileHref}
              className={`flex min-h-[58px] flex-col items-center justify-center rounded-2xl px-1 text-center transition ${
                profileIsActive
                  ? "bg-white/10 text-[#D8F200]"
                  : "text-white/65"
              }`}
            >
              <span className="text-lg leading-none">◉</span>

              <span className="mt-1 text-[10px] font-bold">
                Profile
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMoreOpen((current) => !current)}
              className={`flex min-h-[58px] flex-col items-center justify-center rounded-2xl px-1 text-center transition ${
                moreOpen || moreIsActive
                  ? "bg-white/10 text-[#D8F200]"
                  : "text-white/65"
              }`}
            >
              <span className="text-xl leading-none">•••</span>

              <span className="mt-1 text-[10px] font-bold">
                More
              </span>
            </button>
          </nav>

          <div className="h-24 md:hidden" />
        </>
      )}

      {!loading && !user && <div className="md:hidden" />}
    </>
  );
}