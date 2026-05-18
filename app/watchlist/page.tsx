"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  public_slug: string | null;
  headline: string | null;
  primary_sport: string | null;
  position: string | null;
  state: string | null;
  country: string | null;
  profile_photo_url: string | null;
};

export default function WatchlistPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWatchlist = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: saved } = await supabase
        .from("saved_players")
        .select("saved_profile_id")
        .eq("saver_id", user.id);

      const ids = saved?.map((s) => s.saved_profile_id) || [];

      if (ids.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const { data: players } = await supabase
        .from("profiles")
        .select(
          "id, full_name, public_slug, headline, primary_sport, position, state, country, profile_photo_url"
        )
        .in("id", ids)
        .eq("is_public", true);

      setProfiles(players || []);
      setLoading(false);
    };

    loadWatchlist();
  }, []);

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="mb-10">
          <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[#D8F200]">
            Watchlist
          </p>
          <h1 className="text-4xl font-extrabold md:text-5xl">
            Your Watchlist
          </h1>
          <p className="mt-3 text-white/75">
            PLAYRs you are tracking and monitoring.
          </p>
        </div>

        {loading ? (
          <p className="text-white/70">Loading...</p>
        ) : profiles.length === 0 ? (
          <p className="text-white/70">
            You haven’t added any PLAYRs yet.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((p) => (
              <Link
                key={p.id}
                href={`/p/${p.public_slug}`}
                className="rounded-2xl bg-white/10 p-6 hover:bg-white/15"
              >
                <h2 className="text-xl font-bold">{p.full_name}</h2>
                <p className="text-sm text-white/70">{p.headline}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}