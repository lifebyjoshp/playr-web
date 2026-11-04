
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../../lib/supabase";

type Direction = "higher" | "lower";
type Unit = "seconds" | "reps" | "cm" | "metres" | "kg" | "level";

type Activity = {
  name: string;
  unit: Unit;
  direction: Direction;
};

type Result = {
  id: string;
  athlete_profile_id: string;
  category: string;
  sport: string;
  event_name: string;
  value: number;
  unit: string;
  better_direction: Direction;
  recorded_at: string;
  competition_name: string | null;
  notes: string | null;
  recorded_by: string | null;
  verification_status: string;
};

type Props = {
  athleteId: string | null;
  authUserId: string | null;
  canManage: boolean;
};

const LIBRARY: Activity[] = [
  { name: "Push-ups", unit: "reps", direction: "higher" },
  { name: "Sit-ups", unit: "reps", direction: "higher" },
  { name: "Pull-ups", unit: "reps", direction: "higher" },
  { name: "Plank Hold", unit: "seconds", direction: "higher" },
  { name: "Beep Test", unit: "level", direction: "higher" },
  { name: "Standing Long Jump", unit: "cm", direction: "higher" },
  { name: "Grip Strength", unit: "kg", direction: "higher" },
  { name: "10m Sprint", unit: "seconds", direction: "lower" },
  { name: "20m Sprint", unit: "seconds", direction: "lower" },
  { name: "40m Sprint", unit: "seconds", direction: "lower" },
  { name: "60m Sprint", unit: "seconds", direction: "lower" },
  { name: "100m Run", unit: "seconds", direction: "lower" },
  { name: "200m Run", unit: "seconds", direction: "lower" },
  { name: "400m Run", unit: "seconds", direction: "lower" },
  { name: "800m Run", unit: "seconds", direction: "lower" },
  { name: "1500m Run", unit: "seconds", direction: "lower" },
  { name: "5km Run", unit: "seconds", direction: "lower" },
  { name: "10km Run", unit: "seconds", direction: "lower" },
  { name: "50m Freestyle", unit: "seconds", direction: "lower" },
  { name: "100m Freestyle", unit: "seconds", direction: "lower" },
  { name: "200m Freestyle", unit: "seconds", direction: "lower" },
  { name: "50m Backstroke", unit: "seconds", direction: "lower" },
  { name: "100m Backstroke", unit: "seconds", direction: "lower" },
  { name: "50m Breaststroke", unit: "seconds", direction: "lower" },
  { name: "100m Breaststroke", unit: "seconds", direction: "lower" },
  { name: "50m Butterfly", unit: "seconds", direction: "lower" },
  { name: "100m Butterfly", unit: "seconds", direction: "lower" },
  { name: "200m Individual Medley", unit: "seconds", direction: "lower" },
  { name: "Long Jump", unit: "metres", direction: "higher" },
  { name: "High Jump", unit: "metres", direction: "higher" },
  { name: "Shot Put", unit: "metres", direction: "higher" },
  { name: "Discus", unit: "metres", direction: "higher" },
  { name: "Javelin", unit: "metres", direction: "higher" },
];

const inputClass =
  "w-full min-w-0 rounded-xl border border-white/10 bg-[#081642] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D8F200] md:px-4 md:py-3 md:text-base";

