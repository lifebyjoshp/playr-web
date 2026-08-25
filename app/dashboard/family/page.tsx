"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../../components/AppShell";
import { supabase } from "../../../lib/supabase";

type ProfileSummary = {
  id: string;
  full_name: string | null;
  preferred_name: string | null;
  public_slug: string | null;
  profile_photo_url: string | null;
  primary_sport: string | null;
  state: string | null;
  country: string | null;
  date_of_birth: string | null;
  age_group: string | null;
};

type GuardianLink = {
  id: string;
  athlete_profile_id: string;
  guardian_profile_id: string;
  relationship: string;
  status: string;
  can_edit_profile: boolean;
  can_manage_privacy: boolean;
  can_manage_teams: boolean;
  can_manage_metrics: boolean;
  requested_by: string | null;
  created_at: string;
  accepted_at: string | null;

  athlete:
    | ProfileSummary
    | ProfileSummary[]
    | null;
};

type Measurement = {
  id: string;
  athlete_profile_id: string;
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

function getProfile(
  value: ProfileSummary | ProfileSummary[] | null
): ProfileSummary | null {
  if (!value) return null;

  return Array.isArray(value)
    ? value[0] || null
    : value;
}

function displayName(profile: ProfileSummary | null) {
  if (!profile) return "Unnamed Athlete";

  return (
    profile.preferred_name ||
    profile.full_name ||
    "Unnamed Athlete"
  );
}

function calculateAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;

  const dob = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();

  let age =
    today.getFullYear() -
    dob.getFullYear();

  const monthDifference =
    today.getMonth() -
    dob.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() <
        dob.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function daysSince(date: string) {
  const from = new Date(date);
  const now = new Date();

  const difference =
    now.getTime() -
    from.getTime();

  return Math.max(
    0,
    Math.floor(
      difference / 86400000
    )
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

function getAdStatus(days: number | null) {
  if (days === null) {
    return {
      label: "AD not started",
      symbol: "○",
    };
  }

  if (days === 0) {
    return {
      label: "Updated today",
      symbol: "●",
    };
  }

  if (days <= 30) {
    return {
      label: `${days} days`,
      symbol: "●",
    };
  }

  if (days <= 45) {
    return {
      label: `${days} days`,
      symbol: "●",
    };
  }

  return {
    label: `${days} days`,
    symbol: "●",
  };
}

function calculateAdIndex(
  athleteMeasurements: Measurement[]
) {
  if (
    athleteMeasurements.length === 0
  ) {
    return 0;
  }

  const latestByType =
    new Map<string, Measurement>();

  for (const measurement of athleteMeasurements) {
    if (
      !latestByType.has(
        measurement.measurement_type
      )
    ) {
      latestByType.set(
        measurement.measurement_type,
        measurement
      );
    }
  }

  const completedTypes =
    AD_TYPES.filter((type) =>
      latestByType.has(type)
    ).length;

  const completion =
    (completedTypes /
      AD_TYPES.length) *
    100;

  const freshnessValues: number[] =
  AD_TYPES.map((type) =>
    latestByType.get(type)
  )
    .filter(
      (
        item
      ): item is Measurement =>
        Boolean(item)
    )
    .map((item) =>
      freshnessScore(
        daysSince(item.recorded_at)
      )
    );

const freshness =
  freshnessValues.length > 0
    ? freshnessValues.reduce<number>(
        (total, current) =>
          total + current,
        0
      ) /
      freshnessValues.length
    : 0;

  const recentRecords =
    athleteMeasurements.filter(
      (measurement) =>
        daysSince(
          measurement.recorded_at
        ) <= 180
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
}

export default function FamilyPage() {
  const [links, setLinks] =
    useState<GuardianLink[]>([]);

  const [
    measurements,
    setMeasurements,
  ] = useState<Measurement[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<
      "success" | "error" | "info"
    >("info");

  const loadFamily = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError || !user) {
      setMessageType("error");
      setMessage(
        "You must be logged in to view Family."
      );
      setLoading(false);
      return;
    }

    const {
      data: linkData,
      error: linkError,
    } = await supabase
      .from("guardian_links")
      .select(
        `
        id,
        athlete_profile_id,
        guardian_profile_id,
        relationship,
        status,
        can_edit_profile,
        can_manage_privacy,
        can_manage_teams,
        can_manage_metrics,
        requested_by,
        created_at,
        accepted_at,

        athlete:profiles!guardian_links_athlete_profile_id_fkey (
          id,
          full_name,
          preferred_name,
          public_slug,
          profile_photo_url,
          primary_sport,
          state,
          country,
          date_of_birth,
          age_group
        )
      `
      )
      .eq(
        "guardian_profile_id",
        user.id
      )
      .order("created_at", {
        ascending: false,
      });

    if (linkError) {
      setMessageType("error");
      setMessage(
        `Unable to load family: ${linkError.message}`
      );
      setLoading(false);
      return;
    }

    const loadedLinks =
      (linkData ||
        []) as unknown as GuardianLink[];

    setLinks(loadedLinks);

    const athleteIds =
      loadedLinks
        .filter(
          (link) =>
            link.status ===
            "active"
        )
        .map(
          (link) =>
            link.athlete_profile_id
        );

    if (
      athleteIds.length === 0
    ) {
      setMeasurements([]);
      setLoading(false);
      return;
    }

    const {
      data: measurementData,
      error: measurementError,
    } = await supabase
      .from(
        "athlete_measurements"
      )
      .select(
        `
        id,
        athlete_profile_id,
        measurement_type,
        value,
        unit,
        recorded_at
      `
      )
      .in(
        "athlete_profile_id",
        athleteIds
      )
      .order("recorded_at", {
        ascending: false,
      });

    if (measurementError) {
      setMessageType("error");
      setMessage(
        `Family loaded, but Athlete Development could not be loaded: ${measurementError.message}`
      );

      setMeasurements([]);
      setLoading(false);
      return;
    }

    setMeasurements(
      (measurementData ||
        []) as Measurement[]
    );

    setLoading(false);
  };

  useEffect(() => {
    void loadFamily();
  }, []);

  const activeAthletes =
    useMemo(
      () =>
        links.filter(
          (link) =>
            link.status ===
            "active"
        ),
      [links]
    );

  const pendingInvitations =
    useMemo(
      () =>
        links.filter(
          (link) =>
            link.status ===
            "pending"
        ),
      [links]
    );

  const athleteDevelopment =
    useMemo(() => {
      return activeAthletes.map(
        (link) => {
          const athleteMeasurements =
            measurements.filter(
              (measurement) =>
                measurement.athlete_profile_id ===
                link.athlete_profile_id
            );

          const latest =
            athleteMeasurements.length >
            0
              ? athleteMeasurements.reduce(
                  (
                    latestRecord,
                    currentRecord
                  ) =>
                    new Date(
                      currentRecord.recorded_at
                    ) >
                    new Date(
                      latestRecord.recorded_at
                    )
                      ? currentRecord
                      : latestRecord
                )
              : null;

          const days =
            latest
              ? daysSince(
                  latest.recorded_at
                )
              : null;

          return {
            athleteProfileId:
              link.athlete_profile_id,
            adIndex:
              calculateAdIndex(
                athleteMeasurements
              ),
            lastUpdatedDays:
              days,
            measurementCount:
              athleteMeasurements.length,
          };
        }
      );
    }, [
      activeAthletes,
      measurements,
    ]);

  const averageAdIndex =
    useMemo(() => {
      const started =
        athleteDevelopment.filter(
          (item) =>
            item.measurementCount >
            0
        );

      if (started.length === 0) {
        return 0;
      }

      const total =
        started.reduce(
          (sum, item) =>
            sum + item.adIndex,
          0
        );

      return Math.round(
        total / started.length
      );
    }, [athleteDevelopment]);

  const updatesDue =
    useMemo(() => {
      return athleteDevelopment.filter(
        (item) =>
          item.lastUpdatedDays ===
            null ||
          item.lastUpdatedDays > 30
      ).length;
    }, [athleteDevelopment]);

  if (loading) {
    return (
      <AppShell>
        <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-12">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-white/70">
            Loading Family Dashboard...
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-12">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
              Family
            </p>

            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
              Family Dashboard
            </h1>

            <p className="mt-3 max-w-3xl text-white/70">
              Manage athlete profiles,
              development and progress
              from one place.
            </p>
          </div>

          <Link
            href="/dashboard/family/new-athlete"
            className="rounded-xl bg-[#D8F200] px-5 py-3 text-center font-bold text-[#0B1F5C]"
          >
            + Create Athlete
          </Link>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-2xl p-4 text-sm font-medium ${
              messageType ===
              "success"
                ? "bg-green-500/20 text-green-100"
                : messageType ===
                    "error"
                  ? "bg-red-500/20 text-red-100"
                  : "bg-white/10 text-white/75"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Athletes
            </p>

            <p className="mt-3 text-4xl font-extrabold">
              {
                activeAthletes.length
              }
            </p>

            <p className="mt-2 text-sm text-white/55">
              Active family-managed
              athlete
              {activeAthletes.length ===
              1
                ? ""
                : "s"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D8F200]/20 bg-[#D8F200]/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D8F200]">
              Average AD
            </p>

            <p className="mt-3 text-4xl font-extrabold">
              {averageAdIndex}
            </p>

            <p className="mt-2 text-sm text-white/55">
              Family Athlete
              Development average
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Updates Due
            </p>

            <p className="mt-3 text-4xl font-extrabold">
              {updatesDue}
            </p>

            <p className="mt-2 text-sm text-white/55">
              AD record
              {updatesDue === 1
                ? ""
                : "s"}{" "}
              ready for an update
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Invitations
            </p>

            <p className="mt-3 text-4xl font-extrabold">
              {
                pendingInvitations.length
              }
            </p>

            <p className="mt-2 text-sm text-white/55">
              Pending family
              connection
              {pendingInvitations.length ===
              1
                ? ""
                : "s"}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            {activeAthletes.length ===
            0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur md:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                  Welcome to Family
                </p>

                <h2 className="mt-3 text-3xl font-extrabold">
                  Create your first
                  athlete
                </h2>

                <p className="mt-4 max-w-xl leading-7 text-white/65">
                  Build their athlete
                  profile, track Athlete
                  Development, manage
                  sporting information and
                  share their RADR as they
                  grow.
                </p>

                <Link
                  href="/dashboard/family/new-athlete"
                  className="mt-7 inline-block rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#0B1F5C]"
                >
                  Create Athlete
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {activeAthletes.map(
                  (link) => {
                    const athlete =
                      getProfile(
                        link.athlete
                      );

                    const age =
                      calculateAge(
                        athlete?.date_of_birth ||
                          null
                      );

                    const development =
                      athleteDevelopment.find(
                        (item) =>
                          item.athleteProfileId ===
                          link.athlete_profile_id
                      );

                    const adIndex =
                      development?.adIndex ??
                      0;

                    const days =
                      development?.lastUpdatedDays ??
                      null;

                    const adStatus =
                      getAdStatus(days);

                    const needsUpdate =
                      days === null ||
                      days > 30;

                    return (
                      <article
                        key={link.id}
                        className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur"
                      >
                        <div className="p-6">
                          <div className="flex items-start gap-4">
                            {athlete?.profile_photo_url ? (
                              <img
                                src={
                                  athlete.profile_photo_url
                                }
                                alt={
                                  athlete.full_name ||
                                  "Athlete"
                                }
                                className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#081642] text-2xl font-extrabold">
                                {displayName(
                                  athlete
                                ).charAt(
                                  0
                                )}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate text-xl font-bold">
                                {displayName(
                                  athlete
                                )}
                              </p>

                              {athlete?.full_name &&
                                athlete.preferred_name && (
                                  <p className="mt-1 truncate text-xs text-white/45">
                                    {
                                      athlete.full_name
                                    }
                                  </p>
                                )}

                              <p className="mt-2 text-sm text-white/65">
                                {[
                                  athlete?.primary_sport,
                                  athlete?.age_group,
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " • "
                                  ) ||
                                  "Athlete"}
                              </p>

                              <p className="mt-1 text-sm text-white/50">
                                {age !==
                                null
                                  ? `Age ${age}`
                                  : "Age not set"}

                                {[
                                  athlete?.state,
                                  athlete?.country,
                                ].some(
                                  Boolean
                                )
                                  ? ` • ${[
                                      athlete?.state,
                                      athlete?.country,
                                    ]
                                      .filter(
                                        Boolean
                                      )
                                      .join(
                                        ", "
                                      )}`
                                  : ""}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 rounded-2xl bg-[#081642] p-4">
                            <div className="flex items-end justify-between gap-4">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D8F200]">
                                  Athlete
                                  Development
                                </p>

                                <div className="mt-2 flex items-baseline gap-2">
                                  <p className="text-3xl font-extrabold">
                                    {
                                      adIndex
                                    }
                                  </p>

                                  <p className="text-xs text-white/45">
                                    AD Index
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p
                                  className={`text-xs font-semibold ${
                                    needsUpdate
                                      ? "text-[#D8F200]"
                                      : "text-white/60"
                                  }`}
                                >
                                  {
                                    adStatus.symbol
                                  }{" "}
                                  {
                                    adStatus.label
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-[#D8F200]"
                                style={{
                                  width: `${adIndex}%`,
                                }}
                              />
                            </div>
                          </div>

                          {needsUpdate && (
                            <div className="mt-4 rounded-xl border border-[#D8F200]/15 bg-[#D8F200]/10 px-4 py-3">
                              <p className="text-sm font-semibold text-[#D8F200]">
                                Don&apos;t
                                forget to
                                update{" "}
                                {displayName(
                                  athlete
                                )}
                                &apos;s AD.
                              </p>
                            </div>
                          )}

                          <div className="mt-5 grid gap-2">
                            {link.can_edit_profile && (
                              <Link
                                href={`/dashboard/family/${link.athlete_profile_id}/profile`}
                                className="rounded-xl bg-[#D8F200] px-4 py-3 text-center text-sm font-bold text-[#0B1F5C]"
                              >
                                Manage
                                Profile
                              </Link>
                            )}

                            {link.can_manage_metrics && (
                              <Link
                                href={`/dashboard/family/${link.athlete_profile_id}/development`}
                                className="rounded-xl border border-[#D8F200]/30 bg-[#D8F200]/10 px-4 py-3 text-center text-sm font-bold text-[#D8F200]"
                              >
                                Open AD
                              </Link>
                            )}

                            {athlete?.public_slug && (
                              <Link
                                href={`/p/${athlete.public_slug}`}
                                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-semibold transition hover:bg-white/15"
                              >
                                View Public
                                Profile
                              </Link>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-white/10 bg-[#081642]/50 px-6 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/35">
                            Family Access
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {link.can_edit_profile && (
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                                Profile
                              </span>
                            )}

                            {link.can_manage_teams && (
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                                Teams
                              </span>
                            )}

                            {link.can_manage_metrics && (
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                                AD
                              </span>
                            )}

                            {link.can_manage_privacy && (
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                                Privacy
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                Family Actions
              </p>

              <div className="mt-5 space-y-3">
                <Link
                  href="/dashboard/family/new-athlete"
                  className="block rounded-xl bg-[#D8F200] px-4 py-3 text-sm font-bold text-[#0B1F5C]"
                >
                  + Create Athlete
                </Link>

                <div className="rounded-xl border border-dashed border-white/15 px-4 py-4 text-sm text-white/55">
  Link Existing Athlete
  <div className="mt-1 text-xs text-white/40">
    Coming soon
  </div>
</div>
              </div>
            </section>

            {updatesDue > 0 && (
              <section className="rounded-3xl border border-[#D8F200]/20 bg-[#D8F200]/10 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                  AD Reminder
                </p>

                <p className="mt-3 text-3xl font-extrabold">
                  {updatesDue}
                </p>

                <p className="mt-2 text-sm leading-6 text-white/65">
                  {updatesDue === 1
                    ? "athlete has an AD update due."
                    : "athletes have AD updates due."}
                </p>
              </section>
            )}

            <section className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Family Tips
              </p>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-[#081642] p-4">
                  <p className="text-sm font-semibold">
                    Keep AD current
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/50">
                    A monthly update
                    helps build a useful
                    long-term development
                    record.
                  </p>
                </div>

                <div className="rounded-xl bg-[#081642] p-4">
                  <p className="text-sm font-semibold">
                    Capture milestones
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/50">
                    Add selections,
                    tournaments and
                    achievements while
                    they&apos;re fresh.
                  </p>
                </div>

                <div className="rounded-xl bg-[#081642] p-4">
                  <p className="text-sm font-semibold">
                    Keep highlights fresh
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/50">
                    Recent footage keeps
                    an athlete&apos;s RADR
                    current and useful.
                  </p>
                </div>
              </div>
            </section>

            {pendingInvitations.length >
              0 && (
              <section className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                  Invitations
                </p>

                <p className="mt-3 text-3xl font-extrabold">
                  {
                    pendingInvitations.length
                  }
                </p>

                <p className="mt-2 text-sm text-white/60">
                  Pending family
                  connection
                  {pendingInvitations.length ===
                  1
                    ? ""
                    : "s"}
                </p>
              </section>
            )}
          </aside>
        </div>
      </section>
    </AppShell>
  );
}