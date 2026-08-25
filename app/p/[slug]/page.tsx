"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../../../components/Navbar";
import { BRAND } from "../../../lib/branding";
import { supabase } from "../../../lib/supabase";

type Profile = {
  id: string;
  email: string | null;
  role: string | null;
  full_name: string | null;
  preferred_name: string | null;
  public_slug: string | null;
  headline: string | null;
  bio: string | null;
  is_public: boolean | null;
  primary_sport: string | null;
  position: string | null;
  state: string | null;
  country: string | null;
  school_name: string | null;
  eligible_countries: string[];
  languages: string[];
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

type Measurement = {
  id: string;
  measurement_type: string;
  value: number;
  unit: string;
  recorded_at: string;
};

const AD_TYPES = [
  "Height",
  "Weight",
  "Wingspan",
  "Standing Reach",
  "Vertical Jump",
];

function getEmbedUrl(url: string, platform: string | null) {
  if (!url) return null;

  if (platform === "YouTube") {
    const youtubeMatch =
      url.match(/v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);

    const videoId = youtubeMatch?.[1];

    return videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : null;
  }

  if (platform === "Vimeo") {
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);

    const videoId = vimeoMatch?.[1];

    return videoId
      ? `https://player.vimeo.com/video/${videoId}`
      : null;
  }

  return null;
}

function daysSince(date: string) {
  const from = new Date(date);
  const to = new Date();

  return Math.max(
    0,
    Math.floor((to.getTime() - from.getTime()) / 86400000)
  );
}