function today() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(value: number) {
  const total = Math.round(value * 1000);
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const millis = total % 1000;

  const ss = String(seconds).padStart(2, "0");
  const ms = String(millis).padStart(3, "0");

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${ss}.${ms}`;
  }
  if (minutes > 0) return `${minutes}:${ss}.${ms}`;
  return `${seconds}.${ms}s`;
}

function formatValue(value: number, unit: string) {
  return unit === "seconds" || unit === "s"
    ? formatDuration(value)
    : `${value} ${unit}`;
}

function parseDuration(
  hours: string,
  minutes: string,
  seconds: string,
  milliseconds: string
): number | null {
  const parts = [hours, minutes, seconds, milliseconds];
  if (parts.every((part) => part.trim() === "")) return null;

  const numbers = parts.map((part) =>
    part.trim() === "" ? 0 : Number(part)
  );

  if (
    numbers.some((n) => !Number.isInteger(n) || n < 0) ||
    numbers[1] >= 60 ||
    numbers[2] >= 60 ||
    numbers[3] >= 1000
  ) {
    return null;
  }

  const value =
    numbers[0] * 3600 +
    numbers[1] * 60 +
    numbers[2] +
    numbers[3] / 1000;

  return value > 0 ? value : null;
}

function durationParts(value: number) {
  const ms = Math.round(value * 1000);
  return {
    hours: String(Math.floor(ms / 3600000)),
    minutes: String(Math.floor((ms % 3600000) / 60000)),
    seconds: String(Math.floor((ms % 60000) / 1000)),
    milliseconds: String(ms % 1000).padStart(3, "0"),
  };
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function activityKey(result: Result) {
  return `${normalizeName(result.event_name)}|${result.unit}|${result.better_direction}`;
}

function isBetter(
  value: number,
  comparison: number,
  direction: Direction
) {
  return direction === "lower"
    ? value < comparison
    : value > comparison;
}

function progressText(
  baseline: number,
  best: number,
  direction: Direction
) {
  const improvement =
    direction === "lower"
      ? baseline - best
      : best - baseline;

  if (Math.abs(improvement) < 0.000001) {
    return "Baseline";
  }

  return `+${((improvement / baseline) * 100).toFixed(1)}%`;
}

export default function PerformancePanel({
  athleteId,
  authUserId,
  canManage,
}: Props) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [activitySearch, setActivitySearch] = useState("");
  const [selectedActivity, setSelectedActivity] =
    useState<Activity | null>(null);

  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState<Unit>("reps");
  const [customDirection, setCustomDirection] =
    useState<Direction>("higher");
  const [isCustom, setIsCustom] = useState(false);

  const [numericValue, setNumericValue] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [milliseconds, setMilliseconds] = useState("");
  const [recordedDate, setRecordedDate] = useState(today);
  const [competitionName, setCompetitionName] = useState("");
  const [notes, setNotes] = useState("");

  const loadResults = useCallback(async () => {
    if (!athleteId) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("athlete_performance_results")
      .select("*")
      .eq("athlete_profile_id", athleteId)
      .order("recorded_at", { ascending: false });

    if (error) {
      setMessage(`Unable to load performance: ${error.message}`);
    } else {
      setResults((data || []) as Result[]);
    }

    setLoading(false);
  }, [athleteId]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  const groups = useMemo(() => {
    const map = new Map<string, Result[]>();

    for (const result of results) {
      const key = activityKey(result);
      const existing = map.get(key) || [];
      existing.push(result);
      map.set(key, existing);
    }

    return Array.from(map.entries())
      .map(([key, history]) => {
        const ordered = [...history].sort(
          (a, b) =>
            new Date(a.recorded_at).getTime() -
            new Date(b.recorded_at).getTime()
        );

        const baseline = ordered[0];
        const latest = ordered[ordered.length - 1];
        const direction = baseline.better_direction;

        const best = ordered.reduce((current, item) =>
          isBetter(item.value, current.value, direction)
            ? item
            : current
        );

        return {
          key,
          name: baseline.event_name,
          unit: baseline.unit,
          direction,
          baseline,
          latest,
          best,
          history: [...ordered].reverse(),
          count: ordered.length,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [results]);

  const visibleGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  const availableActivities = useMemo(() => {
    const map = new Map<string, Activity>();

    for (const activity of LIBRARY) {
      map.set(normalizeName(activity.name), activity);
    }

    for (const result of results) {
      const key = normalizeName(result.event_name);

      if (!map.has(key)) {
        map.set(key, {
          name: result.event_name,
          unit: result.unit as Unit,
          direction: result.better_direction,
        });
      }
    }

    return Array.from(map.values())
      .filter((activity) =>
        activity.name
          .toLowerCase()
          .includes(activitySearch.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 40);
  }, [results, activitySearch]);

  function resetForm() {
    setEditingId(null);
    setSelectedActivity(null);
    setActivitySearch("");
    setIsCustom(false);
    setCustomName("");
    setCustomUnit("reps");
    setCustomDirection("higher");
    setNumericValue("");
    setHours("");
    setMinutes("");
    setSeconds("");
    setMilliseconds("");
    setRecordedDate(today());
    setCompetitionName("");
    setNotes("");
  }

  function openNew(activity?: Activity) {
    resetForm();

    if (activity) {
      setSelectedActivity(activity);
      setActivitySearch(activity.name);
    }

    setShowForm(true);
    setMessage("");
  }

  function openEdit(result: Result) {
    resetForm();
    setEditingId(result.id);

    setSelectedActivity({
      name: result.event_name,
      unit: result.unit as Unit,
      direction: result.better_direction,
    });

    setActivitySearch(result.event_name);

    if (result.unit === "seconds" || result.unit === "s") {
      const parts = durationParts(result.value);
      setHours(parts.hours);
      setMinutes(parts.minutes);
      setSeconds(parts.seconds);
      setMilliseconds(parts.milliseconds);
    } else {
      setNumericValue(String(result.value));
    }

    const date = new Date(result.recorded_at);

    setRecordedDate(
      [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-")
    );

    setCompetitionName(result.competition_name || "");
    setNotes(result.notes || "");
    setShowForm(true);
    setMessage("");
  }

  async function saveResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManage || !athleteId || !authUserId) {
      setMessage("You do not have permission to update performance.");
      return;
    }

    let activity = selectedActivity;

    if (isCustom && !editingId) {
      const name = customName.trim().replace(/\s+/g, " ");

      if (!name) {
        setMessage("Enter an activity name.");
        return;
      }

      const existing = [
        ...LIBRARY,
        ...groups.map((group) => ({
          name: group.name,
          unit: group.unit as Unit,
          direction: group.direction,
        })),
      ].find(
        (item) =>
          normalizeName(item.name) === normalizeName(name)
      );

      if (existing) {
        setMessage(
          `This activity already exists as "${existing.name}". Select it instead.`
        );
        return;
      }

      activity = {
        name,
        unit: customUnit,
        direction: customDirection,
      };
    }

    if (!activity) {
      setMessage("Select an activity.");
      return;
    }

    const value =
      activity.unit === "seconds" || activity.unit === "s"
        ? parseDuration(hours, minutes, seconds, milliseconds)
        : Number(numericValue);

    if (value === null || !Number.isFinite(value) || value <= 0) {
      setMessage("Enter a valid result greater than zero.");
      return;
    }

    if (!recordedDate || recordedDate > today()) {
      setMessage("Select a valid recording date.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      athlete_profile_id: athleteId,
      category: "fitness_benchmark",
      sport: "Fitness",
      event_name: activity.name,
      value,
      unit: activity.unit,
      better_direction: activity.direction,
      recorded_at: `${recordedDate}T12:00:00`,
      competition_name: competitionName.trim() || null,
      notes: notes.trim() || null,
      recorded_by: authUserId,
      verification_status: "self_reported",
    };

    const response = editingId
      ? await supabase
          .from("athlete_performance_results")
          .update(payload)
          .eq("id", editingId)
          .eq("athlete_profile_id", athleteId)
      : await supabase
          .from("athlete_performance_results")
          .insert(payload);

    setSaving(false);

    if (response.error) {
      setMessage(
        `Unable to save result: ${response.error.message}`
      );
      return;
    }

    const wasEditing = Boolean(editingId);

    resetForm();
    setShowForm(false);
    await loadResults();

    setMessage(
      wasEditing ? "Result updated." : "Result recorded."
    );
  }

  const resultHistory = (group: (typeof groups)[number]) => (
    <div className="space-y-2">
      {group.history.map((result) => (
        <div
          key={result.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#081642] p-3 md:p-4"
        >
          <div>
            <p className="text-sm font-bold md:text-base">
              {formatValue(result.value, result.unit)}
            </p>

            <p className="mt-1 text-xs text-white/50">
              {formatDate(result.recorded_at)}
              {result.competition_name
                ? ` • ${result.competition_name}`
                : ""}
            </p>

            {result.notes && (
              <p className="mt-1 text-xs text-white/60">
                {result.notes}
              </p>
            )}
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => openEdit(result)}
              className="rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10"
            >
              Edit
            </button>
          )}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="rounded-xl bg-white/10 p-4 text-sm text-white/60">
        Loading Fitness &amp; Performance...
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-7">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="hidden text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200] md:block">
            Fitness &amp; Performance
          </p>

          <h2 className="text-base font-extrabold md:mt-2 md:text-2xl">
            Your activities. Your progress.
          </h2>

          <p className="mt-1 text-xs text-white/60 md:mt-2 md:text-sm">
            Track your results and celebrate improvement.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              if (showForm) {
                resetForm();
                setShowForm(false);
              } else {
                openNew();
              }
            }}
            className="hidden rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#081642] md:block"
          >
            {showForm ? "Close Form" : "+ Add Result"}
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-sm">
          {message}
        </div>
      )}

      {/* MOBILE SUMMARY */}
      <div className="grid grid-cols-3 gap-1.5 md:hidden">
        {[
          ["Activities", groups.length],
          ["Attempts", results.length],
          ["PBs", groups.length],
        ].map(([label, number]) => (
          <div
            key={label}
            className="rounded-xl border border-white/10 bg-white/10 px-2 py-3 text-center"
          >
            <p className="text-[10px] uppercase text-white/50">
              {label}
            </p>

            <p className="mt-1 text-xl font-extrabold">
              {number}
            </p>
          </div>
        ))}
      </div>

      {/* DESKTOP SUMMARY */}
      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {[
          ["Activities Tracked", groups.length],
          ["Total Attempts", results.length],
          ["Personal Bests", groups.length],
        ].map(([label, number]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-white/10 p-5"
          >
            <p className="text-xs uppercase text-white/50">
              {label}
            </p>

            <p className="mt-3 text-3xl font-extrabold">
              {number}
            </p>
          </div>
        ))}
      </div>

      {/* MOBILE RECORD BUTTON */}
      {canManage && (
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              openNew();
            }
          }}
          className="w-full rounded-xl bg-[#D8F200] px-4 py-3 text-sm font-extrabold text-[#081642] md:hidden"
        >
          {showForm ? "− Close Result Form" : "+ Record Result"}
        </button>
      )}

      {/* RECORDING FORM */}
      {showForm && canManage && (
        <div className="rounded-2xl border border-[#D8F200]/25 bg-white/10 p-3 md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold md:text-2xl">
              {editingId ? "Edit Result" : "Record Result"}
            </h3>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="text-xs text-white/60"
            >
              Close
            </button>
          </div>

          <form onSubmit={saveResult} className="mt-4 space-y-4">
            {!editingId && (
              <div>
                <label className="mb-2 block text-sm">
                  Activity
                </label>

                {!isCustom ? (
                  <>
                    <input
                      className={inputClass}
                      value={activitySearch}
                      onChange={(event) => {
                        setActivitySearch(event.target.value);
                        setSelectedActivity(null);
                      }}
                      placeholder="Search activities..."
                    />

                    {!selectedActivity && (
                      <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-[#081642]">
                        {availableActivities.map((activity) => (
                          <button
                            key={activity.name}
                            type="button"
                            onClick={() => {
                              setSelectedActivity(activity);
                              setActivitySearch(activity.name);
                            }}
                            className="block w-full border-b border-white/10 px-3 py-2.5 text-left text-sm hover:bg-white/10"
                          >
                            {activity.name}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustom(true);
                        setSelectedActivity(null);
                      }}
                      className="mt-3 text-xs font-bold text-[#D8F200]"
                    >
                      + Create custom activity
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <input
                      className={inputClass}
                      value={customName}
                      onChange={(event) =>
                        setCustomName(event.target.value)
                      }
                      placeholder="Activity name"
                    />

                    <select
                      className={inputClass}
                      value={customUnit}
                      onChange={(event) =>
                        setCustomUnit(event.target.value as Unit)
                      }
                    >
                      <option value="reps">Repetitions</option>
                      <option value="seconds">Time</option>
                      <option value="cm">Centimetres</option>
                      <option value="metres">Metres</option>
                      <option value="kg">Kilograms</option>
                      <option value="level">Level</option>
                    </select>

                    <select
                      className={inputClass}
                      value={customDirection}
                      onChange={(event) =>
                        setCustomDirection(
                          event.target.value as Direction
                        )
                      }
                    >
                      <option value="higher">
                        Higher is better
                      </option>
                      <option value="lower">
                        Lower is better
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsCustom(false)}
                      className="text-xs text-white/60"
                    >
                      Back to activity library
                    </button>
                  </div>
                )}
              </div>
            )}

            {(selectedActivity || isCustom) && (
              <>
                <div>
                  <label className="mb-2 block text-sm">
                    Result
                    {selectedActivity
                      ? ` • ${selectedActivity.name}`
                      : ""}
                  </label>

                  {(isCustom
                    ? customUnit
                    : selectedActivity?.unit) === "seconds" ? (
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        ["Hrs", hours, setHours],
                        ["Min", minutes, setMinutes],
                        ["Sec", seconds, setSeconds],
                        ["Ms", milliseconds, setMilliseconds],
                      ].map(([label, current, setter]) => (
                        <div key={label as string} className="min-w-0">
                          <label className="mb-1 block text-[10px] text-white/55">
                            {label as string}
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            className={inputClass}
                            value={current as string}
                            onChange={(event) =>
                              (setter as (value: string) => void)(
                                event.target.value
                              )
                            }
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className={inputClass}
                      value={numericValue}
                      onChange={(event) =>
                        setNumericValue(event.target.value)
                      }
                      placeholder="Enter result"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm">
                    Date
                  </label>

                  <input
                    type="date"
                    max={today()}
                    className={inputClass}
                    value={recordedDate}
                    onChange={(event) =>
                      setRecordedDate(event.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm">
                    Event / Competition (optional)
                  </label>

                  <input
                    className={inputClass}
                    value={competitionName}
                    onChange={(event) =>
                      setCompetitionName(event.target.value)
                    }
                    placeholder="e.g. School athletics carnival"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm">
                    Notes (optional)
                  </label>

                  <textarea
                    className={inputClass}
                    rows={2}
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    placeholder="Conditions, effort, technique..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-[#D8F200] px-5 py-3 text-sm font-bold text-[#081642] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Record Result"}
                </button>
              </>
            )}
          </form>
        </div>
      )}

      <input
        className={inputClass}
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
        placeholder="Search tracked activities..."
      />

      {visibleGroups.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/10 p-5 text-center">
          <p className="font-bold">
            {groups.length === 0
              ? "Start your development journey"
              : "No matching activities"}
          </p>

          <p className="mt-1 text-xs text-white/60">
            {groups.length === 0
              ? "Record your first activity to establish a baseline."
              : "Try another search."}
          </p>
        </div>
      ) : (
        <>
          {/* MOBILE ACTIVITY LIST */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/10 md:hidden">
            {visibleGroups.map((group) => {
              const active = expandedKey === group.key;

              return (
                <div
                  key={group.key}
                  className="border-b border-white/10 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedKey(
                        active ? null : group.key
                      )
                    }
                    className={`flex w-full items-center justify-between gap-2 px-3 py-3 text-left ${
                      active ? "bg-[#D8F200]/10" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">
                        {group.name}
                      </p>

                      <p className="mt-1 text-[10px] text-white/45">
                        {group.count} attempts •{" "}
                        {formatDate(group.latest.recorded_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold">
                        {formatValue(
                          group.best.value,
                          group.unit
                        )}
                      </p>

                      <p className="text-[10px] font-bold text-[#D8F200]">
                        {progressText(
                          group.baseline.value,
                          group.best.value,
                          group.direction
                        )}
                      </p>
                    </div>

                    <span className="text-xs text-white/40">
                      {active ? "−" : "+"}
                    </span>
                  </button>

                  {active && (
                    <div className="border-t border-white/10 bg-[#081642]/60 p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold">
                          Result History
                        </p>

                        {canManage && (
                          <button
                            type="button"
                            onClick={() =>
                              openNew({
                                name: group.name,
                                unit: group.unit as Unit,
                                direction: group.direction,
                              })
                            }
                            className="rounded-lg bg-[#D8F200] px-3 py-2 text-xs font-bold text-[#081642]"
                          >
                            + Attempt
                          </button>
                        )}
                      </div>

                      {resultHistory(group)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* DESKTOP ACTIVITY CARDS */}
          <div className="hidden space-y-3 md:block">
            {visibleGroups.map((group) => (
              <div
                key={group.key}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/10"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedKey(
                      expandedKey === group.key
                        ? null
                        : group.key
                    )
                  }
                  className="grid w-full gap-4 p-5 text-left sm:grid-cols-[minmax(0,1.5fr)_1fr_1fr_auto]"
                >
                  <div>
                    <p className="text-lg font-bold">
                      {group.name}
                    </p>

                    <p className="mt-1 text-xs text-white/50">
                      {group.count} attempts
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/45">
                      Personal Best
                    </p>

                    <p className="mt-1 font-bold">
                      {formatValue(
                        group.best.value,
                        group.unit
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/45">
                      Progress
                    </p>

                    <p className="mt-1 font-bold text-[#D8F200]">
                      {progressText(
                        group.baseline.value,
                        group.best.value,
                        group.direction
                      )}
                    </p>
                  </div>

                  <span className="self-center text-white/50">
                    {expandedKey === group.key ? "−" : "+"}
                  </span>
                </button>

                {expandedKey === group.key && (
                  <div className="border-t border-white/10 bg-[#081642] p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/45">
                          Latest Result
                        </p>

                        <p className="mt-1 font-semibold">
                          {formatValue(
                            group.latest.value,
                            group.unit
                          )}
                        </p>
                      </div>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            openNew({
                              name: group.name,
                              unit: group.unit as Unit,
                              direction: group.direction,
                            })
                          }
                          className="rounded-xl bg-[#D8F200] px-4 py-2 text-sm font-bold text-[#081642]"
                        >
                          + New Attempt
                        </button>
                      )}
                    </div>

                    <h3 className="mb-3 font-bold">
                      Result History
                    </h3>

                    {resultHistory(group)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
