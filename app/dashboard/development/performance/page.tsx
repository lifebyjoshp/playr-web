
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "../../../../components/AppShell";
import { getActiveAthleteContext } from "../../../../lib/activeAthlete";
import { supabase } from "../../../../lib/supabase";
import { RADR_SPORTS } from "../../../../lib/sports";

type Category = "personal_best" | "fitness_benchmark";
type Direction = "higher" | "lower";

type PerformanceResult = {
  id: string;
  athlete_profile_id: string;
  category: Category;
  sport: string;
  event_name: string;
  value: number;
  unit: string;
  better_direction: Direction;
  recorded_at: string;
  competition_name: string | null;
  notes: string | null;
  verification_status: string;
};

type EventOption = {
  name: string;
  unit: string;
  direction: Direction;
};

const BENCHMARKS: EventOption[] = [
  { name: "Push-ups", unit: "reps", direction: "higher" },
  { name: "Pull-ups", unit: "reps", direction: "higher" },
  { name: "Chin-ups", unit: "reps", direction: "higher" },
  { name: "20m Sprint", unit: "seconds", direction: "lower" },
  { name: "40m Sprint", unit: "seconds", direction: "lower" },
  { name: "Vertical Jump", unit: "cm", direction: "higher" },
  { name: "Beep Test", unit: "level", direction: "higher" },
  { name: "5km Run", unit: "seconds", direction: "lower" },
];

const PB_EVENTS: EventOption[] = [
  { name: "100m", unit: "seconds", direction: "lower" },
  { name: "200m", unit: "seconds", direction: "lower" },
  { name: "400m", unit: "seconds", direction: "lower" },
  { name: "800m", unit: "seconds", direction: "lower" },
  { name: "1500m", unit: "seconds", direction: "lower" },
  { name: "Long Jump", unit: "metres", direction: "higher" },
  { name: "High Jump", unit: "metres", direction: "higher" },
  { name: "50m Freestyle", unit: "seconds", direction: "lower" },
  { name: "100m Freestyle", unit: "seconds", direction: "lower" },
];

const CUSTOM = "__custom__";