function freshnessScore(days: number): number {
  if (days <= 30) return 100;
  if (days <= 60) return 80;
  if (days <= 90) return 60;
  if (days <= 120) return 40;
  if (days <= 180) return 20;

  return 0;
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
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

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

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            `
            id,
            email,
            role,
            full_name,
            preferred_name,
            public_slug,
            headline,
            bio,
            is_public,
            primary_sport,
            position,
            state,
            country,
            school_name,
            eligible_countries,
            languages,
            gender,
            age_group,
            height_cm,
            weight_kg,
            dominant_side,
            profile_photo_url,
            contact_email
          `
          )
          .eq("public_slug", slug)
          .eq("is_public", true)
          .single();

      if (profileError || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const loadedProfile: Profile = {
        ...profileData,
        eligible_countries: Array.isArray(
          profileData.eligible_countries
        )
          ? profileData.eligible_countries
          : [],
        languages: Array.isArray(profileData.languages)
          ? profileData.languages
          : [],
      };

      setProfile(loadedProfile);

      if (user && user.id === loadedProfile.id) {
        setIsOwner(true);
      }

      if (user && user.id !== loadedProfile.id) {
        const [{ data: followData }, { data: savedData }] =
          await Promise.all([
            supabase
              .from("follows")
              .select("id")
              .eq("follower_id", user.id)
              .eq("following_id", loadedProfile.id)
              .maybeSingle(),

            supabase
              .from("saved_players")
              .select("id")
              .eq("saver_id", user.id)
              .eq("saved_profile_id", loadedProfile.id)
              .maybeSingle(),
          ]);

        setIsFollowing(Boolean(followData));
        setIsSaved(Boolean(savedData));
      }

      const [
        achievementsRes,
        highlightsRes,
        experienceRes,
        measurementsRes,
      ] = await Promise.all([
        supabase
          .from("achievements")
          .select("*")
          .eq("profile_id", loadedProfile.id)
          .order("achievement_date", { ascending: false }),

        supabase
          .from("highlights")
          .select("*")
          .eq("profile_id", loadedProfile.id)
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
          .eq("profile_id", loadedProfile.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("athlete_measurements")
          .select(
            `
            id,
            measurement_type,
            value,
            unit,
            recorded_at
          `
          )
          .eq("athlete_profile_id", loadedProfile.id)
          .order("recorded_at", { ascending: false }),
      ]);

      if (achievementsRes.data) {
        setAchievements(achievementsRes.data);
      }

      if (highlightsRes.data) {
        setHighlights(highlightsRes.data);
      }

      if (experienceRes.data) {
        setExperience(
          experienceRes.data as unknown as TeamMembership[]
        );
      }

      if (measurementsRes.data) {
        setMeasurements(
          measurementsRes.data as Measurement[]
        );
      }

      setLoading(false);
    };

    void loadPublicProfile();
  }, [params]);

  const currentExperience = useMemo(
    () => experience.find((item) => item.is_current) || null,
    [experience]
  );

  const previousExperience = useMemo(
    () => experience.filter((item) => !item.is_current),
    [experience]
  );

  const latestByType = useMemo(() => {
    const map = new Map<string, Measurement>();

    for (const measurement of measurements) {
      if (!map.has(measurement.measurement_type)) {
        map.set(
          measurement.measurement_type,
          measurement
        );
      }
    }

    return map;
  }, [measurements]);

  const latestAdUpdate = useMemo(() => {
    if (measurements.length === 0) return null;

    return measurements.reduce((latest, item) =>
      new Date(item.recorded_at) >
      new Date(latest.recorded_at)
        ? item
        : latest
    );
  }, [measurements]);

  const adIndex = useMemo(() => {
    if (measurements.length === 0) return 0;

    const completedTypes =
      AD_TYPES.filter((type) =>
        latestByType.has(type)
      ).length;

    const completion =
      (completedTypes / AD_TYPES.length) * 100;

    const freshnessScores: number[] =
  AD_TYPES.map((type) => latestByType.get(type))
    .filter(Boolean)
    .map((measurement) =>
      freshnessScore(
        daysSince(
          (measurement as Measurement).recorded_at
        )
      )
    );

const freshness =
  freshnessScores.length > 0
    ? freshnessScores.reduce<number>(
        (sum, value) => sum + value,
        0
      ) / freshnessScores.length
    : 0;

    const recentRecords =
      measurements.filter(
        (measurement) =>
          daysSince(measurement.recorded_at) <= 180
      ).length;

    const consistency = Math.min(
      100,
      (recentRecords / 10) * 100
    );

    return Math.round(
      completion * 0.4 +
        freshness * 0.35 +
        consistency * 0.25
    );
  }, [latestByType, measurements]);

  const handleToggleFollow = async () => {
    if (!viewerId || !profile || isOwner) return;

    setFollowLoading(true);

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", viewerId)
        .eq("following_id", profile.id);

      if (!error) {
        setIsFollowing(false);
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({
          follower_id: viewerId,
          following_id: profile.id,
        });

      if (!error) {
        setIsFollowing(true);
      }
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

      if (!error) {
        setIsSaved(false);
      }
    } else {
      const { error } = await supabase
        .from("saved_players")
        .insert({
          saver_id: viewerId,
          saved_profile_id: profile.id,
        });

      if (!error) {
        setIsSaved(true);
      }
    }

    setSaveLoading(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B1F5C] text-white">
        <Navbar />

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-white/70">
            Loading athlete...
          </div>
        </section>
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="min-h-screen bg-[#0B1F5C] text-white">
        <Navbar />

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8">
            <h1 className="text-4xl font-extrabold">
              Athlete unavailable
            </h1>

            <p className="mt-4 text-white/70">
              This athlete profile is unavailable or not public.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const displayName =
    profile.preferred_name ||
    profile.full_name ||
    "Unnamed Athlete";

  const location =
    [profile.state, profile.country]
      .filter(Boolean)
      .join(", ");

  return (
    <main className="min-h-screen bg-[#0B1F5C] pb-12 text-white">
      <Navbar />

      <section className="relative">
        <div className="h-52 bg-[linear-gradient(135deg,#114DFF,#0B1F5C)] md:h-64" />

        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="-mt-14 rounded-3xl border border-white/10 bg-[#0B1F5C]/95 p-6 shadow-2xl backdrop-blur md:-mt-16 md:p-8">
            <div className="flex flex-col gap-7 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={profile.full_name || "Athlete"}
                    className="h-28 w-28 shrink-0 rounded-2xl object-cover ring-4 ring-[#0B1F5C]"
                  />
                ) : (
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-[#081642] text-4xl font-extrabold ring-4 ring-[#0B1F5C]">
                    {displayName.charAt(0)}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
                    RADR Athlete
                  </p>

                  <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">
                    {displayName}
                  </h1>

                  {profile.preferred_name &&
                    profile.full_name && (
                      <p className="mt-1 text-sm text-white/45">
                        {profile.full_name}
                      </p>
                    )}

                  <p className="mt-3 max-w-2xl text-lg text-white/75">
                    {profile.headline ||
                      "Athlete profile"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-sm text-white/65">
                    {profile.primary_sport && (
                      <span>
                        {profile.primary_sport}
                      </span>
                    )}

                    {profile.position && (
                      <span>• {profile.position}</span>
                    )}

                    {currentExperience?.teams
                      ?.display_name && (
                      <span>
                        •{" "}
                        {
                          currentExperience.teams
                            .display_name
                        }
                      </span>
                    )}

                    {location && (
                      <span>• {location}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:min-w-[220px]">
                {isOwner ? (
                  <Link
                    href="/dashboard/public-profile"
                    className="block rounded-xl bg-[#D8F200] px-5 py-3 text-center font-bold text-[#0B1F5C]"
                  >
                    Edit Athlete
                  </Link>
                ) : viewerId ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-3 text-sm font-semibold">
                      Interested in this athlete?
                    </p>

                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={handleToggleFollow}
                        disabled={followLoading}
                        className="rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
                      >
                        {followLoading
                          ? "Updating..."
                          : isFollowing
                            ? BRAND.followingLabel
                            : BRAND.followLabel}
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleSave}
                        disabled={saveLoading}
                        className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-semibold disabled:opacity-60"
                      >
                        {saveLoading
                          ? "Updating..."
                          : isSaved
                            ? BRAND.inWatchlistLabel
                            : BRAND.addToWatchlistLabel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login?message=login-required"
                    className="block rounded-xl bg-[#D8F200] px-5 py-3 text-center font-bold text-[#0B1F5C]"
                  >
                    Log in to Follow
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {profile.primary_sport && (
                <span className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold">
                  {profile.primary_sport}
                </span>
              )}

              {profile.position && (
                <span className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold">
                  {profile.position}
                </span>
              )}

              {currentExperience?.teams
                ?.display_name && (
                <span className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold">
                  {
                    currentExperience.teams
                      .display_name
                  }
                </span>
              )}

              {location && (
                <span className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold">
                  {location}
                </span>
              )}

              {profile.eligible_countries.map(
                (country) => (
                  <span
                    key={country}
                    className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold"
                  >
                    {country}
                  </span>
                )
              )}

              {profile.school_name && (
                <span className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold">
                  {profile.school_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                About
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Athlete Story
              </h2>

              <p className="mt-4 whitespace-pre-line leading-7 text-white/75">
                {profile.bio ||
                  "This athlete has not added a bio yet."}
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                    Highlights
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Game Footage
                  </h2>
                </div>

                {highlights.length > 0 && (
                  <span className="text-sm text-white/45">
                    {highlights.length}{" "}
                    {highlights.length === 1
                      ? "highlight"
                      : "highlights"}
                  </span>
                )}
              </div>

              {highlights.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-[#081642] p-6 text-white/60">
                  No highlights added yet.
                </div>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {highlights.map((highlight) => {
                    const embedUrl = getEmbedUrl(
                      highlight.video_url,
                      highlight.platform
                    );

                    return (
                      <div
                        key={highlight.id}
                        className="overflow-hidden rounded-2xl bg-[#081642]"
                      >
                        <div className="aspect-video bg-black">
                          {embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title={highlight.title}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center p-5 text-center text-sm text-white/60">
                              Preview unavailable
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <h3 className="font-bold">
                            {highlight.title}
                          </h3>

                          {highlight.description && (
                            <p className="mt-2 text-sm text-white/60">
                              {highlight.description}
                            </p>
                          )}

                          <a
                            href={highlight.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-block text-sm font-semibold text-[#D8F200]"
                          >
                            Open video →
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                Achievements
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Sporting Milestones
              </h2>

              {achievements.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-[#081642] p-6 text-white/60">
                  No achievements added yet.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {achievements.map(
                    (achievement) => (
                      <div
                        key={achievement.id}
                        className="rounded-2xl bg-[#081642] p-5"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-lg font-bold">
                              {achievement.title}
                            </h3>

                            <p className="mt-1 text-sm text-white/60">
                              {[
                                achievement.achievement_type,
                                achievement.organisation,
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          </div>

                          {achievement.achievement_date && (
                            <p className="text-sm text-white/45">
                              {
                                achievement.achievement_date
                              }
                            </p>
                          )}
                        </div>

                        {achievement.description && (
                          <p className="mt-3 text-sm leading-6 text-white/70">
                            {achievement.description}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            {previousExperience.length > 0 && (
              <section className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                  Experience
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Previous Teams
                </h2>

                <div className="mt-6 space-y-4">
                  {previousExperience.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-[#081642] p-5"
                    >
                      <h3 className="text-lg font-bold">
                        {item.teams.display_name}
                      </h3>

                      <p className="mt-1 text-sm text-white/65">
                        {[
                          item.teams.sport,
                          item.position,
                          item.teams.association_name,
                          item.teams.competition_name,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>

                      {(item.start_date ||
                        item.end_date) && (
                        <p className="mt-2 text-sm text-white/45">
                          {item.start_date ||
                            "Start date not set"}{" "}
                          –{" "}
                          {item.end_date ||
                            "Current"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            {currentExperience && (
              <section className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                  Current Team
                </p>

                <h2 className="mt-3 text-xl font-bold">
                  {
                    currentExperience.teams
                      .display_name
                  }
                </h2>

                <p className="mt-2 text-sm text-white/65">
                  {[
                    currentExperience.teams.sport,
                    currentExperience.position,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>

                <p className="mt-2 text-sm text-white/50">
                  {[
                    currentExperience.teams
                      .association_name,
                    currentExperience.teams
                      .competition_name,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </section>
            )}

            <section className="rounded-3xl border border-[#D8F200]/20 bg-[#D8F200]/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                Athlete Development
              </p>

              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-5xl font-extrabold">
                    {adIndex}
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    AD Index
                  </p>
                </div>

                <p className="text-right text-sm text-white/60">
                  {latestAdUpdate
                    ? daysSince(
                        latestAdUpdate.recorded_at
                      ) === 0
                      ? "Updated today"
                      : `Updated ${daysSince(
                          latestAdUpdate.recorded_at
                        )} days ago`
                    : "Not started"}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {AD_TYPES.map((type) => {
                  const measurement =
                    latestByType.get(type);

                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between rounded-xl bg-[#081642]/70 px-4 py-3"
                    >
                      <span className="text-sm text-white/65">
                        {type}
                      </span>

                      <span className="text-sm font-bold">
                        {measurement
                          ? `${measurement.value} ${measurement.unit}`
                          : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {isOwner && (
                <Link
                  href="/dashboard/development"
                  className="mt-5 block rounded-xl bg-[#D8F200] px-4 py-3 text-center text-sm font-bold text-[#0B1F5C]"
                >
                  Open Athlete Development
                </Link>
              )}
            </section>

            {(profile.gender ||
              profile.age_group ||
              profile.school_name ||
              profile.languages.length > 0 ||
              profile.dominant_side) && (
              <section className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Athlete Details
                </p>

                <div className="mt-5 space-y-4">
                  {profile.gender && (
                    <div>
                      <p className="text-xs text-white/45">
                        Gender
                      </p>
                      <p className="mt-1 font-semibold">
                        {profile.gender}
                      </p>
                    </div>
                  )}

                  {profile.age_group && (
                    <div>
                      <p className="text-xs text-white/45">
                        Age Group
                      </p>
                      <p className="mt-1 font-semibold">
                        {profile.age_group}
                      </p>
                    </div>
                  )}

                  {profile.school_name && (
                    <div>
                      <p className="text-xs text-white/45">
                        School / College
                      </p>
                      <p className="mt-1 font-semibold">
                        {profile.school_name}
                      </p>
                    </div>
                  )}

                  {profile.languages.length >
                    0 && (
                    <div>
                      <p className="text-xs text-white/45">
                        Languages
                      </p>
                      <p className="mt-1 font-semibold">
                        {profile.languages.join(
                          " • "
                        )}
                      </p>
                    </div>
                  )}

                  {profile.dominant_side && (
                    <div>
                      <p className="text-xs text-white/45">
                        Dominant Side
                      </p>
                      <p className="mt-1 font-semibold">
                        {
                          profile.dominant_side
                        }
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}