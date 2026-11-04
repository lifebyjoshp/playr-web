
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
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.floor((b - a) / 86400000));
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
    days += new Date(target.getFullYear(), target.getMonth(), 0).getDate();
    months--;
  }
  if (months < 0) {
    months += 12;
    years--;
  }
  return `${years}y ${months}m ${days}d`;
}

function percentChange(first?: number, latest?: number) {
  if (first === undefined || latest === undefined || first === 0) return null;
  return ((latest - first) / first) * 100;
}

function changeLabel(value: number | null) {
  if (value === null) return "No comparison yet";
  if (value > 0) return `↑ ${value.toFixed(1)}%`;
  if (value < 0) return `↓ ${Math.abs(value).toFixed(1)}%`;
  return "No change";
}

function freshness(days: number) {
  if (days <= 30) return 100;
  if (days <= 60) return 80;
  if (days <= 90) return 60;
  if (days <= 120) return 40;
  if (days <= 180) return 20;
  return 0;
}

const inputStyle =
  "w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 text-white outline-none focus:border-[#D8F200]";

export default function DevelopmentPage() {
  const [tab, setTab] = useState<"physical" | "performance">("physical");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [guardianManaged, setGuardianManaged] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [selected, setSelected] = useState<MeasurementType>("Height");
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
          context.activeGuardianPermissions?.canManageMetrics === true);

      setAthleteId(id);
      setAuthUserId(context.authUserId);
      setGuardianManaged(context.isGuardianManaged);
      setCanManage(permission);

      const [p, m] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, preferred_name, date_of_birth")
          .eq("id", id)
          .single(),
        supabase
          .from("athlete_measurements")
          .select("*")
          .eq("athlete_profile_id", id)
          .order("recorded_at", { ascending: false }),
      ]);

      if (p.error) throw p.error;
      if (m.error) throw m.error;

      setProfile(p.data as Profile);
      setMeasurements((m.data || []) as Measurement[]);

      if (!permission) {
        setMessageType("info");
        setMessage("You can view this athlete's AD, but cannot update their measurements.");
      } else {
        setMessage("");
      }
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to load Athlete Development."
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
          .filter((m) => m.measurement_type === item.type)
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
    const completed = areas.filter((a) => a.latest);
    const completion = (completed.length / TYPES.length) * 100;
    const avgFreshness = completed.length
      ? completed.reduce((sum, a) => sum + freshness(daysSince(a.latest!.recorded_at)), 0) /
        completed.length
      : 0;
    const consistency =
      Math.min(100, (measurements.filter((m) => daysSince(m.recorded_at) <= 180).length / 10) * 100);

    return Math.round(completion * 0.4 + avgFreshness * 0.35 + consistency * 0.25);
  }, [areas, measurements]);

  const selectedArea = areas.find((a) => a.type === selected)!;
  const lastUpdate = measurements.length
    ? measurements.reduce((a, b) =>
        new Date(a.recorded_at) > new Date(b.recorded_at) ? a : b
      )
    : null;

  async function addMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numeric = Number(value);

    if (!canManage || !authUserId || !athleteId) {
      setMessageType("error");
      setMessage("You do not have permission to update this athlete.");
      return;
    }

    if (!Number.isFinite(numeric) || numeric <= 0 || !date || date > today()) {
      setMessageType("error");
      setMessage("Enter a valid measurement and date.");
      return;
    }

    const unit = TYPES.find((t) => t.type === selected)!.unit;
    setSaving(true);

    try {
      const { error } = await supabase.from("athlete_measurements").insert({
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
      await loadDevelopment();
      setMessageType("success");
      setMessage("AD updated successfully.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Unable to save measurement.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-6 py-12">
          Loading Athlete Development...
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D8F200]">
              AD • Athlete Development
            </p>
            <h1 className="mt-3 text-4xl font-extrabold">
              {profile?.preferred_name || profile?.full_name || "Athlete"}&apos;s AD
            </h1>
            <p className="mt-3 max-w-2xl text-white/65">
              Progress is King. Track your development, record your efforts and celebrate improvement.
            </p>
            {guardianManaged && profile && (
              <p className="mt-3 text-sm font-semibold text-[#D8F200]">
                Managing {profile.preferred_name || profile.full_name}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
            <p className="text-xs uppercase text-white/50">Last physical AD update</p>
            <p className="mt-2 font-bold">
              {lastUpdate ? `${daysSince(lastUpdate.recorded_at)} days ago` : "No updates yet"}
            </p>
          </div>
        </header>

        {message && (
          <div
            className={`mb-6 rounded-xl p-4 text-sm ${
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

        <div className="mb-8 inline-flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#081642] p-2">
          <button
            type="button"
            onClick={() => setTab("physical")}
            className={`rounded-xl px-5 py-3 text-sm font-bold ${
              tab === "physical"
                ? "bg-[#D8F200] text-[#081642]"
                : "text-white/70 hover:bg-white/10"
            }`}
          >
            Physical Development
          </button>
          <button
            type="button"
            onClick={() => setTab("performance")}
            className={`rounded-xl px-5 py-3 text-sm font-bold ${
              tab === "performance"
                ? "bg-[#D8F200] text-[#081642]"
                : "text-white/70 hover:bg-white/10"
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
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-[#D8F200]/20 bg-[#D8F200]/10 p-6">
                <p className="text-xs font-bold uppercase text-[#D8F200]">AD Index</p>
                <p className="mt-3 text-5xl font-extrabold">{adIndex}</p>
                <p className="mt-2 text-xs text-white/60">
                  Measurement completion, freshness and consistency.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
                <p className="text-xs uppercase text-white/50">Measurements Recorded</p>
                <p className="mt-3 text-4xl font-extrabold">{measurements.length}</p>
                <p className="mt-2 text-xs text-white/60">
                  {areas.filter((a) => a.latest).length} of {TYPES.length} development areas.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
                <p className="text-xs uppercase text-white/50">AD Status</p>
                <p className="mt-3 text-2xl font-extrabold">
                  {adIndex >= 80
                    ? "Excellent"
                    : adIndex >= 60
                      ? "On Track"
                      : adIndex >= 30
                        ? "Building"
                        : "Get Started"}
                </p>
                <p className="mt-2 text-xs text-white/60">
                  Keep your development record up to date.
                </p>
              </div>
            </div>

            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {areas.map((a) => (
                <button
                  key={a.type}
                  type="button"
                  onClick={() => setSelected(a.type)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    selected === a.type
                      ? "border-[#D8F200] bg-[#D8F200]/10"
                      : "border-white/10 bg-white/10 hover:bg-white/15"
                  }`}
                >
                  <p className="text-xs font-bold uppercase text-white/55">{a.type}</p>
                  <p className="mt-3 text-2xl font-extrabold">
                    {a.latest ? `${a.latest.value} ${a.unit}` : "—"}
                  </p>
                  <p className="mt-3 text-sm text-white/60">
                    {changeLabel(percentChange(a.previous?.value, a.latest?.value))}
                  </p>
                  <p className="mt-2 text-xs text-white/45">
                    {a.latest ? `Updated ${daysSince(a.latest.recorded_at)} days ago` : "Not measured yet"}
                  </p>
                </button>
              ))}
            </div>

            <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
                <p className="text-xs font-bold uppercase text-[#D8F200]">AD Detail</p>
                <h2 className="mt-2 text-3xl font-extrabold">{selectedArea.type}</h2>

                {selectedArea.latest ? (
                  <>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {[
                        ["Current", `${selectedArea.latest.value} ${selectedArea.unit}`],
                        [
                          "Since Previous",
                          changeLabel(
                            percentChange(
                              selectedArea.previous?.value,
                              selectedArea.latest.value
                            )
                          ),
                        ],
                        [
                          "Since First",
                          changeLabel(
                            percentChange(
                              selectedArea.first?.value,
                              selectedArea.latest.value
                            )
                          ),
                        ],
                        [
                          "Age Tested",
                          ageAtDate(
                            profile?.date_of_birth || null,
                            selectedArea.latest.recorded_at
                          ),
                        ],
                      ].map(([label, display]) => (
                        <div key={label} className="rounded-2xl bg-[#081642] p-5">
                          <p className="text-xs uppercase text-white/50">{label}</p>
                          <p className="mt-2 text-xl font-bold">{display}</p>
                        </div>
                      ))}
                    </div>

                    <h3 className="mt-8 text-xl font-bold">History</h3>
                    <div className="mt-4 space-y-2">
                      {selectedArea.history.map((m, index) => (
                        <div
                          key={m.id}
                          className="grid gap-3 rounded-xl bg-[#081642] p-4 sm:grid-cols-4"
                        >
                          <div>
                            <p className="text-xs text-white/45">Measurement</p>
                            <p className="mt-1 font-semibold">{m.value} {m.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/45">Recorded</p>
                            <p className="mt-1 text-sm">{formatDate(m.recorded_at)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/45">Athlete Age</p>
                            <p className="mt-1 text-sm">
                              {ageAtDate(profile?.date_of_birth || null, m.recorded_at)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/45">Change</p>
                            <p className="mt-1 text-sm">
                              {changeLabel(
                                percentChange(
                                  selectedArea.history[index + 1]?.value,
                                  m.value
                                )
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-6 rounded-xl bg-[#081642] p-5 text-white/60">
                    No measurements recorded yet.
                  </p>
                )}
              </div>

              <aside className="self-start rounded-3xl border border-white/10 bg-white/10 p-6">
                <p className="text-xs font-bold uppercase text-[#D8F200]">Update AD</p>
                <h2 className="mt-2 text-2xl font-bold">Add Measurement</h2>

                {!canManage ? (
                  <p className="mt-5 rounded-xl bg-[#081642] p-4 text-sm text-white/65">
                    View only. You do not have permission to add measurements.
                  </p>
                ) : (
                  <form onSubmit={addMeasurement} className="mt-6 space-y-5">
                    <div>
                      <label className="mb-2 block text-sm">Measurement</label>
                      <select
                        className={inputStyle}
                        value={selected}
                        onChange={(e) => setSelected(e.target.value as MeasurementType)}
                      >
                        {TYPES.map((t) => (
                          <option key={t.type} value={t.type}>{t.type}</option>
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
                        onChange={(e) => setValue(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm">Measurement Date</label>
                      <input
                        className={inputStyle}
                        type="date"
                        max={today()}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm">Notes</label>
                      <textarea
                        className={inputStyle}
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
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
                )}
              </aside>
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
