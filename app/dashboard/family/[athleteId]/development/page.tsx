"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../../../../components/AppShell";
import { supabase } from "../../../../../lib/supabase";

type MeasurementType =
  | "Height"
  | "Weight"
  | "Wingspan"
  | "Standing Reach"
  | "Vertical Jump";

type Measurement = {
  id: string;
  athlete_profile_id: string;
  measurement_type: MeasurementType;
  value: number;
  unit: string;
  recorded_at: string;
  recorded_by: string | null;
  notes: string | null;
  verification_status: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  preferred_name: string | null;
  date_of_birth: string | null;
  primary_sport: string | null;
};

type GuardianLink = {
  id: string;
  athlete_profile_id: string;
  guardian_profile_id: string;
  status: string;
  can_manage_metrics: boolean;
};

const MEASUREMENT_TYPES: {
  type: MeasurementType;
  unit: string;
}[] = [
  { type: "Height", unit: "cm" },
  { type: "Weight", unit: "kg" },
  { type: "Wingspan", unit: "cm" },
  { type: "Standing Reach", unit: "cm" },
  { type: "Vertical Jump", unit: "cm" },
];

type UpdateValues = Record<MeasurementType, string>;

const EMPTY_VALUES: UpdateValues = {
  Height: "",
  Weight: "",
  Wingspan: "",
  "Standing Reach": "",
  "Vertical Jump": "",
};

function calendarDaysBetween(
  from: string | Date,
  to: string | Date
) {
  const start = new Date(from);
  const end = new Date(to);

  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );

  const endUtc = Date.UTC(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );

  return Math.max(
    0,
    Math.floor((endUtc - startUtc) / 86400000)
  );
}

