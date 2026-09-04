"use client";

import Link from "next/link";
import { useState } from "react";
import AppShell from "../../../components/AppShell";

export default function RadrResumePage() {
  const [showPremiumMessage, setShowPremiumMessage] = useState(false);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10">
          <div className="grid gap-10 p-6 md:p-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#D8F200] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#0B1F5C]">
                  RADR Premium
                </span>

                <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                  Coming Soon
                </span>
              </div>

              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
                RADR Resumé
              </p>

              <h1 className="mt-3 text-4xl font-extrabold leading-tight md:text-6xl">
                Your sporting journey.
                <span className="block text-[#D8F200]">
                  Ready to be shared.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
                Turn your RADR into a professional athlete resumé that brings
                your experience, achievements, highlights and development
                together in one place.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowPremiumMessage(true)}
                  className="rounded-xl bg-[#D8F200] px-6 py-4 text-sm font-extrabold text-[#0B1F5C] transition hover:opacity-90"
                >
                  Create My RADR Resumé
                </button>

                <Link
                  href="/dashboard"
                  className="rounded-xl border border-white/15 bg-white/5 px-6 py-4 text-center text-sm font-bold transition hover:bg-white/10"
                >
                  Back to Dashboard
                </Link>
              </div>

              {showPremiumMessage && (
                <div className="mt-5 max-w-xl rounded-2xl border border-[#D8F200]/25 bg-[#D8F200]/10 p-5">
                  <p className="font-bold text-[#D8F200]">
                    Coming soon with RADR Premium.
                  </p>

                  <p className="mt-2 text-sm leading-6 text-white/65">
                    Keep building your RADR now. The information you add today
                    will help build your athlete resumé when this feature
                    launches.
                  </p>
                </div>
              )}
            </div>

            <div className="mx-auto w-full max-w-md">
              <div className="rounded-3xl bg-white p-3 shadow-2xl shadow-black/30">
                <div className="overflow-hidden rounded-2xl bg-[#F7F8FA] text-[#0B1F5C]">
                  <div className="bg-[#0B1F5C] p-6 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                      RADR
                    </p>

                    <h2 className="mt-3 text-2xl font-extrabold">
                      Alex Morgan
                    </h2>

                    <p className="mt-1 text-sm text-white/65">
                      Basketball · Guard
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold">
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        Newcastle, NSW
                      </span>

                      <span className="rounded-full bg-[#D8F200] px-3 py-1 text-[#0B1F5C]">
                        Athlete Profile
                      </span>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#114DFF]">
                        Athlete Profile
                      </p>

                      <p className="mt-2 text-xs font-semibold text-[#0B1F5C]/75">
                        Competitive junior basketball athlete
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[#0B1F5C]/75">
                        Guard · NSW · Australia
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#114DFF]">
                        Experience
                      </p>

                      <p className="mt-2 text-xs font-semibold text-[#0B1F5C]/75">
                        2026 · Junior Premier League
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[#0B1F5C]/75">
                        2025 · Representative Basketball
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#114DFF]">
                        Achievements
                      </p>

                      <p className="mt-2 text-xs font-semibold text-[#0B1F5C]/75">
                        State Representative Selection
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[#0B1F5C]/75">
                        Tournament Grand Final MVP
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#114DFF]">
                        Athlete Development
                      </p>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-[#0B1F5C]/5 p-2 text-center">
                          <p className="text-sm font-extrabold">168</p>
                          <p className="mt-1 text-[8px] font-bold uppercase text-[#0B1F5C]/40">
                            Height
                          </p>
                        </div>

                        <div className="rounded-lg bg-[#0B1F5C]/5 p-2 text-center">
                          <p className="text-sm font-extrabold">171</p>
                          <p className="mt-1 text-[8px] font-bold uppercase text-[#0B1F5C]/40">
                            Wingspan
                          </p>
                        </div>

                        <div className="rounded-lg bg-[#0B1F5C]/5 p-2 text-center">
                          <p className="text-sm font-extrabold">84</p>
                          <p className="mt-1 text-[8px] font-bold uppercase text-[#0B1F5C]/40">
                            AD Index
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[#0B1F5C]/10 pt-4">
                      <p className="text-[10px] font-bold text-[#0B1F5C]/45">
                        View full athlete profile
                      </p>

                      <p className="mt-1 text-xs font-extrabold text-[#114DFF]">
                        radr.au/p/alex-morgan
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-white/40">
                Concept preview
              </p>
            </div>
          </div>
        </div>

        <section className="py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D8F200]">
              Built from your RADR
            </p>

            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">
              Stop rebuilding your sporting resumé from scratch.
            </h2>

            <p className="mt-5 leading-7 text-white/65">
              Your sporting story already lives inside RADR. RADR Resumé will
              bring it together into a clean format designed for coaches,
              selectors, recruiters and sporting organisations.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6">
              <p className="text-sm font-extrabold text-[#D8F200]">01</p>
              <h3 className="mt-5 text-xl font-bold">
                Built automatically
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Use the information already stored in your RADR profile.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6">
              <p className="text-sm font-extrabold text-[#D8F200]">02</p>
              <h3 className="mt-5 text-xl font-bold">
                Made for athletes
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Showcase experience, achievements, development and highlights.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6">
              <p className="text-sm font-extrabold text-[#D8F200]">03</p>
              <h3 className="mt-5 text-xl font-bold">
                Ready to share
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Present a professional snapshot of your sporting journey.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D8F200]">
            What will be included?
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Athlete Profile",
              "Playing Experience",
              "Achievements",
              "Highlights",
              "Athlete Development",
              "Your RADR Profile",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-[#081642] p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D8F200] text-sm font-extrabold text-[#0B1F5C]">
                    ✓
                  </span>

                  <p className="font-bold">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="rounded-3xl border border-[#D8F200]/20 bg-[#D8F200]/10 p-7 text-center md:p-12">
            <span className="inline-flex rounded-full bg-[#D8F200] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0B1F5C]">
              RADR Premium
            </span>

            <h2 className="mt-6 text-3xl font-extrabold md:text-5xl">
              Build your RADR now.
              <span className="block text-[#D8F200]">
                Your Resumé comes next.
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-white/65">
              Keep adding your experience, achievements, highlights and
              development so your sporting story is ready when RADR Resumé
              launches.
            </p>

            <button
              type="button"
              onClick={() => setShowPremiumMessage(true)}
              className="mt-8 rounded-xl bg-[#D8F200] px-7 py-4 text-sm font-extrabold text-[#0B1F5C]"
            >
              Create My RADR Resumé
            </button>
          </div>
        </section>
      </section>
    </AppShell>
  );
}