"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { BRAND } from "../lib/branding";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getHref = (href: string) => {
    return user ? href : "/login?message=login-required";
  };

  const isActive = (href: string) => {
    if (href === "/feed") {
      return pathname === "/feed";
    }

    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  };

  const navItems = [
    {
      label: "Home",
      mobileLabel: "Home",
      href: "/feed",
    },
    {
      label: "Explore",
      mobileLabel: "Explore",
      href: "/explore",
    },
    {
      label: "Watchlist",
      mobileLabel: "Watchlist",
      href: "/watchlist",
    },
    {
      label: "My Teams",
      mobileLabel: "Teams",
      href: "/dashboard/teams",
    },
    {
      label: "RADR Resumé",
      mobileLabel: "Resumé",
      href: "/dashboard/resume",
    },
    {
      label: "Dashboard",
      mobileLabel: "Dashboard",
      href: "/dashboard",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1F5C]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          {/* LOGO */}
          <Link
            href={user ? "/feed" : "/"}
            className="text-xl font-extrabold tracking-wide"
          >
            {BRAND.name}
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden items-center gap-5 md:flex lg:gap-7">
            {navItems.map((item) => {
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

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3 sm:gap-4">
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
              <button
                onClick={handleLogout}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 sm:px-4 sm:text-sm"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAV */}
      {!loading && (
        <nav
          className="
            fixed
            left-2
            right-2
            z-50
            flex
            items-center
            justify-around
            rounded-2xl
            border
            border-white/10
            bg-[#0B1F5C]/95
            px-1
            py-2
            shadow-2xl
            backdrop-blur-xl
            md:hidden
          "
          style={{
            bottom: "calc(env(safe-area-inset-bottom) + 14px)",
          }}
        >
          {navItems.map((item) => {
            const active = user && isActive(item.href);

            return (
              <Link
                key={item.href}
                href={getHref(item.href)}
                className={`
                  flex
                  min-w-0
                  flex-1
                  items-center
                  justify-center
                  rounded-xl
                  px-0.5
                  py-3
                  text-center
                  text-[9px]
                  font-semibold
                  leading-tight
                  transition
                  ${
                    active
                      ? "bg-white/10 text-[#D8F200]"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                {item.mobileLabel}
              </Link>
            );
          })}
        </nav>
      )}

      {/* MOBILE SAFE SPACING */}
      <div className="h-24 md:hidden" />
    </>
  );
}
