"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import AppShell from "../../components/AppShell";

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
    <AppShell>
      <section className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-7 md:px-10 md:py-16">
        <div className="mb-5 sm:mb-7 md:mb-10">
          <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[#D8F200] sm:mb-3 sm:text-sm sm:tracking-[0.25em]">
            Watchlist
          </p>

          <h1 className="text-2xl font-extrabold sm:text-3xl md:text-5xl">
            Your Watchlist
          </h1>

          <p className="mt-2 text-sm leading-5 text-white/75 sm:mt-3 sm:text-base sm:leading-normal">
            Athletes you are tracking and monitoring.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/70 backdrop-blur sm:rounded-3xl sm:p-6 sm:text-base">
            Loading...
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/70 backdrop-blur sm:rounded-3xl sm:p-6 sm:text-base">
            You haven’t added any Athletes yet.
          </div>
        ) : (
          <>
            <div className="mb-3 text-xs text-white/60 sm:mb-5 sm:text-sm">
              {profiles.length} athlete{profiles.length === 1 ? "" : "s"} saved
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {profiles.map((profile) => {
                const location =
                  [profile.state, profile.country].filter(Boolean).join(", ") ||
                  "Location not set";

                return (
                  <Link
                    key={profile.id}
                    href={`/p/${profile.public_slug}`}
                    className="group rounded-xl border border-white/10 bg-[#081642] p-3 transition hover:-translate-y-0.5 hover:bg-white/10 sm:rounded-2xl sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      {profile.profile_photo_url ? (
                        <img
                          src={profile.profile_photo_url}
                          alt={profile.full_name || "Athlete"}
                          className="h-12 w-12 shrink-0 rounded-lg object-cover sm:h-14 sm:w-14 sm:rounded-xl"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base font-bold sm:h-14 sm:w-14 sm:rounded-xl sm:text-lg">
                          {profile.full_name?.charAt(0) || "A"}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-bold sm:text-base">
                          {profile.full_name || "Unnamed Athlete"}
                        </h2>

                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/60 sm:text-xs">
                          {profile.headline || "No headline added yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="min-w-0 rounded-lg bg-white/5 p-2.5">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-white/40 sm:text-[10px]">
                          Sport
                        </p>
                        <p className="mt-1 truncate text-xs font-semibold text-white/85">
                          {profile.primary_sport || "Not set"}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-lg bg-white/5 p-2.5">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-white/40 sm:text-[10px]">
                          Position
                        </p>
                        <p className="mt-1 truncate text-xs font-semibold text-white/85">
                          {profile.position || "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 rounded-lg bg-white/5 p-2.5">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-white/40 sm:text-[10px]">
                        Location
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-white/85">
                        {location}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#D8F200]">
                        View Profile
                      </span>
                      <span className="text-white/30 transition group-hover:translate-x-0.5">
                        →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
