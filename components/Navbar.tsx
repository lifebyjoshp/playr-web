"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

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

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1F5C]/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* LOGO */}
        <Link
          href={user ? "/feed" : "/"}
          className="text-xl font-extrabold tracking-wide"
        >
          PLAYR
        </Link>

        {/* NAV LINKS */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href={user ? "/feed" : "/login?message=login-required"}
            className="text-sm font-medium text-white/85 transition hover:text-white"
          >
            Home
          </Link>

          <Link
            href={user ? "/explore" : "/login?message=login-required"}
            className="text-sm font-medium text-white/85 transition hover:text-white"
          >
            Explore
          </Link>

          <Link
  href={user ? "/watchlist" : "/login?message=login-required"}
  className="text-sm font-medium text-white/85 transition hover:text-white"
>
  Watchlist
</Link>

          <Link
            href={user ? "/dashboard" : "/login?message=login-required"}
            className="text-sm font-medium text-white/85 transition hover:text-white"
          >
            Dashboard
          </Link>
        </nav>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
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
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Log out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}