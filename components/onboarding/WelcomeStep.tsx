"use client";

type WelcomeStepProps = {
  displayName: string;
  onContinue: () => void;
};

export default function WelcomeStep({
  displayName,
  onContinue,
}: WelcomeStepProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur md:p-9">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D8F200]">
        Welcome to RADR
      </p>

      <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
        Let&apos;s build your RADR
        {displayName ? `, ${displayName}` : ""}.
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-white/65">
        We&apos;ll start with the essentials and get your athlete
        profile live in around two minutes.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_180px] md:items-center">
        <div>
          <div className="space-y-4">
            {[
              "Tell us a little about you",
              "Choose your sport and position",
              "Add your current team",
              "Add a profile photo",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-4 rounded-2xl bg-[#081642] p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D8F200] text-sm font-extrabold text-[#0B1F5C]">
                  {index + 1}
                </div>

                <p className="font-semibold">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="mt-7 w-full rounded-xl bg-[#D8F200] px-6 py-4 text-base font-extrabold text-[#0B1F5C] transition hover:scale-[1.01] sm:w-auto"
          >
            Build My RADR →
          </button>
        </div>

        <div className="mx-auto hidden md:block">
  <div className="relative h-36 w-36 overflow-hidden rounded-[32px] border border-[#D8F200]/20 bg-[#081642] shadow-xl">
    <img
      src="/icon.png"
      alt="RADR"
      className="h-full w-full object-cover"
    />
  </div>
</div>
      </div>
    </section>
  );
}