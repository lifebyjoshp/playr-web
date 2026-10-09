"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../../../components/Navbar";
import AthleteShareCard from "../../../components/AthleteShareCard";
import { BRAND } from "../../../lib/branding";
import { supabase } from "../../../lib/supabase";
import { getActiveAthleteContext } from "../../../lib/activeAthlete";

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
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_side: string | null;
  profile_photo_url: string | null;
  contact_email: string | null;
  guardian_required: boolean | null;
  is_founding_athlete: boolean | null;
  founding_athlete_number: number | null;
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
  membership_status: string;
  teams: {
    display_name: string;
    slug: string | null;
    sport: string;
    association_name: string | null;
    competition_name: string;
    season: string | null;
    season_start: string | null;
    season_end: string | null;
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
  const [activeAthleteId, setActiveAthleteId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [canManageWatchlist, setCanManageWatchlist] = useState(false);

  const [isSaved, setIsSaved] = useState(false);

  const [saveLoading, setSaveLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isParentManaged, setIsParentManaged] = useState(false);
  const [teamHistoryFilter, setTeamHistoryFilter] = useState("all");

  useEffect(() => {
    const loadPublicProfile = async () => {
      const { slug } = await params;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let activeAthleteContext = null;

      if (user) {
        setViewerId(user.id);

        try {
          activeAthleteContext = await getActiveAthleteContext();

          if (activeAthleteContext?.activeAthlete) {
            setActiveAthleteId(activeAthleteContext.activeAthlete.id);

            const canManage =
              activeAthleteContext.isSelfManaged ||
              Boolean(
                activeAthleteContext.activeGuardianPermissions?.canEditProfile
              );

            setCanManageWatchlist(canManage);
          }
        } catch (error) {
          console.error("Unable to load active athlete context:", error);
        }
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
            date_of_birth,
            height_cm,
            weight_kg,
            dominant_side,
            profile_photo_url,
            contact_email,
            guardian_required,
            is_founding_athlete,
            founding_athlete_number
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

      let parentManaged = Boolean(
        loadedProfile.guardian_required
      );

      const { data: guardianLink } = await supabase
        .from("guardian_links")
        .select("id")
        .eq("athlete_profile_id", loadedProfile.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (guardianLink) {
        parentManaged = true;
      }

      setIsParentManaged(parentManaged);

      const activeAthlete = activeAthleteContext?.activeAthlete || null;
      const ownsLoadedProfile = activeAthlete?.id === loadedProfile.id;

      setIsOwner(ownsLoadedProfile);

      if (activeAthlete && !ownsLoadedProfile) {
        const { data: savedData } = await supabase
          .from("saved_players")
          .select("id")
          .eq("saver_id", activeAthlete.id)
          .eq("saved_profile_id", loadedProfile.id)
          .maybeSingle();

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
            membership_status,
            teams (
              display_name,
              slug,
              sport,
              association_name,
              competition_name,
              season,
              season_start,
              season_end
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

  const today = new Date().toISOString().slice(0, 10);

  const currentExperience = useMemo(
    () =>
      experience.filter(
        (item) =>
          item.membership_status === "active" &&
          item.is_current &&
          (!item.teams.season_end || item.teams.season_end >= today)
      ),
    [experience, today]
  );

  const previousExperience = useMemo(
    () =>
      experience.filter(
        (item) =>
          !item.is_current ||
          Boolean(item.teams.season_end && item.teams.season_end < today)
      ),
    [experience, today]
  );

  const getMembershipYear = (item: TeamMembership) => {
    if (item.teams.season) {
      const match = item.teams.season.match(/\b(19|20)\d{2}\b/);
      if (match) return match[0];
    }
    const date =
      item.teams.season_start ||
      item.start_date ||
      item.teams.season_end ||
      item.end_date;
    return date?.slice(0, 4) || null;
  };

  const historyYears = useMemo(
    () =>
      Array.from(
        new Set(
          previousExperience
            .map((item) => getMembershipYear(item))
            .filter((year): year is string => Boolean(year))
        )
      ).sort((a, b) => Number(b) - Number(a)),
    [previousExperience]
  );

  const filteredPreviousExperience = useMemo(
    () =>
      teamHistoryFilter === "all"
        ? previousExperience
        : previousExperience.filter(
            (item) => getMembershipYear(item) === teamHistoryFilter
          ),
    [previousExperience, teamHistoryFilter]
  );

  const formatTeamDate = (value: string | null) => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return value;
    return new Intl.DateTimeFormat("en-AU", {
      month: "short",
      year: "numeric",
    }).format(new Date(year, month - 1, day));
  };

  const getTeamPeriod = (item: TeamMembership) => {
    const start = formatTeamDate(item.teams.season_start || item.start_date);
    const end = formatTeamDate(item.teams.season_end || item.end_date);
    if (start && end) return `${start} – ${end}`;
    if (start) return `${start} – Current`;
    if (end) return `Until ${end}`;
    return item.teams.season || null;
  };

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

  const handleToggleSave = async () => {
    if (
      !viewerId ||
      !activeAthleteId ||
      !profile ||
      isOwner ||
      !canManageWatchlist
    ) {
      return;
    }

    setSaveLoading(true);

    if (isSaved) {
      const { error } = await supabase
        .from("saved_players")
        .delete()
        .eq("saver_id", activeAthleteId)
        .eq("saved_profile_id", profile.id);

      if (!error) {
        setIsSaved(false);
      }
    } else {
      const { error } = await supabase
        .from("saved_players")
        .insert({
          saver_id: activeAthleteId,
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

  const birthYear =
    profile.date_of_birth &&
    /^\d{4}-\d{2}-\d{2}$/.test(profile.date_of_birth)
      ? profile.date_of_birth.slice(0, 4)
      : null;

  return (
    <main className="min-h-screen bg-[#0B1F5C] pb-20 text-white md:pb-12">
      <Navbar />

      <section className="relative">
        <div className="h-36 bg-[linear-gradient(135deg,#114DFF,#0B1F5C)] sm:h-44 md:h-64" />

        <div className="mx-auto max-w-6xl px-3 sm:px-4 md:px-6">
          <div className="-mt-10 rounded-2xl border border-white/10 bg-[#0B1F5C]/95 p-4 shadow-2xl backdrop-blur sm:-mt-12 sm:rounded-3xl sm:p-5 md:-mt-16 md:p-8">
            <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-start md:justify-between md:gap-7">
              <div className="flex flex-row items-start gap-3 sm:gap-5">
                {profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={profile.full_name || "Athlete"}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover ring-2 ring-[#0B1F5C] sm:h-20 sm:w-20 sm:rounded-2xl sm:ring-4 md:h-28 md:w-28"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#081642] text-2xl font-extrabold ring-2 ring-[#0B1F5C] sm:h-20 sm:w-20 sm:rounded-2xl sm:text-3xl sm:ring-4 md:h-28 md:w-28 md:text-4xl">
                    {displayName.charAt(0)}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
                      RADR Athlete
                    </p>

                    {isParentManaged && (
                      <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
                        Parent managed
                      </span>
                    )}
                  </div>

                  <h1 className="mt-1 text-2xl font-extrabold sm:mt-2 sm:text-3xl md:text-5xl">
                    {displayName}
                  </h1>

                  {profile.preferred_name &&
                    profile.full_name && (
                      <p className="mt-1 text-sm text-white/45">
                        {profile.full_name}
                      </p>
                    )}

                  <p className="mt-2 max-w-2xl text-sm leading-5 text-white/75 sm:text-base md:mt-3 md:text-lg">
                    {profile.headline ||
                      "Athlete profile"}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-white/65 sm:mt-3 sm:text-sm md:mt-4">
                    {profile.primary_sport && (
                      <span>
                        {profile.primary_sport}
                      </span>
                    )}

                    {profile.position && (
                      <span>• {profile.position}</span>
                    )}

                    {birthYear && (
                      <span>• Born {birthYear}</span>
                    )}

                    {currentExperience.length > 0 && (
                      <span>
                        • {currentExperience.length} Current{" "}
                        {currentExperience.length === 1 ? "Team" : "Teams"}
                      </span>
                    )}

                    {location && (
                      <span>• {location}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full md:min-w-[220px] md:w-auto">
                {isOwner ? (
                  <Link
                    href="/dashboard/public-profile"
                    className="block rounded-xl bg-[#D8F200] px-5 py-3 text-center font-bold text-[#0B1F5C]"
                  >
                    Edit Athlete
                  </Link>
                ) : viewerId && activeAthleteId ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:rounded-2xl sm:p-4">
                    <p className="mb-3 text-sm font-semibold">
                      Interested in this athlete?
                    </p>

                    <button
                      type="button"
                      onClick={handleToggleSave}
                      disabled={saveLoading || !canManageWatchlist}
                      className="w-full rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
                    >
                      {saveLoading
                        ? "Updating..."
                        : isSaved
                          ? BRAND.inWatchlistLabel
                          : BRAND.addToWatchlistLabel}
                    </button>

                    {!canManageWatchlist && (
                      <p className="mt-2 text-xs leading-5 text-white/50">
                        You can view this athlete, but your guardian permissions
                        do not allow changes to this athlete&apos;s Watchlist.
                      </p>
                    )}
                  </div>
                ) : viewerId ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/65 sm:rounded-2xl sm:p-4">
                    Select an athlete to use Watchlist.
                  </div>
                ) : (
                  <Link
                    href="/login?message=login-required"
                    className="block rounded-xl bg-[#D8F200] px-5 py-3 text-center font-bold text-[#0B1F5C]"
                  >
                    Log in to Add to Watchlist
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="mt-2 w-full rounded-xl border border-[#D8F200]/30 bg-[#D8F200]/10 px-5 py-3 text-sm font-bold text-[#D8F200] transition hover:bg-[#D8F200]/15"
                >
                  Share to Social
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2 md:mt-7">
              {profile.primary_sport && (
                <span className="rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:py-2 sm:text-sm">
                  {profile.primary_sport}
                </span>
              )}

              {profile.position && (
                <span className="rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:py-2 sm:text-sm">
                  {profile.position}
                </span>
              )}

              {currentExperience.length > 0 && (
                <span className="rounded-full border border-[#D8F200]/20 bg-[#D8F200]/10 px-2.5 py-1.5 text-xs font-semibold text-[#D8F200] sm:px-3 sm:py-2 sm:text-sm">
                  {currentExperience.length} Current{" "}
                  {currentExperience.length === 1 ? "Team" : "Teams"}
                </span>
              )}

              {location && (
                <span className="rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:py-2 sm:text-sm">
                  {location}
                </span>
              )}

              {profile.eligible_countries.map(
                (country) => (
                  <span
                    key={country}
                    className="rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:py-2 sm:text-sm"
                  >
                    {country}
                  </span>
                )
              )}

              {profile.school_name && (
                <span className="rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:py-2 sm:text-sm">
                  {profile.school_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-7 md:px-6 md:py-10">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)] lg:gap-8">
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            <section className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-5 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                About
              </p>

              <h2 className="mt-1 text-xl font-bold sm:mt-2 sm:text-2xl">
                Athlete Story
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/75 sm:mt-4 sm:text-base sm:leading-7">
                {profile.bio ||
                  "This athlete has not added a bio yet."}
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-5 md:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                    Highlights
                  </p>

                  <h2 className="mt-1 text-xl font-bold sm:mt-2 sm:text-2xl">
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
                <div className="mt-4 rounded-xl bg-[#081642] p-4 text-sm text-white/60 sm:mt-6 sm:rounded-2xl sm:p-6 sm:text-base">
                  No highlights added yet.
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-5 md:grid-cols-2">
                  {highlights.map((highlight) => {
                    const embedUrl = getEmbedUrl(
                      highlight.video_url,
                      highlight.platform
                    );

                    return (
                      <div
                        key={highlight.id}
                        className="overflow-hidden rounded-xl bg-[#081642] sm:rounded-2xl"
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

            <section className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-5 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                Achievements
              </p>

              <h2 className="mt-1 text-xl font-bold sm:mt-2 sm:text-2xl">
                Sporting Milestones
              </h2>

              {achievements.length === 0 ? (
                <div className="mt-4 rounded-xl bg-[#081642] p-4 text-sm text-white/60 sm:mt-6 sm:rounded-2xl sm:p-6 sm:text-base">
                  No achievements added yet.
                </div>
              ) : (
                <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
                  {achievements.map(
                    (achievement) => (
                      <div
                        key={achievement.id}
                        className="rounded-xl bg-[#081642] p-4 sm:rounded-2xl sm:p-5"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-base font-bold sm:text-lg">
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
                          <p className="mt-2 text-sm leading-5 text-white/70 sm:mt-3 sm:leading-6">
                            {achievement.description}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            {experience.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-5 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">Teams</p>
                    <h2 className="mt-1 text-xl font-bold sm:mt-2 sm:text-2xl">Teams &amp; History</h2>
                  </div>
                  {currentExperience.length > 0 && (
                    <span className="w-fit rounded-full bg-[#D8F200]/10 px-3 py-1.5 text-xs font-bold text-[#D8F200]">
                      {currentExperience.length} current
                    </span>
                  )}
                </div>

                {currentExperience.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Current Teams</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {currentExperience.map((item) => (
                        <div key={item.id} className="rounded-xl border border-[#D8F200]/15 bg-[#081642] p-4 sm:rounded-2xl sm:p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              {item.teams.slug ? (
                                <Link href={`/teams/${item.teams.slug}`} className="text-base font-bold transition hover:text-[#D8F200] sm:text-lg">
                                  {item.teams.display_name}
                                </Link>
                              ) : (
                                <h3 className="text-base font-bold sm:text-lg">{item.teams.display_name}</h3>
                              )}
                              <p className="mt-1 text-sm text-white/65">
                                {[item.teams.sport, item.position, item.teams.competition_name].filter(Boolean).join(" • ")}
                              </p>
                              {item.teams.association_name && (
                                <p className="mt-1 text-xs text-white/45">{item.teams.association_name}</p>
                              )}
                            </div>
                            <span className="shrink-0 rounded-full bg-[#D8F200]/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#D8F200]">Current</span>
                          </div>
                          {getTeamPeriod(item) && (
                            <p className="mt-3 text-xs font-semibold text-white/50">{getTeamPeriod(item)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previousExperience.length > 0 && (
                  <div className={currentExperience.length > 0 ? "mt-7 border-t border-white/10 pt-6" : "mt-5"}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Team History</p>
                        <p className="mt-1 text-sm text-white/55">Previous teams and seasons.</p>
                      </div>
                      {historyYears.length > 0 && (
                        <select
                          value={teamHistoryFilter}
                          onChange={(event) => setTeamHistoryFilter(event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-[#081642] px-3 py-2 text-sm font-semibold text-white sm:w-auto"
                        >
                          <option value="all">All history</option>
                          {historyYears.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="mt-4 space-y-3">
                      {filteredPreviousExperience.map((item) => (
                        <div key={item.id} className="rounded-xl bg-[#081642] p-4 sm:rounded-2xl sm:p-5">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              {item.teams.slug ? (
                                <Link href={`/teams/${item.teams.slug}`} className="text-base font-bold transition hover:text-[#D8F200] sm:text-lg">
                                  {item.teams.display_name}
                                </Link>
                              ) : (
                                <h3 className="text-base font-bold sm:text-lg">{item.teams.display_name}</h3>
                              )}
                              <p className="mt-1 text-sm text-white/65">
                                {[item.teams.sport, item.position, item.teams.association_name, item.teams.competition_name].filter(Boolean).join(" • ")}
                              </p>
                            </div>
                            {(getMembershipYear(item) || item.teams.season) && (
                              <span className="w-fit shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white/60">
                                {getMembershipYear(item) || item.teams.season}
                              </span>
                            )}
                          </div>
                          {getTeamPeriod(item) && (
                            <p className="mt-2 text-sm text-white/45">{getTeamPeriod(item)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

          </div>

          <aside className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:block lg:space-y-6">
            {currentExperience.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-5 lg:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">Current Teams</p>
                <div className="mt-4 space-y-3">
                  {currentExperience.map((item) => (
                    <div key={item.id} className="rounded-xl bg-[#081642] p-4">
                      {item.teams.slug ? (
                        <Link href={`/teams/${item.teams.slug}`} className="font-bold transition hover:text-[#D8F200]">
                          {item.teams.display_name}
                        </Link>
                      ) : (
                        <p className="font-bold">{item.teams.display_name}</p>
                      )}
                      <p className="mt-1 text-sm text-white/60">
                        {[item.teams.sport, item.position].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-[#D8F200]/20 bg-[#D8F200]/10 p-4 sm:rounded-3xl sm:p-5 lg:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                Athlete Development
              </p>

              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-extrabold sm:text-5xl">
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

              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:block sm:space-y-3">
                {AD_TYPES.map((type) => {
                  const measurement =
                    latestByType.get(type);

                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between rounded-lg bg-[#081642]/70 px-3 py-2 sm:rounded-xl sm:px-4 sm:py-3"
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
              birthYear ||
              profile.school_name ||
              profile.languages.length > 0 ||
              profile.dominant_side) && (
              <section className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-5 lg:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Athlete Details
                </p>

                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:mt-5 lg:block lg:space-y-4">
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

                  {birthYear && (
                    <div>
                      <p className="text-xs text-white/45">
                        Birth Year
                      </p>
                      <p className="mt-1 font-semibold">
                        {birthYear}
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

      {shareOpen && (
        <AthleteShareCard
          athleteName={displayName}
          profilePhotoUrl={profile.profile_photo_url}
          sport={profile.primary_sport}
          teamName={currentExperience[0]?.teams?.display_name || null}
          isFoundingAthlete={Boolean(profile.is_founding_athlete)}
          foundingAthleteNumber={profile.founding_athlete_number}
          profileUrl={
            typeof window !== "undefined"
              ? window.location.href
              : profile.public_slug
                ? `https://radr.au/p/${profile.public_slug}`
                : "https://radr.au"
          }
          onClose={() => setShareOpen(false)}
        />
      )}
    </main>
  );
}