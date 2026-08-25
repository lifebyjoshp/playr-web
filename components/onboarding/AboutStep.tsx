"use client";

type AboutStepProps = {
  fullName: string;
  preferredName: string;
  dateOfBirth: string;
  gender: string;

  onFullNameChange: (value: string) => void;
  onPreferredNameChange: (value: string) => void;
  onDateOfBirthChange: (value: string) => void;
  onGenderChange: (value: string) => void;

  onBack: () => void;
  onContinue: () => void;
};

export default function AboutStep({
  fullName,
  preferredName,
  dateOfBirth,
  gender,
  onFullNameChange,
  onPreferredNameChange,
  onDateOfBirthChange,
  onGenderChange,
  onBack,
  onContinue,
}: AboutStepProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur md:p-9">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D8F200]">
        About You
      </p>

      <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
        Start with the athlete.
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-white/65">
        These details help build the foundation of your RADR profile.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">
            Full Name
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(event) =>
              onFullNameChange(event.target.value)
            }
            placeholder="Enter your full name"
            className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Preferred Name
          </label>

          <input
            type="text"
            value={preferredName}
            onChange={(event) =>
              onPreferredNameChange(event.target.value)
            }
            placeholder="Optional"
            className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Date of Birth
          </label>

          <input
            type="date"
            value={dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) =>
              onDateOfBirthChange(event.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">
            Gender
          </label>

          <select
            value={gender}
            onChange={(event) =>
              onGenderChange(event.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
          >
            <option value="">Select gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">
              Prefer not to say
            </option>
          </select>
        </div>
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
          className="rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C]"
        >
          Continue →
        </button>
      </div>
    </section>
  );
}