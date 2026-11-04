
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import AppShell from "../../../components/AppShell";
import PerformancePanel from "../../../components/development/PerformancePanel";
import { getActiveAthleteContext } from "../../../lib/activeAthlete";
import { supabase } from "../../../lib/supabase";

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
};

const TYPES: { type: MeasurementType; unit: string }[] = [
  { type: "Height", unit: "cm" },
  { type: "Weight", unit: "kg" },
  { type: "Wingspan", unit: "cm" },
  { type: "Standing Reach", unit: "cm" },
  { type: "Vertical Jump", unit: "cm" },
];

const inputStyle =
  "w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 text-white outline-none focus:border-[#D8F200]";

function today() {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function daysSince(date: string) {
  const d = new Date(date);
  const now = new Date();

  const start = Date.UTC(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  );

  const end = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return Math.max(0, Math.floor((end - start) / 86400000));
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ageAtDate(dob: string | null, date: string) {
  if (!dob) return "Age unavailable";

  const birth = new Date(`${dob}T00:00:00`);
  const target = new Date(date);

  let years = target.getFullYear() - birth.getFullYear();
  let months = target.getMonth() - birth.getMonth();
  let days = target.getDate() - birth.getDate();

  if (days < 0) {
    days += new Date(
      target.getFullYear(),
      target.getMonth(),
      0
    ).getDate();

    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  return `${years}y ${months}m ${days}d`;
}

function percentChange(
  first?: number,
  latest?: number
): number | null {
  if (
    first === undefined ||
    latest === undefined ||
    first === 0
  ) {
    return null;
  }

  return ((latest - first) / first) * 100;
}

function changeLabel(value: number | null) {
  if (value === null) return "—";
  if (value > 0) return `+${value.toFixed(1)}%`;
  if (value < 0) return `${value.toFixed(1)}%`;
  return "0%";
}

function freshness(days: number) {
  if (days <= 30) return 100;
  if (days <= 60) return 80;
  if (days <= 90) return 60;
  if (days <= 120) return 40;
  if (days <= 180) return 20;
  return 0;
}

function statusForIndex(index: number) {
  if (index >= 80) return "Excellent";
  if (index >= 60) return "On Track";
  if (index >= 30) return "Building";
  return "Get Started";
}

export default function DevelopmentPage() {
  const [tab, setTab] = useState<
    "physical" | "performance"
  >("physical");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [guardianManaged, setGuardianManaged] = useState(false);
  const [canManage, setCanManage] = useState(false);

  const [measurements, setMeasurements] =
    useState<Measurement[]>([]);

  const [selected, setSelected] =
    useState<MeasurementType>("Height");

  const [mobileDetailOpen, setMobileDetailOpen] =
    useState(false);

  const [mobileFormOpen, setMobileFormOpen] =
    useState(false);

  const [value, setValue] = useState("");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [messageType, setMessageType] =
    useState<"info" | "error" | "success">("info");

  async function loadDevelopment() {
    setLoading(true);

    try {
      const context = await getActiveAthleteContext();

      if (!context || !context.activeAthlete) {
        setProfile(null);
        setAthleteId(null);
        setAuthUserId(null);
        setMeasurements([]);
        setCanManage(false);

        setMessageType("error");
        setMessage(
          !context
            ? "You must be logged in."
            : context.requiresAthleteSelection
              ? "Select the athlete you're managing before viewing Athlete Development."
              : "No athlete profile is connected to this RADR account."
        );

        return;
      }

      const id = context.activeAthlete.id;

      const permission =
        context.isSelfManaged ||
        (context.isGuardianManaged &&
          context.activeGuardianPermissions
            ?.canManageMetrics === true);

      setAthleteId(id);
      setAuthUserId(context.authUserId);
      setGuardianManaged(context.isGuardianManaged);
      setCanManage(permission);

      const [profileResponse, measurementResponse] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, full_name, preferred_name, date_of_birth"
            )
            .eq("id", id)
            .single(),

          supabase
            .from("athlete_measurements")
            .select("*")
            .eq("athlete_profile_id", id)
            .order("recorded_at", {
              ascending: false,
            }),
        ]);

      if (profileResponse.error) {
        throw profileResponse.error;
      }

      if (measurementResponse.error) {
        throw measurementResponse.error;
      }

      setProfile(profileResponse.data as Profile);

      setMeasurements(
        (measurementResponse.data || []) as Measurement[]
      );

      if (!permission) {
        setMessageType("info");
        setMessage(
          "You can view this athlete's AD, but cannot update their measurements."
        );
      } else {
        setMessage("");
      }
    } catch (error) {
      setMessageType("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Athlete Development."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDevelopment();
  }, []);

  const areas = useMemo(
    () =>
      TYPES.map((item) => {
        const history = measurements
          .filter(
            (measurement) =>
              measurement.measurement_type === item.type
          )
          .sort(
            (a, b) =>
              new Date(b.recorded_at).getTime() -
              new Date(a.recorded_at).getTime()
          );

        return {
          ...item,
          history,
          latest: history[0] || null,
          previous: history[1] || null,
          first: history[history.length - 1] || null,
        };
      }),
    [measurements]
  );

  const adIndex = useMemo(() => {
    const completed = areas.filter((area) => area.latest);

    const completion =
      (completed.length / TYPES.length) * 100;

    const averageFreshness = completed.length
      ? completed.reduce(
          (sum, area) =>
            sum +
            freshness(
              daysSince(area.latest!.recorded_at)
            ),
          0
        ) / completed.length
      : 0;

    const recentUpdates = measurements.filter(
      (measurement) =>
        daysSince(measurement.recorded_at) <= 180
    ).length;

    const consistency = Math.min(
      100,
      (recentUpdates / 10) * 100
    );

    return Math.round(
      completion * 0.4 +
        averageFreshness * 0.35 +
        consistency * 0.25
    );
  }, [areas, measurements]);

  const selectedArea = areas.find(
    (area) => area.type === selected
  )!;

  const completedAreas = areas.filter(
    (area) => area.latest
  ).length;

  const lastUpdate = measurements.length
    ? measurements.reduce((a, b) =>
        new Date(a.recorded_at) >
        new Date(b.recorded_at)
          ? a
          : b
      )
    : null;

  async function addMeasurement(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const numeric = Number(value);

    if (!canManage || !authUserId || !athleteId) {
      setMessageType("error");
      setMessage(
        "You do not have permission to update this athlete."
      );
      return;
    }

    if (
      !Number.isFinite(numeric) ||
      numeric <= 0 ||
      !date ||
      date > today()
    ) {
      setMessageType("error");
      setMessage("Enter a valid measurement and date.");
      return;
    }

    const unit = TYPES.find(
      (item) => item.type === selected
    )!.unit;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("athlete_measurements")
        .insert({
          athlete_profile_id: athleteId,
          measurement_type: selected,
          value: numeric,
          unit,
          recorded_at: `${date}T12:00:00`,
          recorded_by: authUserId,
          notes: notes.trim() || null,
          verification_status: "self_reported",
        });

      if (error) throw error;

      setValue("");
      setNotes("");
      setMobileFormOpen(false);

      await loadDevelopment();

      setMessageType("success");
      setMessage("AD updated successfully.");
    } catch (error) {
      setMessageType("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save measurement."
      );
    } finally {
      setSaving(false);
    }
  }

  function selectMeasurement(type: MeasurementType) {
    if (selected === type) {
      setMobileDetailOpen(!mobileDetailOpen);
    } else {
      setSelected(type);
      setMobileDetailOpen(true);
    }
  }

  const measurementForm = (
    <form
      onSubmit={addMeasurement}
      className="space-y-4"
    >
      <div>
        <label className="mb-2 block text-sm">
          Measurement
        </label>

        <select
          className={inputStyle}
          value={selected}
          onChange={(event) =>
            setSelected(
              event.target.value as MeasurementType
            )
          }
        >
          {TYPES.map((item) => (
            <option
              key={item.type}
              value={item.type}
            >
              {item.type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm">
          Value ({selectedArea.unit})
        </label>

        <input
          className={inputStyle}
          type="number"
          min="0.1"
          step="0.1"
          value={value}
          onChange={(event) =>
            setValue(event.target.value)
          }
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm">
          Measurement Date
        </label>

        <input
          className={inputStyle}
          type="date"
          max={today()}
          value={date}
          onChange={(event) =>
            setDate(event.target.value)
          }
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm">
          Notes
        </label>

        <textarea
          className={inputStyle}
          rows={2}
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          placeholder="Optional"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#081642] disabled:opacity-50"
      >
        {saving ? "Saving..." : "Update AD"}
      </button>
    </form>
  );

  const measurementDetails = (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {[
          [
            "Current",
            selectedArea.latest
              ? `${selectedArea.latest.value} ${selectedArea.unit}`
              : "—",
          ],
          [
            "Since Previous",
            changeLabel(
              percentChange(
                selectedArea.previous?.value,
                selectedArea.latest?.value
              )
            ),
          ],
          [
            "Since First",
            changeLabel(
              percentChange(
                selectedArea.first?.value,
                selectedArea.latest?.value
              )
            ),
          ],
          [
            "Age Tested",
            selectedArea.latest
              ? ageAtDate(
                  profile?.date_of_birth || null,
                  selectedArea.latest.recorded_at
                )
              : "—",
          ],
        ].map(([label, display]) => (
          <div
            key={label}
            className="rounded-xl bg-[#081642] p-3 md:p-5"
          >
            <p className="text-[10px] uppercase text-white/50 md:text-xs">
              {label}
            </p>

            <p className="mt-1 text-base font-bold md:text-xl">
              {display}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-3 font-bold">
          Measurement History
        </h3>

        {selectedArea.history.length === 0 ? (
          <p className="rounded-xl bg-[#081642] p-4 text-sm text-white/60">
            No measurements recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedArea.history.map(
              (measurement, index) => {
                const older =
                  selectedArea.history[index + 1];

                const change = percentChange(
                  older?.value,
                  measurement.value
                );

                return (
                  <div
                    key={measurement.id}
                    className="rounded-xl bg-[#081642] p-3 md:p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {measurement.value}{" "}
                          {measurement.unit}
                        </p>

                        <p className="mt-1 text-xs text-white/50">
                          {formatDate(
                            measurement.recorded_at
                          )}
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-[#D8F200]">
                        {changeLabel(change)}
                      </p>
                    </div>

                    <p className="mt-2 text-xs text-white/45">
                      Age tested:{" "}
                      {ageAtDate(
                        profile?.date_of_birth || null,
                        measurement.recorded_at
                      )}
                    </p>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-4 py-10">
          Loading Athlete Development...
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-3 pb-36 pt-5 sm:px-6 md:py-12">
        <header className="mb-4 md:mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D8F200] md:text-sm">
            AD • Athlete Development
          </p>

          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold md:text-5xl">
                {profile?.preferred_name ||
                  profile?.full_name ||
                  "Athlete"}
                &apos;s AD
              </h1>

              <p className="mt-1 text-xs text-white/60 md:mt-3 md:text-base">
                Progress is King.
              </p>
            </div>

            <div className="text-right md:rounded-2xl md:border md:border-white/10 md:bg-white/10 md:px-5 md:py-4">
              <p className="text-[10px] text-white/45 md:text-xs">
                LAST UPDATE
              </p>

              <p className="mt-1 text-xs font-bold md:text-base">
                {lastUpdate
                  ? daysSince(lastUpdate.recorded_at) === 0
                    ? "Today"
                    : `${daysSince(
                        lastUpdate.recorded_at
                      )}d ago`
                  : "Not yet"}
              </p>
            </div>
          </div>

          {guardianManaged && profile && (
            <p className="mt-2 text-xs font-semibold text-[#D8F200]">
              Managing{" "}
              {profile.preferred_name ||
                profile.full_name}
            </p>
          )}
        </header>

        {message && (
          <div
            className={`mb-4 rounded-xl p-3 text-sm ${
              messageType === "error"
                ? "bg-red-500/15 text-red-100"
                : messageType === "success"
                  ? "bg-green-500/15 text-green-100"
                  : "bg-white/10 text-white/75"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#081642] p-1 md:mb-8 md:inline-flex md:gap-2 md:rounded-2xl md:p-2">
          <button
            type="button"
            onClick={() => setTab("physical")}
            className={`rounded-lg px-2 py-2.5 text-[11px] font-bold sm:text-sm md:rounded-xl md:px-5 md:py-3 ${
              tab === "physical"
                ? "bg-[#D8F200] text-[#081642]"
                : "text-white/65 hover:bg-white/10"
            }`}
          >
            Physical Development
          </button>

          <button
            type="button"
            onClick={() => setTab("performance")}
            className={`rounded-lg px-2 py-2.5 text-[11px] font-bold sm:text-sm md:rounded-xl md:px-5 md:py-3 ${
              tab === "performance"
                ? "bg-[#D8F200] text-[#081642]"
                : "text-white/65 hover:bg-white/10"
            }`}
          >
            Fitness &amp; Performance
          </button>
        </div>

        {tab === "performance" ? (
          <PerformancePanel
            athleteId={athleteId}
            authUserId={authUserId}
            canManage={canManage}
          />
        ) : (
          <>
            {/* MOBILE SUMMARY */}
            <div className="mb-4 rounded-xl border border-[#D8F200]/20 bg-white/10 p-3 md:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#D8F200]">
                    AD Index
                  </p>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold">
                      {adIndex}
                    </span>

                    <span className="text-[10px] font-bold text-[#D8F200]">
                      {statusForIndex(adIndex)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase text-white/50">
                    Measurements
                  </p>

                  <p className="mt-1 text-xl font-extrabold">
                    {measurements.length}
                  </p>

                  <p className="text-[10px] text-white/50">
                    {completedAreas} of 5 areas
                  </p>
                </div>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#D8F200]"
                  style={{
                    width: `${adIndex}%`,
                  }}
                />
              </div>
            </div>

            {/* DESKTOP SUMMARY */}
            <div className="mb-8 hidden gap-4 md:grid md:grid-cols-3">
              <div className="rounded-3xl border border-[#D8F200]/20 bg-[#D8F200]/10 p-6">
                <p className="text-xs font-bold uppercase text-[#D8F200]">
                  AD Index
                </p>

                <p className="mt-3 text-5xl font-extrabold">
                  {adIndex}
                </p>

                <p className="mt-2 text-xs text-white/60">
                  Measurement completion, freshness and consistency.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
                <p className="text-xs uppercase text-white/50">
                  Measurements Recorded
                </p>

                <p className="mt-3 text-4xl font-extrabold">
                  {measurements.length}
                </p>

                <p className="mt-2 text-xs text-white/60">
                  {completedAreas} of 5 development areas.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
                <p className="text-xs uppercase text-white/50">
                  AD Status
                </p>

                <p className="mt-3 text-2xl font-extrabold">
                  {statusForIndex(adIndex)}
                </p>

                <p className="mt-2 text-xs text-white/60">
                  Keep your development record up to date.
                </p>
              </div>
            </div>

            {/* MOBILE MEASUREMENT SNAPSHOT */}
            <div className="md:hidden">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold">
                  Physical Measurements
                </h2>

                <span className="text-[10px] text-white/45">
                  Tap to view history
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/10">
                {areas.map((area) => {
                  const change = percentChange(
                    area.previous?.value,
                    area.latest?.value
                  );

                  const active =
                    selected === area.type &&
                    mobileDetailOpen;

                  return (
                    <button
                      key={area.type}
                      type="button"
                      onClick={() =>
                        selectMeasurement(area.type)
                      }
                      className={`flex w-full items-center justify-between gap-2 border-b border-white/10 px-3 py-3 text-left last:border-b-0 ${
                        active
                          ? "bg-[#D8F200]/10"
                          : ""
                      }`}
                    >
                      <span className="text-xs text-white/70">
                        {area.type}
                      </span>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">
                          {area.latest
                            ? `${area.latest.value} ${area.unit}`
                            : "—"}
                        </span>

                        <span className="w-14 text-right text-[10px] font-semibold text-[#D8F200]">
                          {changeLabel(change)}
                        </span>

                        <span className="text-xs text-white/40">
                          {active ? "−" : "+"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {mobileDetailOpen && (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/10 p-3">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold">
                      {selected}
                    </h3>

                    <button
                      type="button"
                      onClick={() =>
                        setMobileDetailOpen(false)
                      }
                      className="text-xs text-white/50"
                    >
                      Close
                    </button>
                  </div>

                  {measurementDetails}
                </div>
              )}

              {canManage && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileFormOpen(!mobileFormOpen)
                    }
                    className="w-full rounded-xl bg-[#D8F200] px-4 py-3 text-sm font-extrabold text-[#081642]"
                  >
                    {mobileFormOpen
                      ? "− Close Measurement Form"
                      : "+ Record Measurement"}
                  </button>

                  {mobileFormOpen && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/10 p-4">
                      {measurementForm}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DESKTOP MEASUREMENT CARDS */}
            <div className="mb-8 hidden gap-3 md:grid md:grid-cols-5">
              {areas.map((area) => (
                <button
                  key={area.type}
                  type="button"
                  onClick={() =>
                    setSelected(area.type)
                  }
                  className={`rounded-2xl border p-5 text-left ${
                    selected === area.type
                      ? "border-[#D8F200] bg-[#D8F200]/10"
                      : "border-white/10 bg-white/10"
                  }`}
                >
                  <p className="text-xs font-bold uppercase text-white/55">
                    {area.type}
                  </p>

                  <p className="mt-3 text-2xl font-extrabold">
                    {area.latest
                      ? `${area.latest.value} ${area.unit}`
                      : "—"}
                  </p>

                  <p className="mt-3 text-sm text-white/60">
                    {changeLabel(
                      percentChange(
                        area.previous?.value,
                        area.latest?.value
                      )
                    )}
                  </p>

                  <p className="mt-2 text-xs text-white/45">
                    {area.latest
                      ? `Updated ${daysSince(
                          area.latest.recorded_at
                        )} days ago`
                      : "Not measured yet"}
                  </p>
                </button>
              ))}
            </div>

            {/* DESKTOP DETAILS AND FORM */}
            <div className="hidden gap-7 md:grid xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
                <p className="text-xs font-bold uppercase text-[#D8F200]">
                  AD Detail
                </p>

                <h2 className="mb-6 mt-2 text-3xl font-extrabold">
                  {selected}
                </h2>

                {measurementDetails}
              </div>

              <aside className="self-start rounded-3xl border border-white/10 bg-white/10 p-6">
                <p className="text-xs font-bold uppercase text-[#D8F200]">
                  Update AD
                </p>

                <h2 className="mb-6 mt-2 text-2xl font-bold">
                  Add Measurement
                </h2>

                {canManage ? (
                  measurementForm
                ) : (
                  <p className="rounded-xl bg-[#081642] p-4 text-sm text-white/60">
                    View only. You do not have permission to add measurements.
                  </p>
                )}
              </aside>
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
