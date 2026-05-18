"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  created_at: string | null;
  feed_sport?: string | null;
  feed_location?: string | null;
};

type Achievement = {
  id: string;
  profile_id: string;
  title: string;
  achievement_type: string | null;
  organisation: string | null;
  description: string | null;
  achievement_date: string | null;
  created_at?: string | null;
};

type Highlight = {
  id: string;
  profile_id: string;
  title: string;
  video_url: string;
  platform: string | null;
  description: string | null;
  created_at: string | null;
};

type FeedItem =
  | {
      id: string;
      type: "joined";
      created_at: string | null;
      profile: Profile;
    }
  | {
      id: string;
      type: "achievement";
      created_at: string | null;
      profile: Profile;
      achievement: Achievement;
    }
  | {
      id: string;
      type: "highlight";
      created_at: string | null;
      profile: Profile;
      highlight: Highlight;
    };

function getEmbedUrl(url: string, platform: string | null) {
  if (!url) return null;

  if (platform === "YouTube") {
    const youtubeMatch =
      url.match(/v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    const videoId = youtubeMatch?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (platform === "Vimeo") {
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    const videoId = vimeoMatch?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  return null;
}

function formatRelativeDate(dateString: string | null) {
  if (!dateString) return "Recently";

  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString();
}

export default function FeedPage() {
  const [viewerProfile, setViewerProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [sportFilter, setSportFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState("");

  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: me } = await supabase
          .from("profiles")
          .select(
            "id, full_name, public_slug, headline, primary_sport, position, state, country, profile_photo_url, created_at, feed_sport, feed_location"
          )
          .eq("id", user.id)
          .single();

        if (me) {
          setViewerProfile(me);
          setSportFilter(me.feed_sport || "");
          setLocationFilter(me.feed_location || "");
        }

        const { data: followsData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        const { data: watchlistData } = await supabase
          .from("saved_players")
          .select("saved_profile_id")
          .eq("saver_id", user.id);

        setFollowedIds(followsData?.map((item) => item.following_id) || []);
        setWatchlistIds(
          watchlistData?.map((item) => item.saved_profile_id) || []
        );
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select(
          "id, full_name, public_slug, headline, primary_sport, position, state, country, profile_photo_url, created_at"
        )
        .eq("is_public", true)
        .not("public_slug", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      const publicProfiles = profileData || [];
      setProfiles(publicProfiles);

      const profileIds = publicProfiles.map((p) => p.id);

      if (profileIds.length > 0) {
        const { data: achievementData } = await supabase
          .from("achievements")
          .select(
            "id, profile_id, title, achievement_type, organisation, description, achievement_date, created_at"
          )
          .in("profile_id", profileIds)
          .order("created_at", { ascending: false })
          .limit(50);

        const { data: highlightData } = await supabase
          .from("highlights")
          .select(
            "id, profile_id, title, video_url, platform, description, created_at"
          )
          .in("profile_id", profileIds)
          .order("created_at", { ascending: false })
          .limit(50);

        setAchievements(achievementData || []);
        setHighlights(highlightData || []);
      }

      setLoading(false);
    };

    loadFeed();
  }, []);

  const sports = Array.from(
    new Set(
      profiles
        .map((profile) => profile.primary_sport)
        .filter((value): value is string => Boolean(value))
    )
  ).sort();

  const getPriorityScore = (profileId: string) => {
    if (watchlistIds.includes(profileId)) return 2;
    if (followedIds.includes(profileId)) return 1;
    return 0;
  };

  const getPriorityLabel = (profileId: string) => {
    if (watchlistIds.includes(profileId)) return "Watchlist";
    if (followedIds.includes(profileId)) return "Following";
    return null;
  };

  const feedItems = useMemo(() => {
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    const joinedItems: FeedItem[] = profiles.map((profile) => ({
      id: `joined-${profile.id}`,
      type: "joined",
      created_at: profile.created_at,
      profile,
    }));

    const achievementItems: FeedItem[] = achievements
      .map((achievement) => {
        const profile = profileMap.get(achievement.profile_id);
        if (!profile) return null;

        return {
          id: `achievement-${achievement.id}`,
          type: "achievement",
          created_at: achievement.created_at || achievement.achievement_date,
          profile,
          achievement,
        } as FeedItem;
      })
      .filter(Boolean) as FeedItem[];

    const highlightItems: FeedItem[] = highlights
      .map((highlight) => {
        const profile = profileMap.get(highlight.profile_id);
        if (!profile) return null;

        return {
          id: `highlight-${highlight.id}`,
          type: "highlight",
          created_at: highlight.created_at,
          profile,
          highlight,
        } as FeedItem;
      })
      .filter(Boolean) as FeedItem[];

    return [...joinedItems, ...achievementItems, ...highlightItems]
      .filter((item) => {
        const matchesSport =
          sportFilter === "" || item.profile.primary_sport === sportFilter;

        const locationText =
          `${item.profile.state || ""} ${item.profile.country || ""}`.toLowerCase();

        const matchesLocation =
          locationFilter === "" ||
          locationText.includes(locationFilter.toLowerCase());

        return matchesSport && matchesLocation;
      })
      .sort((a, b) => {
        const priorityDiff =
          getPriorityScore(b.profile.id) - getPriorityScore(a.profile.id);

        if (priorityDiff !== 0) return priorityDiff;

        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;

        return bTime - aTime;
      });
  }, [
    profiles,
    achievements,
    highlights,
    sportFilter,
    locationFilter,
    followedIds,
    watchlistIds,
  ]);

  const handleSavePreferences = async () => {
    if (!viewerProfile) {
      setPreferenceMessage("Log in to save feed preferences.");
      return;
    }

    setSavingPreferences(true);
    setPreferenceMessage("Saving preferences...");

    const { error } = await supabase
      .from("profiles")
      .update({
        feed_sport: sportFilter || null,
        feed_location: locationFilter || null,
      })
      .eq("id", viewerProfile.id);

    if (error) {
      setPreferenceMessage(`Error: ${error.message}`);
    } else {
      setPreferenceMessage("Feed preferences saved.");
      setViewerProfile((prev) =>
        prev
          ? {
              ...prev,
              feed_sport: sportFilter || null,
              feed_location: locationFilter || null,
            }
          : prev
      );
    }

    setSavingPreferences(false);
  };

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <section className="mx-auto max-w-[1280px] px-4 py-8 md:px-6">
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
            Home
          </p>
          <h1 className="text-4xl font-extrabold md:text-5xl">
            Your PLAYR feed
          </h1>
          <p className="mt-3 max-w-3xl text-white/75">
            Watchlist and followed PLAYRs appear first, followed by broader
            activity from the PLAYR network.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,680px)_250px] lg:justify-center">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <h2 className="mb-4 text-lg font-bold">My PLAYR</h2>

              {viewerProfile ? (
                <div>
                  {viewerProfile.profile_photo_url ? (
                    <img
                      src={viewerProfile.profile_photo_url}
                      alt={viewerProfile.full_name || "Profile"}
                      className="mb-4 h-20 w-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#081642] text-2xl font-bold">
                      {viewerProfile.full_name?.charAt(0) || "P"}
                    </div>
                  )}

                  <div className="text-lg font-bold">
                    {viewerProfile.full_name || "Unnamed PLAYR"}
                  </div>

                  <div className="mt-2 text-sm text-white/70">
                    {viewerProfile.headline || "No headline yet"}
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-white/70">
                    <p>
                      {[viewerProfile.primary_sport, viewerProfile.position]
                        .filter(Boolean)
                        .join(" • ") || "Sport and position not set"}
                    </p>
                    <p>
                      {[viewerProfile.state, viewerProfile.country]
                        .filter(Boolean)
                        .join(", ") || "Location not set"}
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    <Link
                      href="/dashboard"
                      className="block rounded-xl bg-[#D8F200] px-4 py-2 text-center text-sm font-bold text-[#0B1F5C]"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/public-profile"
                      className="block rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      Edit Profile
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/70">
                  Log in to personalise your feed.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <h2 className="mb-4 text-lg font-bold">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/dashboard/experience"
                  className="block rounded-xl bg-[#081642] px-4 py-3 text-sm font-medium"
                >
                  Add Experience
                </Link>
                <Link
                  href="/dashboard/achievements"
                  className="block rounded-xl bg-[#081642] px-4 py-3 text-sm font-medium"
                >
                  Add Achievement
                </Link>
                <Link
                  href="/dashboard/highlights"
                  className="block rounded-xl bg-[#081642] px-4 py-3 text-sm font-medium"
                >
                  Add Highlight
                </Link>
                <Link
                  href="/watchlist"
                  className="block rounded-xl bg-[#081642] px-4 py-3 text-sm font-medium"
                >
                  Watchlist
                </Link>
              </div>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">For You</h2>
                  <p className="mt-1 text-sm text-white/70">
                    Watchlist first, followed PLAYRs second, then general
                    activity.
                  </p>
                </div>

                <Link
                  href="/explore"
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Explore
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-white/70 backdrop-blur">
                Loading feed...
              </div>
            ) : (
              <div className="space-y-5">
                {feedItems.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-white/70 backdrop-blur">
                    No feed activity yet for these filters.
                  </div>
                )}

                {feedItems.map((item) => {
                  const priorityLabel = getPriorityLabel(item.profile.id);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          {item.profile.profile_photo_url ? (
                            <img
                              src={item.profile.profile_photo_url}
                              alt={item.profile.full_name || "Profile"}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#081642] font-bold">
                              {item.profile.full_name?.charAt(0) || "P"}
                            </div>
                          )}

                          <div>
                            <Link
                              href={`/p/${item.profile.public_slug}`}
                              className="font-bold hover:underline"
                            >
                              {item.profile.full_name || "Unnamed PLAYR"}
                            </Link>

                            <p className="text-sm text-white/65">
                              {formatRelativeDate(item.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {priorityLabel && (
                            <div className="rounded-full border border-[#D8F200]/40 bg-[#D8F200]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                              {priorityLabel}
                            </div>
                          )}

                          <div className="rounded-full bg-[#D8F200] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0B1F5C]">
                            {item.type === "joined"
                              ? "Joined"
                              : item.type === "achievement"
                              ? "Achievement"
                              : "Highlight"}
                          </div>
                        </div>
                      </div>

                      {item.type === "joined" && (
                        <div>
                          <p className="text-white/80">
                            Joined PLAYR and is now discoverable to the
                            community.
                          </p>

                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-[#081642] p-4">
                              <div className="text-xs uppercase text-white/60">
                                Sport
                              </div>
                              <div className="mt-2 text-sm font-bold">
                                {item.profile.primary_sport || "Not set"}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-[#081642] p-4">
                              <div className="text-xs uppercase text-white/60">
                                Position
                              </div>
                              <div className="mt-2 text-sm font-bold">
                                {item.profile.position || "Not set"}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-[#081642] p-4">
                              <div className="text-xs uppercase text-white/60">
                                Location
                              </div>
                              <div className="mt-2 text-sm font-bold">
                                {[item.profile.state, item.profile.country]
                                  .filter(Boolean)
                                  .join(", ") || "Not set"}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {item.type === "achievement" && (
                        <div>
                          <p className="text-white/80">
                            Added a new achievement:
                            <span className="ml-1 font-bold">
                              {item.achievement.title}
                            </span>
                          </p>

                          <div className="mt-4 rounded-2xl bg-[#081642] p-4">
                            <div className="text-lg font-bold">
                              {item.achievement.title}
                            </div>

                            <div className="mt-2 text-sm text-white/70">
                              {item.achievement.achievement_type ||
                                "Achievement"}
                            </div>

                            {item.achievement.organisation && (
                              <div className="mt-2 text-sm text-white/60">
                                {item.achievement.organisation}
                              </div>
                            )}

                            {item.achievement.description && (
                              <div className="mt-3 text-sm text-white/75">
                                {item.achievement.description}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {item.type === "highlight" && (
                        <div>
                          <p className="text-white/80">
                            Added a new highlight:
                            <span className="ml-1 font-bold">
                              {item.highlight.title}
                            </span>
                          </p>

                          <div className="mt-4 rounded-2xl bg-[#081642] p-4">
                            <div className="text-lg font-bold">
                              {item.highlight.title}
                            </div>

                            {item.highlight.platform && (
                              <div className="mt-2 text-sm text-white/70">
                                {item.highlight.platform}
                              </div>
                            )}

                            <div className="mt-4 overflow-hidden rounded-xl bg-black">
                              {getEmbedUrl(
                                item.highlight.video_url,
                                item.highlight.platform
                              ) ? (
                                <iframe
                                  src={
                                    getEmbedUrl(
                                      item.highlight.video_url,
                                      item.highlight.platform
                                    )!
                                  }
                                  title={item.highlight.title}
                                  className="h-64 w-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <div className="flex h-40 items-center justify-center p-4 text-center text-sm text-white/70">
                                  Preview not available for this platform.
                                </div>
                              )}
                            </div>

                            <a
                              href={item.highlight.video_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 inline-block text-sm font-semibold text-[#D8F200] underline"
                            >
                              Open video
                            </a>

                            {item.highlight.description && (
                              <div className="mt-3 text-sm text-white/75">
                                {item.highlight.description}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-5">
                        <Link
                          href={`/p/${item.profile.public_slug}`}
                          className="text-sm font-semibold text-[#D8F200]"
                        >
                          View full profile →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <h2 className="mb-4 text-lg font-bold">Feed Filters</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Sport</label>
                  <select
                    value={sportFilter}
                    onChange={(e) => setSportFilter(e.target.value)}
                    className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
                  >
                    <option value="">All Sports</option>
                    {sports.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Location
                  </label>
                  <input
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="e.g. NSW or Australia"
                    className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  onClick={handleSavePreferences}
                  disabled={savingPreferences}
                  className="w-full rounded-xl bg-[#D8F200] px-4 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
                >
                  {savingPreferences ? "Saving..." : "Save Preferences"}
                </button>

                <button
                  onClick={() => {
                    setSportFilter("");
                    setLocationFilter("");
                    setPreferenceMessage("");
                  }}
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/15"
                >
                  Clear Filters
                </button>
              </div>

              {preferenceMessage && (
                <p className="mt-3 text-sm text-white/70">{preferenceMessage}</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <h2 className="mb-4 text-lg font-bold">Feed Priority</h2>
              <div className="space-y-2 text-sm text-white/75">
                <p>1. Watchlist PLAYRs</p>
                <p>2. Followed PLAYRs</p>
                <p>3. General activity</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <h2 className="mb-4 text-lg font-bold">Saved Preferences</h2>
              <div className="space-y-2 text-sm text-white/75">
                <p>
                  <span className="font-semibold text-white">Sport:</span>{" "}
                  {viewerProfile?.feed_sport || "All Sports"}
                </p>
                <p>
                  <span className="font-semibold text-white">Location:</span>{" "}
                  {viewerProfile?.feed_location || "All Locations"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}