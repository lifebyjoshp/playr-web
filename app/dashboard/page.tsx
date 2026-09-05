"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import AppShell from "../../components/AppShell";

type Profile = {
  id: string;
  full_name: string | null;
  preferred_name: string | null;
  email: string | null;
  primary_sport: string | null;
  position: string | null;
  public_slug: string | null;
  headline: string | null;
  bio: string | null;
  state: string | null;
  country: string | null;
  profile_photo_url: string | null;
  school_name: string | null;
  eligible_countries: string[] | null;
  languages: string[] | null;
};

type Measurement = {
  id: string;
  measurement_type: string;
  value: number;
  unit: string;
  recorded_at: string;
};

type Opportunity = {
  title: string;
  description: string;
  points: number;
  href: string;
};

function daysSince(date: string) {
  const recorded = new Date(date);
  const now = new Date();

  const diff =
    now.getTime() - recorded.getTime();

  return Math.max(
    0,
    Math.floor(diff / 86400000)
  );
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

function getScoreStatus(score: number) {
  if (score >= 90) {
    return {
      label: "Recruiter Ready",
      stars: "★★★★★",
      description:
        "Your athlete profile is recruiter ready.",
    };
  }

  if (score >= 70) {
    return {
      label: "Strong",
      stars: "★★★★☆",
      description:
        "Your profile is looking strong. Keep building your athlete story.",
    };
  }

  if (score >= 40) {
    return {
      label: "Building",
      stars: "★★★☆☆",
      description:
        "You're building a solid athlete profile.",
    };
  }

  return {
    label: "Getting Started",
    stars: "★★☆☆☆",
    description:
      "Every update strengthens your athlete profile.",
  };
}

export default function DashboardPage() {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [measurements, setMeasurements] =
    useState<Measurement[]>([]);

  const [achievementCount, setAchievementCount] =
    useState(0);

  const [highlightCount, setHighlightCount] =
    useState(0);

  const [experienceCount, setExperienceCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage(
          "Could not load your RADR account."
        );
        setLoading(false);
        return;
      }

      const [
        profileResponse,
        measurementResponse,
        achievementResponse,
        highlightResponse,
        experienceResponse,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            `
            id,
            full_name,
            preferred_name,
            email,
            primary_sport,
            position,
            public_slug,
            headline,
            bio,
            state,
            country,
            profile_photo_url,
            school_name,
            eligible_countries,
            languages
          `
          )
          .eq("id", user.id)
          .single(),

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
          .eq(
            "athlete_profile_id",
            user.id
          )
          .order("recorded_at", {
            ascending: false,
          }),

        supabase
          .from("achievements")
          .select("id")
          .eq("profile_id", user.id),

        supabase
          .from("highlights")
          .select("id")
          .eq("profile_id", user.id),

        supabase
          .from("player_team_memberships")
          .select("id")
          .eq("profile_id", user.id),
      ]);

      if (
        profileResponse.error ||
        !profileResponse.data
      ) {
        setMessage(
          "Could not load profile data."
        );
        setLoading(false);
        return;
      }

      setProfile(
        profileResponse.data as Profile
      );

      setMeasurements(
        (measurementResponse.data ||
          []) as Measurement[]
      );

      setAchievementCount(
        achievementResponse.data?.length ||
          0
      );

      setHighlightCount(
        highlightResponse.data?.length ||
          0
      );

      setExperienceCount(
        experienceResponse.data?.length ||
          0
      );

      setLoading(false);
    };

    void loadDashboard();
  }, []);

  const latestMeasurement =
    useMemo(() => {
      if (measurements.length === 0) {
        return null;
      }

      return measurements.reduce(
        (latest, item) =>
          new Date(item.recorded_at) >
          new Date(latest.recorded_at)
            ? item
            : latest
      );
    }, [measurements]);

  const adDaysAgo =
    latestMeasurement
      ? daysSince(
          latestMeasurement.recorded_at
        )
      : null;

  const adStarted =
    measurements.length > 0;

  const adIndex = useMemo(() => {
    const trackedTypes = new Set(
      measurements.map(
        (item) =>
          item.measurement_type
      )
    ).size;

    const completion = Math.min(
      100,
      (trackedTypes / 5) * 100
    );

    let freshness = 0;

    if (adDaysAgo !== null) {
      if (adDaysAgo <= 30) {
        freshness = 100;
      } else if (adDaysAgo <= 60) {
        freshness = 80;
      } else if (adDaysAgo <= 90) {
        freshness = 60;
      } else if (adDaysAgo <= 120) {
        freshness = 40;
      } else {
        freshness = 20;
      }
    }

    const consistency = Math.min(
      100,
      (measurements.length / 10) * 100
    );

    return Math.round(
      completion * 0.4 +
        freshness * 0.35 +
        consistency * 0.25
    );
  }, [
    measurements,
    adDaysAgo,
  ]);

  const scoreItems = useMemo(() => {
    if (!profile) {
      return [];
    }

    const athleteBasicsComplete = Boolean(
      profile.full_name &&
        profile.primary_sport &&
        profile.position &&
        profile.state &&
        profile.country
    );

    const profileStoryComplete = Boolean(
      profile.headline &&
        profile.bio
    );

    return [
      {
        label: "Athlete details",
        points: 10,
        complete:
          athleteBasicsComplete,
        href: "/dashboard/public-profile",
      },
      {
        label: "Profile photo",
        points: 10,
        complete: Boolean(
          profile.profile_photo_url
        ),
        href: "/dashboard/public-profile",
      },
      {
        label: "Athlete story",
        points: 10,
        complete:
          profileStoryComplete,
        href: "/dashboard/public-profile",
      },
      {
        label: "Playing experience",
        points: 15,
        complete:
          experienceCount > 0,
        href: "/dashboard/experience",
      },
      {
        label: "Achievement",
        points: 15,
        complete:
          achievementCount > 0,
        href: "/dashboard/achievements",
      },
      {
        label: "Highlight",
        points: 15,
        complete:
          highlightCount > 0,
        href: "/dashboard/highlights",
      },
      {
        label: "Athlete Development",
        points: 20,
        complete: adStarted,
        href: "/dashboard/development",
      },
      {
        label: "Public profile",
        points: 5,
        complete: Boolean(
          profile.public_slug
        ),
        href: "/dashboard/public-profile",
      },
    ];
  }, [
    profile,
    experienceCount,
    achievementCount,
    highlightCount,
    adStarted,
  ]);

  const radrScore = useMemo(() => {
    return scoreItems.reduce(
      (total, item) =>
        total +
        (item.complete
          ? item.points
          : 0),
      0
    );
  }, [scoreItems]);

  const scoreStatus =
    getScoreStatus(radrScore);

  const nextOpportunities =
    useMemo<Opportunity[]>(() => {
      if (!profile) {
        return [];
      }

      const opportunities: Opportunity[] =
        [];

      if (!profile.profile_photo_url) {
        opportunities.push({
          title:
            "Add a profile photo",
          description:
            "Make your athlete profile instantly recognisable.",
          points: 10,
          href: "/dashboard/public-profile",
        });
      }

      if (
        !profile.headline ||
        !profile.bio
      ) {
        opportunities.push({
          title:
            "Tell your athlete story",
          description:
            "Add a headline and bio so people understand who you are.",
          points: 10,
          href: "/dashboard/public-profile",
        });
      }

      if (experienceCount === 0) {
        opportunities.push({
          title:
            "Add playing experience",
          description:
            "Build your sporting history with teams and competitions.",
          points: 15,
          href: "/dashboard/experience",
        });
      }

      if (achievementCount === 0) {
        opportunities.push({
          title:
            "Add an achievement",
          description:
            "Record selections, awards and sporting milestones.",
          points: 15,
          href: "/dashboard/achievements",
        });
      }

      if (highlightCount === 0) {
        opportunities.push({
          title:
            "Add your first highlight",
          description:
            "Show coaches and recruiters what you can do.",
          points: 15,
          href: "/dashboard/highlights",
        });
      }

      if (!adStarted) {
        opportunities.push({
          title:
            "Start your AD",
          description:
            "Create your Athlete Development record and start tracking progress.",
          points: 20,
          href: "/dashboard/development",
        });
      } else if (
        adDaysAgo !== null &&
        adDaysAgo > 30
      ) {
        opportunities.push({
          title:
            "Update your AD",
          description:
            `Your last AD update was ${adDaysAgo} days ago.`,
          points: 0,
          href: "/dashboard/development",
        });
      }

      if (!profile.public_slug) {
        opportunities.push({
          title:
            "Set your public profile",
          description:
            "Create a shareable RADR athlete link.",
          points: 5,
          href: "/dashboard/public-profile",
        });
      }

      return opportunities.slice(0, 3);
    }, [
      profile,
      experienceCount,
      achievementCount,
      highlightCount,
      adStarted,
      adDaysAgo,
    ]);

  if (loading) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-white/70">
            Loading your dashboard...
          </div>
        </section>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-red-100">
            {message ||
              "Unable to load your dashboard."}
          </div>
        </section>
      </AppShell>
    );
  }

  const displayName =
    profile.preferred_name ||
    profile.full_name ||
    "Athlete";

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
            Dashboard
          </p>

          <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
            {getGreeting()}, {displayName}
          </h1>

          <p className="mt-3 max-w-3xl text-white/70">
            Keep building your athlete
            story, track your development
            and strengthen your RADR.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-7">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                    RADR Score
                  </p>

                  <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2">
                    <p className="text-6xl font-extrabold">
                      {radrScore}
                    </p>

                    <div className="pb-1">
                      <p className="text-lg font-bold">
                        {scoreStatus.label}
                      </p>

                      <p className="mt-1 tracking-[0.12em] text-[#D8F200]">
                        {scoreStatus.stars}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">
                    {scoreStatus.description}
                  </p>
                </div>

                {profile.public_slug && (
                  <Link
                    href={`/p/${profile.public_slug}`}
                    className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-center text-sm font-semibold transition hover:bg-white/15"
                  >
                    View Public Profile
                  </Link>
                )}
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#D8F200] transition-all"
                  style={{
                    width: `${radrScore}%`,
                  }}
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {scoreItems.map(
                  (item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center justify-between gap-4 rounded-xl bg-[#081642] px-4 py-3 transition hover:bg-white/15"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                            item.complete
                              ? "bg-[#D8F200] text-[#0B1F5C]"
                              : "bg-white/10 text-white/50"
                          }`}
                        >
                          {item.complete
                            ? "✓"
                            : "○"}
                        </span>

                        <span
                          className={`text-sm font-semibold ${
                            item.complete
                              ? "text-white"
                              : "text-white/65"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>

                      <span className="shrink-0 text-xs font-bold text-[#D8F200]">
                        {item.points} pts
                      </span>
                    </Link>
                  )
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                  Next Opportunities
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Strengthen your RADR
                </h2>

                <p className="mt-2 text-sm text-white/60">
                  Small updates build a
                  stronger athlete story.
                </p>
              </div>

              {nextOpportunities.length >
              0 ? (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {nextOpportunities.map(
                    (opportunity) => (
                      <Link
                        key={
                          opportunity.title
                        }
                        href={
                          opportunity.href
                        }
                        className="rounded-2xl bg-[#081642] p-5 transition hover:bg-white/15"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold">
                            {
                              opportunity.title
                            }
                          </p>

                          {opportunity.points >
                            0 && (
                            <span className="shrink-0 rounded-full bg-[#D8F200]/10 px-2 py-1 text-xs font-bold text-[#D8F200]">
                              +
                              {
                                opportunity.points
                              }
                            </span>
                          )}
                        </div>

                        <p className="mt-3 text-sm leading-6 text-white/60">
                          {
                            opportunity.description
                          }
                        </p>

                        <p className="mt-4 text-sm font-semibold text-[#D8F200]">
                          {opportunity.points >
                          0
                            ? `+${opportunity.points} RADR Score`
                            : "Update now"}{" "}
                          →
                        </p>
                      </Link>
                    )
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-[#081642] p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D8F200] font-extrabold text-[#0B1F5C]">
                      ✓
                    </span>

                    <div>
                      <p className="font-bold">
                        Recruiter Ready
                      </p>

                      <p className="mt-1 text-sm text-white/60">
                        Your RADR is looking
                        strong. Keep it current
                        as your season
                        progresses.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section>
  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
    Continue Building
  </p>

  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <Link
      href="/dashboard/development"
      className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
    >
      <p className="text-lg font-bold">
        Update AD
      </p>

      <p className="mt-2 text-sm text-white/55">
        Track your development.
      </p>

      <p className="mt-5 text-sm font-semibold text-[#D8F200]">
        Open →
      </p>
    </Link>

    <Link
      href="/dashboard/achievements"
      className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
    >
      <p className="text-lg font-bold">
        Achievement
      </p>

      <p className="mt-2 text-sm text-white/55">
        Add a sporting milestone.
      </p>

      <p className="mt-5 text-sm font-semibold text-[#D8F200]">
        Open →
      </p>
    </Link>

    <Link
      href="/dashboard/highlights"
      className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
    >
      <p className="text-lg font-bold">
        Highlight
      </p>

      <p className="mt-2 text-sm text-white/55">
        Add your latest footage.
      </p>

      <p className="mt-5 text-sm font-semibold text-[#D8F200]">
        Open →
      </p>
    </Link>

    <Link
      href="/dashboard/teams"
      className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
    >
      <p className="text-lg font-bold">
        Teams
      </p>

      <p className="mt-2 text-sm text-white/55">
        Manage your teams.
      </p>

      <p className="mt-5 text-sm font-semibold text-[#D8F200]">
        Open →
      </p>
    </Link>
  </div>
</section>

<Link
  href="/dashboard/resume"
  className="group block rounded-3xl border border-[#D8F200]/25 bg-[#D8F200]/10 p-6 transition hover:bg-[#D8F200]/15 md:p-7"
>
  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
          RADR Resumé
        </p>

        <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">
          Coming Soon
        </span>
      </div>

      <h2 className="mt-4 text-2xl font-extrabold">
        Turn your RADR into your athlete resumé.
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
        Preview how your profile, experience,
        achievements, highlights and development
        will come together in one professional
        sporting resumé.
      </p>
    </div>

    <span className="shrink-0 rounded-xl bg-[#D8F200] px-5 py-3 text-sm font-extrabold text-[#0B1F5C] transition group-hover:scale-[1.02]">
      Preview →
    </span>
  </div>
</Link>

<section className="rounded-3xl border border-white/10 bg-[#081642] p-6 md:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                Keep Going
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                Your sporting journey is
                always moving.
              </h2>

              <p className="mt-3 max-w-3xl leading-7 text-white/65">
                Every achievement,
                highlight, team and AD
                update strengthens your
                athlete story and makes your
                hard work more visible.
              </p>
            </section>
          </div>

          <aside className="space-y-6">
            <Link
              href="/dashboard/development"
              className="block rounded-3xl border border-[#D8F200]/20 bg-[#D8F200]/10 p-7 transition hover:bg-[#D8F200]/15"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D8F200]">
                Athlete Development
              </p>

              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-6xl font-extrabold">
                    {adIndex}
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    AD Index
                  </p>

                  <p className="mt-1 text-xs text-white/50">
                    Development Score
                  </p>
                </div>

                <p className="text-right text-sm text-white/60">
                  {adDaysAgo === null
                    ? "Not started"
                    : adDaysAgo === 0
                      ? "Updated today"
                      : `Updated ${adDaysAgo} days ago`}
                </p>
              </div>

              <p className="mt-5 text-sm text-white/65">
                Don&apos;t forget to update
                your AD.
              </p>

              <p className="mt-5 text-sm font-semibold text-[#D8F200]">
                Open Athlete Development →
              </p>
            </Link>

            <section className="rounded-3xl border border-white/10 bg-white/10 p-7 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Profile
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs text-white/45">
                    Sport
                  </p>

                  <p className="mt-1 font-bold">
                    {profile.primary_sport ||
                      "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/45">
                    Position
                  </p>

                  <p className="mt-1 font-bold">
                    {profile.position ||
                      "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/45">
                    Location
                  </p>

                  <p className="mt-1 font-bold">
                    {[
                      profile.state,
                      profile.country,
                    ]
                      .filter(Boolean)
                      .join(", ") ||
                      "Not set"}
                  </p>
                </div>

                {profile.school_name && (
                  <div>
                    <p className="text-xs text-white/45">
                      School / College
                    </p>

                    <p className="mt-1 font-bold">
                      {
                        profile.school_name
                      }
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/10 p-7 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Career Summary
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <Link
                  href="/dashboard/experience"
                  className="rounded-xl bg-[#081642] p-4 transition hover:bg-white/15"
                >
                  <p className="text-2xl font-extrabold">
                    {experienceCount}
                  </p>

                  <p className="mt-1 text-xs text-white/50">
                    Experience
                  </p>
                </Link>

                <Link
                  href="/dashboard/achievements"
                  className="rounded-xl bg-[#081642] p-4 transition hover:bg-white/15"
                >
                  <p className="text-2xl font-extrabold">
                    {achievementCount}
                  </p>

                  <p className="mt-1 text-xs text-white/50">
                    Achievements
                  </p>
                </Link>

                <Link
                  href="/dashboard/highlights"
                  className="rounded-xl bg-[#081642] p-4 transition hover:bg-white/15"
                >
                  <p className="text-2xl font-extrabold">
                    {highlightCount}
                  </p>

                  <p className="mt-1 text-xs text-white/50">
                    Highlights
                  </p>
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}