function today(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function displayValue(value: number, unit: string): string {
  if (unit === "seconds" && value >= 60) {
    const minutes = Math.floor(value / 60);
    const seconds = (value % 60).toFixed(2).padStart(5, "0");
    return `${minutes}:${seconds}`;
  }
  return `${value} ${unit}`;
}

function resultKey(result: PerformanceResult): string {
  return [
    result.category,
    result.sport.trim().toLowerCase(),
    result.event_name.trim().toLowerCase(),
    result.unit.trim().toLowerCase(),
    result.better_direction,
  ].join("|");
}

function bestOf(results: PerformanceResult[]): PerformanceResult {
  return results.reduce((best, item) => {
    const better =
      item.better_direction === "lower"
        ? item.value < best.value
        : item.value > best.value;

    return better ? item : best;
  });
}

export default function PerformancePage() {
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState("Athlete");
  const [canManage, setCanManage] = useState(false);
  const [guardianManaged, setGuardianManaged] = useState(false);
  const [results, setResults] = useState<PerformanceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [category, setCategory] = useState<Category>("fitness_benchmark");
  const [sport, setSport] = useState("Basketball");
  const [customSport, setCustomSport] = useState("");
  const [eventChoice, setEventChoice] = useState("Push-ups");
  const [customEvent, setCustomEvent] = useState("");
  const [customUnit, setCustomUnit] = useState("reps");
  const [customDirection, setCustomDirection] =
    useState<Direction>("higher");
  const [value, setValue] = useState("");
  const [recordedDate, setRecordedDate] = useState(today);
  const [competition, setCompetition] = useState("");
  const [notes, setNotes] = useState("");

  const eventOptions =
    category === "fitness_benchmark" ? BENCHMARKS : PB_EVENTS;

  const selectedEvent = eventOptions.find(
    (item) => item.name === eventChoice
  );

  const isCustomEvent = eventChoice === CUSTOM;

  const effectiveEvent = isCustomEvent
    ? customEvent.trim()
    : selectedEvent?.name || "";

  const effectiveUnit = isCustomEvent
    ? customUnit.trim()
    : selectedEvent?.unit || "";

  const effectiveDirection = isCustomEvent
    ? customDirection
    : selectedEvent?.direction || "higher";

  const effectiveSport =
    sport === CUSTOM ? customSport.trim() : sport;

  const loadResults = useCallback(async (id: string) => {
    const { data, error: queryError } = await supabase
      .from("athlete_performance_results")
      .select("*")
      .eq("athlete_profile_id", id)
      .order("recorded_at", { ascending: false });

    if (queryError) throw queryError;

    setResults((data || []) as PerformanceResult[]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialise() {
      try {
        const context = await getActiveAthleteContext();

        if (!context?.activeAthlete) {
          throw new Error(
            "Select an athlete profile before viewing performance results."
          );
        }

        if (cancelled) return;

        const active = context.activeAthlete;

        setAthleteId(active.id);
        setAuthUserId(context.authUserId);
        setAthleteName(
          active.preferred_name || active.full_name || "Athlete"
        );
        setGuardianManaged(context.isGuardianManaged);
        setCanManage(
          context.isSelfManaged ||
            (context.isGuardianManaged &&
              context.activeGuardianPermissions?.canManageMetrics === true)
        );

        const { data, error: queryError } = await supabase
          .from("athlete_performance_results")
          .select("*")
          .eq("athlete_profile_id", active.id)
          .order("recorded_at", { ascending: false });

        if (queryError) throw queryError;

        if (!cancelled) {
          setResults((data || []) as PerformanceResult[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load performance results."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialise();

    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    const grouped = new Map<string, PerformanceResult[]>();

    for (const result of results) {
      const key = resultKey(result);
      const existing = grouped.get(key) || [];
      existing.push(result);
      grouped.set(key, existing);
    }

    return Array.from(grouped.values()).map((history) => {
      const ordered = [...history].sort(
        (a, b) =>
          new Date(b.recorded_at).getTime() -
          new Date(a.recorded_at).getTime()
      );

      const best = bestOf(ordered);
      const latest = ordered[0];
      const previous = ordered[1] || null;

      const improvement = previous
        ? latest.better_direction === "lower"
          ? previous.value - latest.value
          : latest.value - previous.value
        : null;

      return {
        key: resultKey(latest),
        latest,
        best,
        previous,
        improvement,
        history: ordered,
      };
    });
  }, [results]);

  const pbCount = groups.filter(
    (group) => group.latest.category === "personal_best"
  ).length;

  const benchmarkCount = groups.filter(
    (group) => group.latest.category === "fitness_benchmark"
  ).length;

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!athleteId || !authUserId || !canManage) {
      setError("You do not have permission to add this result.");
      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setError("Enter a result greater than zero.");
      return;
    }

    if (!effectiveSport || !effectiveEvent || !effectiveUnit) {
      setError("Complete the sport, event and unit fields.");
      return;
    }

    if (!recordedDate || recordedDate > today()) {
      setError("Choose a valid date that is not in the future.");
      return;
    }

    setSaving(true);

    try {
      const { error: insertError } = await supabase
        .from("athlete_performance_results")
        .insert({
          athlete_profile_id: athleteId,
          category,
          sport: effectiveSport,
          event_name: effectiveEvent,
          value: numericValue,
          unit: effectiveUnit,
          better_direction: effectiveDirection,
          recorded_at: `${recordedDate}T12:00:00`,
          competition_name: competition.trim() || null,
          notes: notes.trim() || null,
          recorded_by: authUserId,
          verification_status: "self_reported",
        });

      if (insertError) throw insertError;

      await loadResults(athleteId);

      setValue("");
      setNotes("");
      setCompetition("");
      setSuccess(
        "Result recorded! Every effort adds to your journey."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your result."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <section className="mx-auto max-w-6xl px-6 py-12">
          Loading athlete performance...
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-6 py-10 text-white">
        <Link
          href="/dashboard/development"
          className="text-sm text-[#D8F200] hover:underline"
        >
          ← Back to Athlete Development
        </Link>

        <div className="mt-8 rounded-3xl border border-[#D8F200]/20 bg-[#D8F200]/10 p-7 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D8F200]">
            RADR / Athlete Development
          </p>

          <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
            Progress is King.
          </h1>

          <p className="mt-4 max-w-2xl text-white/75">
            Every result tells part of your story. Celebrate the
            improvements, learn from the challenges and keep showing up.
            Your journey. Your pace. Your potential.
          </p>

          <p className="mt-5 text-sm font-semibold text-[#D8F200]">
            {athleteName}&apos;s Performance
            {guardianManaged ? " • Guardian-managed" : ""}
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-500/20 p-4 text-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl bg-green-500/20 p-4 text-green-100">
            {success}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Results Recorded", count: results.length },
            { label: "PB Events Tracked", count: pbCount },
            { label: "Fitness Tests Tracked", count: benchmarkCount },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/10 p-6"
            >
              <p className="text-sm text-white/60">{item.label}</p>
              <p className="mt-3 text-4xl font-extrabold">
                {item.count}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <h2 className="text-2xl font-extrabold">
              Your Performance Journey
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Your best result is calculated from your recorded history.
              Improvement is measured against your previous result.
            </p>

            {groups.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-8">
                <h3 className="text-xl font-bold">
                  Every journey starts somewhere.
                </h3>
                <p className="mt-3 text-white/65">
                  Record your first result and start building a history
                  of your effort and improvement.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {groups.map((group) => {
                  const { latest, best, improvement } = group;
                  const isLatestBest = latest.value === best.value;

                  return (
                    <div
                      key={group.key}
                      className="rounded-3xl border border-white/10 bg-white/10 p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#D8F200]">
                            {latest.category === "personal_best"
                              ? "Personal Best"
                              : "Fitness Benchmark"}
                            {" • "}
                            {latest.sport}
                          </p>

                          <h3 className="mt-2 text-xl font-bold">
                            {latest.event_name}
                          </h3>
                        </div>

                        {isLatestBest && (
                          <span className="rounded-full bg-[#D8F200]/15 px-3 py-1 text-xs font-bold text-[#D8F200]">
                            Best Recorded
                          </span>
                        )}
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-[#081642] p-4">
                          <p className="text-xs text-white/50">
                            Latest Result
                          </p>
                          <p className="mt-2 text-2xl font-extrabold">
                            {displayValue(latest.value, latest.unit)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#081642] p-4">
                          <p className="text-xs text-white/50">
                            Personal Best
                          </p>
                          <p className="mt-2 text-2xl font-extrabold text-[#D8F200]">
                            {displayValue(best.value, best.unit)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm text-white/70">
                        {improvement === null
                          ? "First result recorded. Your journey has begun."
                          : improvement > 0
                            ? `Great progress! Improved by ${Number(improvement.toFixed(3))} ${latest.unit} since your previous result.`
                            : improvement === 0
                              ? "Matched your previous result. Consistency counts."
                              : "Not every attempt is a PB. Keep showing up and giving your best."}
                      </p>

                      <details className="mt-5 border-t border-white/10 pt-4">
                        <summary className="cursor-pointer text-sm font-semibold text-[#D8F200]">
                          View history ({group.history.length})
                        </summary>

                        <div className="mt-4 space-y-2">
                          {group.history.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#081642] p-3 text-sm"
                            >
                              <span>
                                {displayValue(item.value, item.unit)}
                              </span>
                              <span className="text-white/55">
                                {formatDate(item.recorded_at)}
                              </span>
                              {item.competition_name && (
                                <span className="w-full text-xs text-white/50">
                                  {item.competition_name}
                                </span>
                              )}
                              {item.notes && (
                                <span className="w-full text-xs text-white/50">
                                  {item.notes}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="h-fit rounded-3xl border border-white/10 bg-white/10 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-[#D8F200]">
              Keep Getting Better
            </p>

            <h2 className="mt-2 text-2xl font-extrabold">
              Record a Result
            </h2>

            {!canManage ? (
              <p className="mt-5 text-sm text-white/65">
                You can view these results, but you do not have
                permission to add new ones.
              </p>
            ) : (
              <form onSubmit={handleSave} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm">
                    Result Type
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const next = e.target.value as Category;
                      setCategory(next);
                      setEventChoice(
                        next === "fitness_benchmark"
                          ? BENCHMARKS[0].name
                          : PB_EVENTS[0].name
                      );
                    }}
                    className="w-full rounded-xl bg-[#081642] p-3"
                  >
                    <option value="fitness_benchmark">
                      Fitness Benchmark
                    </option>
                    <option value="personal_best">
                      Personal Best
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm">Sport</label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full rounded-xl bg-[#081642] p-3"
                  >
                    {RADR_SPORTS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                    <option value={CUSTOM}>Other sport</option>
                  </select>

                  {sport === CUSTOM && (
                    <input
                      value={customSport}
                      onChange={(e) => setCustomSport(e.target.value)}
                      placeholder="Enter sport"
                      maxLength={80}
                      className="mt-2 w-full rounded-xl bg-[#081642] p-3"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm">
                    Test or Event
                  </label>
                  <select
                    value={eventChoice}
                    onChange={(e) => setEventChoice(e.target.value)}
                    className="w-full rounded-xl bg-[#081642] p-3"
                  >
                    {eventOptions.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                    <option value={CUSTOM}>Custom event</option>
                  </select>
                </div>

                {isCustomEvent && (
                  <>
                    <input
                      value={customEvent}
                      onChange={(e) => setCustomEvent(e.target.value)}
                      placeholder="Event name"
                      maxLength={100}
                      className="w-full rounded-xl bg-[#081642] p-3"
                      required
                    />

                    <div>
                      <label className="mb-2 block text-sm">
                        Unit
                      </label>
                      <select
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        className="w-full rounded-xl bg-[#081642] p-3"
                      >
                        <option value="reps">Repetitions</option>
                        <option value="seconds">Seconds</option>
                        <option value="cm">Centimetres</option>
                        <option value="metres">Metres</option>
                        <option value="kg">Kilograms</option>
                        <option value="level">Level</option>
                        <option value="points">Points</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm">
                        Better Performance
                      </label>
                      <select
                        value={customDirection}
                        onChange={(e) =>
                          setCustomDirection(
                            e.target.value as Direction
                          )
                        }
                        className="w-full rounded-xl bg-[#081642] p-3"
                      >
                        <option value="higher">
                          Higher result
                        </option>
                        <option value="lower">
                          Lower result
                        </option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-2 block text-sm">
                    Result ({effectiveUnit})
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={
                      effectiveUnit === "seconds"
                        ? "Enter total seconds"
                        : "Enter result"
                    }
                    className="w-full rounded-xl bg-[#081642] p-3"
                    required
                  />
                  {effectiveUnit === "seconds" && (
                    <p className="mt-1 text-xs text-white/50">
                      For 2 minutes 35 seconds, enter 155.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm">
                    Date
                  </label>
                  <input
                    type="date"
                    value={recordedDate}
                    max={today()}
                    onChange={(e) => setRecordedDate(e.target.value)}
                    className="w-full rounded-xl bg-[#081642] p-3"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm">
                    Competition or Session (optional)
                  </label>
                  <input
                    value={competition}
                    onChange={(e) => setCompetition(e.target.value)}
                    maxLength={150}
                    placeholder="e.g. Club athletics"
                    className="w-full rounded-xl bg-[#081642] p-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="How did it go?"
                    className="w-full rounded-xl bg-[#081642] p-3"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-[#D8F200] p-3 font-extrabold text-[#081642] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Record My Progress"}
                </button>

                <p className="text-center text-xs text-white/50">
                  Your results are self-reported and private by default.
                </p>
              </form>
            )}
          </aside>
        </div>

        <p className="mt-10 text-center text-sm text-white/55">
          Give your best. Support others. Celebrate every step forward.
        </p>
      </section>
    </AppShell>
  );
}
