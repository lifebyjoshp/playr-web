"use client";

import { useState } from "react";
import {
  OTHER_SPORT_VALUE,
  RADR_SPORTS,
  isCanonicalSport,
} from "../../lib/sports";

const BASKETBALL_POSITIONS = [
  "Point Guard",
  "Shooting Guard",
  "Small Forward",
  "Power Forward",
  "Centre",
];

type SportStepProps = {
  sport: string;
  position: string;
  onSportChange: (value: string) => void;
  onPositionChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export default function SportStep({
  sport,
  position,
  onSportChange,
  onPositionChange,
  onBack,
  onContinue,
}: SportStepProps) {
  const [addingCustomSport, setAddingCustomSport] = useState(
    Boolean(sport) && !isCanonicalSport(sport)
  );

  const isCustomSport =
    addingCustomSport ||
    (Boolean(sport) && !isCanonicalSport(sport));

  const selectedSportValue = isCustomSport
    ? OTHER_SPORT_VALUE
    : sport;

  const handleSportSelect = (value: string) => {
    onPositionChange("");

    if (value === OTHER_SPORT_VALUE) {
      setAddingCustomSport(true);

      if (isCanonicalSport(sport)) {
        onSportChange("");
      }

      return;
    }

    setAddingCustomSport(false);
    onSportChange(value);
  };

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur md:p-9">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D8F200]">
        Your Sport
      </p>

      <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
        What&apos;s your primary sport?
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-white/65">
        Choose the sport that best represents you on RADR. You can add
        your other sports to your profile later.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {RADR_SPORTS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleSportSelect(item)}
            className={`rounded-2xl border p-5 text-left font-bold transition ${
              selectedSportValue === item
                ? "border-[#D8F200] bg-[#D8F200]/10"
                : "border-white/10 bg-[#081642] text-white/75 hover:border-white/20"
            }`}
          >
            {item}
          </button>
        ))}

        <button
          type="button"
          onClick={() => handleSportSelect(OTHER_SPORT_VALUE)}
          className={`rounded-2xl border p-5 text-left font-bold transition ${
            isCustomSport
              ? "border-[#D8F200] bg-[#D8F200]/10"
              : "border-white/10 bg-[#081642] text-white/75 hover:border-white/20"
          }`}
        >
          Other / Sport not listed
        </button>
      </div>

      {isCustomSport && (
        <div className="mt-5 rounded-2xl border border-[#D8F200]/20 bg-[#D8F200]/5 p-5">
          <label className="mb-2 block text-sm font-medium">
            Your sport
          </label>

          <input
            type="text"
            value={sport}
            onChange={(event) =>
              onSportChange(event.target.value)
            }
            placeholder="e.g. Equestrian, Futsal, Squash"
            className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
          />

          <p className="mt-2 text-xs leading-5 text-white/50">
            Can&apos;t find your sport? Enter it here and RADR will
            save the sport name to your profile.
          </p>
        </div>
      )}

      <div className="mt-8">
        <label className="mb-3 block text-sm font-medium">
          Primary Position
        </label>

        {sport === "Basketball" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {BASKETBALL_POSITIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onPositionChange(item)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  position === item
                    ? "border-[#D8F200] bg-[#D8F200]/10"
                    : "border-white/10 bg-[#081642] hover:border-white/20"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        ) : (
          <input
            type="text"
            value={position}
            onChange={(event) =>
              onPositionChange(event.target.value)
            }
            placeholder="e.g. Midfielder, Goal Attack, Fullback"
            className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
          />
        )}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/15 bg-white/10 px-6 py-3 font-semibold"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={onContinue}
          disabled={!sport.trim()}
          className="rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue →
        </button>
      </div>
    </section>
  );
}