function ageAtDate(
  dateOfBirth: string | null,
  date: string
) {
  if (!dateOfBirth) return "Age unavailable";

  const dob = new Date(`${dateOfBirth}T00:00:00`);
  const target = new Date(date);

  let years =
    target.getFullYear() - dob.getFullYear();

  let months =
    target.getMonth() - dob.getMonth();

  let days =
    target.getDate() - dob.getDate();

  if (days < 0) {
    const previousMonth = new Date(
      target.getFullYear(),
      target.getMonth(),
      0
    );

    days += previousMonth.getDate();
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return `${years}y ${months}m ${days}d`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function percentageChange(
  previous: number | undefined,
  current: number | undefined
) {
  if (
    previous === undefined ||
    current === undefined ||
    previous === 0
  ) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

function freshnessScore(days: number): number {
  if (days <= 30) return 100;
  if (days <= 60) return 80;
  if (days <= 90) return 60;
  if (days <= 120) return 40;
  if (days <= 180) return 20;

  return 0;
}

function changeLabel(value: number | null) {
  if (value === null) return "No comparison yet";

  if (value > 0) {
    return `↑ ${value.toFixed(1)}%`;
  }

  if (value < 0) {
    return `↓ ${Math.abs(value).toFixed(1)}%`;
  }

  return "No change";
}

function rawChangeLabel(
  previous: Measurement | null,
  current: Measurement | null
) {
  if (!previous || !current) {
    return "No comparison yet";
  }

  const change =
    Number(current.value) - Number(previous.value);

  if (change > 0) {
    return `+${change.toFixed(1)} ${current.unit}`;
  }

  if (change < 0) {
    return `${change.toFixed(1)} ${current.unit}`;
  }

  return `0 ${current.unit}`;
}

export default function FamilyDevelopmentPage() {
  const params =
    useParams<{ athleteId: string }>();

  const athleteId = params.athleteId;

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [guardianLink, setGuardianLink] =
    useState<GuardianLink | null>(null);

  const [measurements, setMeasurements] =
    useState<Measurement[]>([]);

  const [selectedType, setSelectedType] =
    useState<MeasurementType>("Height");

  const [updateValues, setUpdateValues] =
    useState<UpdateValues>(EMPTY_VALUES);

  const [recordedDate, setRecordedDate] =
    useState(
      new Date().toISOString().slice(0, 10)
    );

  const [notes, setNotes] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<
      "success" | "error" | "info"
    >("info");

  const loadDevelopment = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessageType("error");
      setMessage("You must be logged in.");
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
        status,
        can_manage_metrics
      `
      )
      .eq("athlete_profile_id", athleteId)
      .eq("guardian_profile_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (linkError || !linkData) {
      setMessageType("error");
      setMessage(
        "You do not have active family access to this athlete."
      );
      setLoading(false);
      return;
    }

    const loadedLink =
      linkData as GuardianLink;

    setGuardianLink(loadedLink);

    if (!loadedLink.can_manage_metrics) {
      setMessageType("error");
      setMessage(
        "Your family permissions do not allow AD management."
      );
      setLoading(false);
      return;
    }

    const [
      profileResponse,
      measurementResponse,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          preferred_name,
          date_of_birth,
          primary_sport
        `
        )
        .eq("id", athleteId)
        .single(),

      supabase
        .from("athlete_measurements")
        .select("*")
        .eq(
          "athlete_profile_id",
          athleteId
        )
        .order("recorded_at", {
          ascending: false,
        }),
    ]);

    if (
      profileResponse.error ||
      !profileResponse.data
    ) {
      setMessageType("error");
      setMessage(
        `Unable to load athlete: ${
          profileResponse.error?.message ||
          "Athlete not found."
        }`
      );
      setLoading(false);
      return;
    }

    setProfile(
      profileResponse.data as Profile
    );

    if (measurementResponse.error) {
      setMessageType("error");
      setMessage(
        `Unable to load AD: ${measurementResponse.error.message}`
      );
      setLoading(false);
      return;
    }

    setMeasurements(
      (measurementResponse.data ||
        []) as Measurement[]
    );

    setLoading(false);
  };

  useEffect(() => {
    if (athleteId) {
      void loadDevelopment();
    }
  }, [athleteId]);

  const groupedMeasurements = useMemo(() => {
    const groups = new Map<
      MeasurementType,
      Measurement[]
    >();

    for (const item of MEASUREMENT_TYPES) {
      groups.set(
        item.type,
        measurements
          .filter(
            (measurement) =>
              measurement.measurement_type ===
              item.type
          )
          .sort(
            (a, b) =>
              new Date(
                b.recorded_at
              ).getTime() -
              new Date(
                a.recorded_at
              ).getTime()
          )
      );
    }

    return groups;
  }, [measurements]);

  const latestMeasurements = useMemo(
    () =>
      MEASUREMENT_TYPES.map((item) => {
        const history =
          groupedMeasurements.get(
            item.type
          ) || [];

        const latest =
          history[0] || null;

        const previous =
          history[1] || null;

        const first =
          history.length > 0
            ? history[
                history.length - 1
              ]
            : null;

        return {
          ...item,
          history,
          latest,
          previous,
          first,
        };
      }),
    [groupedMeasurements]
  );

  const adIndex = useMemo(() => {
    const completed =
      latestMeasurements.filter(
        (item) => item.latest
      ).length;

    const completion =
      (completed /
        MEASUREMENT_TYPES.length) *
      100;

    const freshnessValues: number[] =
  latestMeasurements
    .filter(
      (item) => item.latest
    )
    .map((item) =>
      freshnessScore(
        calendarDaysBetween(
          item.latest!.recorded_at,
          new Date()
        )
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

    const updatesLast180Days =
      measurements.filter(
        (measurement) =>
          calendarDaysBetween(
            measurement.recorded_at,
            new Date()
          ) <= 180
      ).length;

    const consistency = Math.min(
      100,
      (updatesLast180Days / 10) *
        100
    );

    return Math.round(
      completion * 0.4 +
        freshness * 0.35 +
        consistency * 0.25
    );
  }, [
    latestMeasurements,
    measurements,
  ]);

  const lastAdUpdate = useMemo(() => {
    if (measurements.length === 0) {
      return null;
    }

    return measurements.reduce(
      (latest, measurement) =>
        new Date(
          measurement.recorded_at
        ) >
        new Date(
          latest.recorded_at
        )
          ? measurement
          : latest
    );
  }, [measurements]);

  const handleSaveUpdate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !guardianLink?.can_manage_metrics
    ) {
      setMessageType("error");
      setMessage(
        "You do not have permission to update this athlete's AD."
      );
      return;
    }

    const entries =
      MEASUREMENT_TYPES.flatMap(
        (item) => {
          const raw =
            updateValues[item.type].trim();

          if (!raw) {
            return [];
          }

          const numericValue =
            Number(raw);

          if (
            !Number.isFinite(
              numericValue
            ) ||
            numericValue <= 0
          ) {
            return [];
          }

          return [
            {
              type: item.type,
              unit: item.unit,
              value: numericValue,
            },
          ];
        }
      );

    if (entries.length === 0) {
      setMessageType("error");
      setMessage(
        "Enter at least one valid measurement."
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessageType("error");
      setMessage(
        "You must be logged in."
      );
      return;
    }

    setSaving(true);
    setMessageType("info");
    setMessage(
      "Updating Athlete Development..."
    );

    const rows = entries.map(
      (entry) => ({
        athlete_profile_id:
          athleteId,

        measurement_type:
          entry.type,

        value: entry.value,

        unit: entry.unit,

        recorded_at:
          `${recordedDate}T12:00:00`,

        recorded_by: user.id,

        notes:
          notes.trim() || null,

        verification_status:
          "family_reported",
      })
    );

    const { error } = await supabase
      .from(
        "athlete_measurements"
      )
      .insert(rows);

    if (error) {
      setMessageType("error");
      setMessage(
        `Unable to update AD: ${error.message}`
      );
      setSaving(false);
      return;
    }

    setUpdateValues({
      ...EMPTY_VALUES,
    });

    setNotes("");

    setMessageType("success");
    setMessage(
      `${entries.length} AD measurement${
        entries.length === 1
          ? ""
          : "s"
      } saved successfully.`
    );

    await loadDevelopment();

    setSaving(false);
  };

  if (loading) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-6 py-12">
          Loading Athlete
          Development...
        </section>
      </AppShell>
    );
  }

  if (
    !profile ||
    !guardianLink?.can_manage_metrics
  ) {
    return (
      <AppShell>
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-red-100">
            <h1 className="text-2xl font-bold">
              AD access unavailable
            </h1>

            <p className="mt-3">
              {message ||
                "You do not have permission to manage this athlete's AD."}
            </p>
          </div>
        </section>
      </AppShell>
    );
  }

  const athleteName =
    profile.preferred_name ||
    profile.full_name ||
    "Athlete";

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
              AD • Athlete Development
            </p>

            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
              {athleteName}&apos;s AD
            </h1>

            <p className="mt-3 max-w-3xl text-white/70">
              Track physical development,
              monitor progress and build a
              long-term development record.
            </p>
          </div>

          <div className="rounded-2xl border border-[#D8F200]/20 bg-[#D8F200]/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
              Last AD Update
            </p>

            <p className="mt-2 font-bold">
              {lastAdUpdate
                ? `${calendarDaysBetween(
                    lastAdUpdate.recorded_at,
                    new Date()
                  )} days ago`
                : "No updates yet"}
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-2xl p-4 text-sm font-medium ${
              messageType === "success"
                ? "bg-green-500/20 text-green-100"
                : messageType === "error"
                  ? "bg-red-500/20 text-red-100"
                  : "bg-white/10 text-white/75"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-[#D8F200]/20 bg-[#D8F200]/10 p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D8F200]">
              AD Index
            </p>

            <p className="mt-3 text-6xl font-extrabold">
              {adIndex}
            </p>

            <p className="mt-3 text-sm text-white/65">
              Development tracking
              completion, freshness and
              consistency.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-7">
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">
              AD Records
            </p>

            <p className="mt-3 text-4xl font-extrabold">
              {measurements.length}
            </p>

            <p className="mt-3 text-sm text-white/60">
              {
                latestMeasurements.filter(
                  (item) => item.latest
                ).length
              }{" "}
              of{" "}
              {MEASUREMENT_TYPES.length}{" "}
              physical areas tracked.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-7">
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">
              AD Status
            </p>

            <p className="mt-3 text-2xl font-extrabold">
              {adIndex >= 80
                ? "Excellent"
                : adIndex >= 60
                  ? "On Track"
                  : adIndex >= 30
                    ? "Building"
                    : "Get Started"}
            </p>

            <p className="mt-3 text-sm text-white/60">
              Don&apos;t forget to
              update {athleteName}&apos;s
              AD.
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-5 lg:grid-cols-5">
          {latestMeasurements.map(
            (item) => {
              const latest =
                item.latest;

              const previous =
                item.previous;

              const percent =
                percentageChange(
                  previous?.value,
                  latest?.value
                );

              const daysAgo =
                latest
                  ? calendarDaysBetween(
                      latest.recorded_at,
                      new Date()
                    )
                  : null;

              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() =>
                    setSelectedType(
                      item.type
                    )
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    selectedType ===
                    item.type
                      ? "border-[#D8F200] bg-[#D8F200]/10"
                      : "border-white/10 bg-white/10 hover:bg-white/15"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
                    {item.type}
                  </p>

                  <p className="mt-3 text-3xl font-extrabold">
                    {latest
                      ? `${latest.value} ${latest.unit}`
                      : "—"}
                  </p>

                  <p className="mt-3 text-sm font-semibold text-[#D8F200]">
                    {changeLabel(
                      percent
                    )}
                  </p>

                  <p className="mt-2 text-xs text-white/45">
                    {daysAgo !== null
                      ? `Updated ${daysAgo} days ago`
                      : "Not measured yet"}
                  </p>
                </button>
              );
            }
          )}
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            {latestMeasurements.map(
              (item) => {
                if (
                  item.type !==
                  selectedType
                ) {
                  return null;
                }

                const latest =
                  item.latest;

                const previous =
                  item.previous;

                const first =
                  item.first;

                const sincePrevious =
                  percentageChange(
                    previous?.value,
                    latest?.value
                  );

                const sinceFirst =
                  percentageChange(
                    first?.value,
                    latest?.value
                  );

                return (
                  <div
                    key={item.type}
                    className="rounded-3xl border border-white/10 bg-white/10 p-7 backdrop-blur"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                          Development Detail
                        </p>

                        <h2 className="mt-2 text-3xl font-extrabold">
                          {item.type}
                        </h2>
                      </div>

                      {latest && (
                        <p className="text-sm text-white/55">
                          {calendarDaysBetween(
                            latest.recorded_at,
                            new Date()
                          )}{" "}
                          days since last
                          measured
                        </p>
                      )}
                    </div>

                    {latest ? (
                      <>
                        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                          <div className="rounded-2xl bg-[#081642] p-5">
                            <p className="text-xs uppercase text-white/50">
                              Current
                            </p>

                            <p className="mt-2 text-3xl font-extrabold">
                              {latest.value}{" "}
                              {latest.unit}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#081642] p-5">
                            <p className="text-xs uppercase text-white/50">
                              Last Change
                            </p>

                            <p className="mt-2 text-xl font-bold">
                              {rawChangeLabel(
                                previous,
                                latest
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#081642] p-5">
                            <p className="text-xs uppercase text-white/50">
                              % Change
                            </p>

                            <p className="mt-2 text-xl font-bold">
                              {changeLabel(
                                sincePrevious
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#081642] p-5">
                            <p className="text-xs uppercase text-white/50">
                              Total Change
                            </p>

                            <p className="mt-2 text-xl font-bold">
                              {changeLabel(
                                sinceFirst
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#081642] p-5">
                            <p className="text-xs uppercase text-white/50">
                              Age Tested
                            </p>

                            <p className="mt-2 text-lg font-bold">
                              {ageAtDate(
                                profile.date_of_birth,
                                latest.recorded_at
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-7">
                          <h3 className="text-xl font-bold">
                            Measurement History
                          </h3>

                          <p className="mt-2 text-sm text-white/55">
                            Every result is
                            preserved as part of
                            the athlete&apos;s
                            development record.
                          </p>

                          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
                            {item.history.map(
                              (
                                measurement,
                                index
                              ) => {
                                const older =
                                  item.history[
                                    index + 1
                                  ] || null;

                                const percent =
                                  percentageChange(
                                    older?.value,
                                    measurement.value
                                  );

                                return (
                                  <div
                                    key={
                                      measurement.id
                                    }
                                    className="grid gap-3 border-b border-white/10 bg-[#081642] p-4 last:border-b-0 md:grid-cols-5"
                                  >
                                    <div>
                                      <p className="text-xs text-white/45">
                                        Result
                                      </p>

                                      <p className="mt-1 font-bold">
                                        {
                                          measurement.value
                                        }{" "}
                                        {
                                          measurement.unit
                                        }
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-xs text-white/45">
                                        Date
                                      </p>

                                      <p className="mt-1 text-sm">
                                        {formatDate(
                                          measurement.recorded_at
                                        )}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-xs text-white/45">
                                        Athlete Age
                                      </p>

                                      <p className="mt-1 text-sm">
                                        {ageAtDate(
                                          profile.date_of_birth,
                                          measurement.recorded_at
                                        )}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-xs text-white/45">
                                        % Change
                                      </p>

                                      <p className="mt-1 text-sm font-semibold">
                                        {changeLabel(
                                          percent
                                        )}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-xs text-white/45">
                                        Recorded By
                                      </p>

                                      <p className="mt-1 text-sm">
                                        {measurement.verification_status ===
                                        "family_reported"
                                          ? "Family"
                                          : "Athlete"}
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="mt-6 rounded-2xl bg-[#081642] p-6 text-white/65">
                        No{" "}
                        {item.type.toLowerCase()}{" "}
                        measurements recorded
                        yet.
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/10 p-7 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
              Update AD
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Quick Update
            </h2>

            <p className="mt-2 text-sm text-white/60">
              Enter only the
              measurements taken today.
              Leave everything else
              blank.
            </p>

            <form
              onSubmit={
                handleSaveUpdate
              }
              className="mt-6 space-y-5"
            >
              {MEASUREMENT_TYPES.map(
                (item) => (
                  <div key={item.type}>
                    <label className="mb-2 block text-sm font-medium">
                      {item.type}
                    </label>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.1"
                        value={
                          updateValues[
                            item.type
                          ]
                        }
                        onChange={(
                          event
                        ) =>
                          setUpdateValues(
                            (
                              current
                            ) => ({
                              ...current,
                              [item.type]:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        placeholder={
                          item.type
                        }
                        className="min-w-0 flex-1 rounded-xl bg-[#081642] px-4 py-3 outline-none"
                      />

                      <span className="w-8 text-sm text-white/55">
                        {item.unit}
                      </span>
                    </div>
                  </div>
                )
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Measurement Date
                </label>

                <input
                  type="date"
                  value={recordedDate}
                  max={new Date()
                    .toISOString()
                    .slice(0, 10)}
                  onChange={(
                    event
                  ) =>
                    setRecordedDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(
                    event
                  ) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Optional notes for this AD update"
                  className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
              >
                {saving
                  ? "Updating AD..."
                  : "Update AD"}
              </button>
            </form>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}