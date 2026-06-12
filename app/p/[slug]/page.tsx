"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

type Profile = {
  id: string;
  email: string | null;
  role: string | null;
  full_name: string | null;
  public_slug: string | null;
  headline: string | null;
  bio: string | null;
  is_public: boolean | null;
  primary_sport: string | null;
  position: string | null;
  state: string | null;
  country: string | null;
  gender: string | null;
  age_group: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_side: string | null;
  profile_photo_url: string | null;
  contact_email: string | null;
};

type Achievement = {
  id: string;
  title: string;
  achievement_type: string | null;
  organisation: string | null;
  description: string | null;
  achievement_date: string | null;
};

type Highlight = {
  id: string;
  title: string;
  video_url: string;
  platform: string | null;
  description: string | null;
};

type TeamMembership = {
  id: string;
  position: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  teams: {
    display_name: string;
    sport: string;
    association_name: string | null;
    competition_name: string;
  };
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

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [experience, setExperience] = useState<TeamMembership[]>([]);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [followLoading, setFollowLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const loadPublicProfile = async () => {
      const { slug } = await params;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setViewerId(user.id);
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, email, role, full_name, public_slug, headline, bio, is_public, primary_sport, position, state, country, gender, age_group, height_cm, weight_kg, dominant_side, profile_photo_url, contact_email"
        )
        .eq("public_slug", slug)
        .eq("is_public", true)
        .single();

      if (profileError || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      if (user && user.id === profileData.id) {
        setIsOwner(true);
      }

      if (user && user.id !== profileData.id) {
        const [{ data: followData }, { data: savedData }] = await Promise.all([
          supabase
            .from("follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", profileData.id)
            .maybeSingle(),

          supabase
            .from("saved_players")
            .select("id")
            .eq("saver_id", user.id)
            .eq("saved_profile_id", profileData.id)
            .maybeSingle(),
        ]);

        setIsFollowing(Boolean(followData));
        setIsSaved(Boolean(savedData));
      }

      const [achievementsRes, highlightsRes, experienceRes] =
        await Promise.all([
          supabase
            .from("achievements")
            .select("*")
            .eq("profile_id", profileData.id)
            .order("achievement_date", { ascending: false }),

          supabase
            .from("highlights")
            .select("*")
            .eq("profile_id", profileData.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("player_team_memberships")
            .select(
              `
              id,
              position,
              start_date,
              end_date,
              is_current,
              teams (
                display_name,
                sport,
                association_name,
                competition_name
              )
            `
            )
            .eq("profile_id", profileData.id)
            .order("created_at", { ascending: false }),
        ]);

      if (achievementsRes.data) setAchievements(achievementsRes.data);
      if (highlightsRes.data) setHighlights(highlightsRes.data);
      if (experienceRes.data)
        setExperience(experienceRes.data as TeamMembership[]);

      setLoading(false);
    };

    loadPublicProfile();
  }, [params]);

  const currentExperience = useMemo(
    () => experience.find((item) => item.is_current) || null,
    [experience]
  );

  const previousExperience = useMemo(
    () => experience.filter((item) => !item.is_current),
    [experience]
  );

  const handleToggleFollow = async () => {
    if (!viewerId || !profile || isOwner) return;

    setFollowLoading(true);

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", viewerId)
        .eq("following_id", profile.id);

      if (!error) setIsFollowing(false);
    } else {
      const { error } = await supabase.from("follows").insert({
        follower_id: viewerId,
        following_id: profile.id,
      });

      if (!error) setIsFollowing(true);
    }

    setFollowLoading(false);
  };

  const handleToggleSave = async () => {
    if (!viewerId || !profile || isOwner) return;

    setSaveLoading(true);

    if (isSaved) {
      const { error } = await supabase
        .from("saved_players")
        .delete()
        .eq("saver_id", viewerId)
        .eq("saved_profile_id", profile.id);

      if (!error) setIsSaved(false);
    } else {
      const { error } = await supabase.from("saved_players").insert({
        saver_id: viewerId,
        saved_profile_id: profile.id,
      });

      if (!error) setIsSaved(true);
    }

    setSaveLoading(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B1F5C] text-white">
        <Navbar />
        <section className="mx-auto max-w-6xl px-6 py-16">
          <p>Loading profile...</p>
        </section>
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="min-h-screen bg-[#0B1F5C] text-white">
        <Navbar />
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-4xl font-extrabold">Profile not found</h1>
          <p className="mt-4 text-white/70">
            This athlete profile is unavailable or not public.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <section className="relative">
        <div className="h-64 w-full bg-[linear-gradient(135deg,#114DFF,#0B1F5C)]" />

        <div className="mx-auto max-w-6xl px-6">
          <div className="-mt-16 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-6">
                {profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={profile.full_name || "Profile"}
                    className="h-28 w-28 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-[#081642] text-3xl font-bold">
                    {profile.full_name?.charAt(0) || "P"}
                  </div>
                )}

                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-[#D8F200]">
                    PLAYR Profile
                  </p>

                  <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
                    {profile.full_name || "Unnamed Athlete"}
                  </h1>

                  <p className="mt-3 text-lg text-white/75">
                    {profile.headline || "Athlete profile"}
                  </p>

                  <p className="mt-3 text-white/70">
                    {[profile.primary_sport, profile.position]
                      .filter(Boolean)
                      .join(" • ") || "Sport and position not set"}
                  </p>

                  {currentExperience?.teams?.display_name && (
                    <p className="mt-2 text-white/70">
                      Current Team • {currentExperience.teams.display_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {isOwner ? (
                  <Link
                    href="/dashboard/public-profile"
                    className="rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#0B1F5C]"
                  >
                    Edit Profile
                  </Link>
                ) : viewerId ? (
                  <>
                    <button
                      onClick={handleToggleFollow}
                      disabled={followLoading}
                      className="rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
                    >
                      {followLoading
                        ? "Updating..."
                        : isFollowing
                        ? "Following"
                        : "Follow PLAYR"}
                    </button>

                    <button
                      onClick={handleToggleSave}
                      disabled={saveLoading}
                      className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15 disabled:opacity-60"
                    >
                      {saveLoading
                        ? "Updating..."
                        : isSaved
                        ? "In Watchlist"
                        : "Add to Watchlist"}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login?message=login-required"
                    className="rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#0B1F5C]"
                  >
                    Log in to Follow
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-[#081642] p-4">
                <div className="text-xs uppercase text-white/60">Sport</div>
                <div className="mt-2 text-xl font-bold">
                  {profile.primary_sport || "Not set"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#081642] p-4">
                <div className="text-xs uppercase text-white/60">Position</div>
                <div className="mt-2 text-xl font-bold">
                  {profile.position || "Not set"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#081642] p-4">
                <div className="text-xs uppercase text-white/60">
                  Current Team
                </div>
                <div className="mt-2 text-base font-bold">
                  {currentExperience?.teams?.display_name || "Not set"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#081642] p-4">
                <div className="text-xs uppercase text-white/60">Location</div>
                <div className="mt-2 text-xl font-bold">
                  {[profile.state, profile.country].filter(Boolean).join(", ") ||
                    "Not set"}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-[#081642] p-4">
                <div className="text-xs uppercase text-white/60">Gender</div>
                <div className="mt-2 font-bold">
                  {profile.gender || "Not set"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#081642] p-4">
                <div className="text-xs uppercase text-white/60">
                  Age Group
                </div>
                <div className="mt-2 font-bold">
                  {profile.age_group || "Not set"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#081642] p-4">
                <div className="text-xs uppercase text-white/60">Height</div>
                <div className="mt-2 font-bold">
                  {profile.height_cm ? `${profile.height_cm} cm` : "Not set"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#081642] p-4">
                <div className="text-xs uppercase text-white/60">
                  Dominant Side
                </div>
                <div className="mt-2 font-bold">
                  {profile.dominant_side || "Not set"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
              <h2 className="mb-4 text-2xl font-bold">About</h2>
              <p className="text-white/75">
                {profile.bio || "No bio added yet."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
              <h2 className="mb-6 text-2xl font-bold">Current Team</h2>

              {currentExperience ? (
                <div className="rounded-2xl bg-[#081642] p-5">
                  <h3 className="text-xl font-bold">
                    {currentExperience.teams.display_name}
                  </h3>

                  <p className="mt-1 text-sm text-white/70">
                    {currentExperience.teams.sport} •{" "}
                    {currentExperience.position || "Position not set"}
                  </p>

                  <p className="mt-2 text-sm text-white/60">
                    {currentExperience.teams.association_name
                      ? `${currentExperience.teams.association_name} • `
                      : ""}
                    {currentExperience.teams.competition_name}
                  </p>

                  <p className="mt-2 text-sm text-white/60">
                    {currentExperience.start_date || "No start date"} – Current
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#081642] p-5 text-white/70">
                  No current team added yet.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
              <h2 className="mb-6 text-2xl font-bold">
                Previous Experience
              </h2>

              <div className="space-y-4">
                {previousExperience.length === 0 && (
                  <div className="rounded-2xl bg-[#081642] p-5 text-white/70">
                    No previous experience added yet.
                  </div>
                )}

                {previousExperience.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-[#081642] p-5">
                    <h3 className="text-xl font-bold">
                      {item.teams.display_name}
                    </h3>

                    <p className="mt-1 text-sm text-white/70">
                      {item.teams.sport} • {item.position || "Position not set"}
                    </p>

                    <p className="mt-2 text-sm text-white/60">
                      {item.teams.association_name
                        ? `${item.teams.association_name} • `
                        : ""}
                      {item.teams.competition_name}
                    </p>

                    <p className="mt-2 text-sm text-white/60">
                      {item.start_date || "No start date"} –{" "}
                      {item.end_date || "No end date"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
              <h2 className="mb-6 text-2xl font-bold">Achievements</h2>

              <div className="space-y-4">
                {achievements.length === 0 && (
                  <div className="rounded-2xl bg-[#081642] p-5 text-white/70">
                    No achievements added yet.
                  </div>
                )}

                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="rounded-2xl bg-[#081642] p-5"
                  >
                    <h3 className="text-xl font-bold">{achievement.title}</h3>

                    <p className="mt-1 text-sm text-white/70">
                      {achievement.achievement_type || "Achievement"}
                    </p>

                    {achievement.organisation && (
                      <p className="mt-2 text-sm text-white/60">
                        {achievement.organisation}
                      </p>
                    )}

                    {achievement.achievement_date && (
                      <p className="mt-2 text-sm text-white/60">
                        {achievement.achievement_date}
                      </p>
                    )}

                    {achievement.description && (
                      <p className="mt-3 text-sm text-white/75">
                        {achievement.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
            <h2 className="mb-6 text-2xl font-bold">Highlights</h2>

            <div className="space-y-6">
              {highlights.length === 0 && (
                <div className="rounded-2xl bg-[#081642] p-5 text-white/70">
                  No highlights added yet.
                </div>
              )}

              {highlights.map((highlight) => {
                const embedUrl = getEmbedUrl(
                  highlight.video_url,
                  highlight.platform
                );

                return (
                  <div
                    key={highlight.id}
                    className="rounded-2xl bg-[#081642] p-5"
                  >
                    <h3 className="text-xl font-bold">{highlight.title}</h3>

                    {highlight.platform && (
                      <p className="mt-1 text-sm text-white/70">
                        {highlight.platform}
                      </p>
                    )}

                    <div className="mt-4 overflow-hidden rounded-xl bg-black">
                      {embedUrl ? (
                        <iframe
                          src={embedUrl}
                          title={highlight.title}
                          className="h-56 w-full"
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
                      href={highlight.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-block text-sm font-semibold text-[#D8F200] underline"
                    >
                      Open video
                    </a>

                    {highlight.description && (
                      <p className="mt-3 text-sm text-white/75">
                        {highlight.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}