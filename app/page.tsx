"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";

const features = [
  {
    title: "Build Your Athlete Profile",
    description:
      "Bring your sporting journey together in one place — teams, experience, achievements, highlights and more.",
  },
  {
    title: "Track Athlete Development",
    description:
      "Use AD — Athlete Development — to record physical development, track progress and build a long-term history.",
  },
  {
    title: "Show Your Game",
    description:
      "Add highlights and create a profile that gives coaches, recruiters and selectors a clearer picture of who you are.",
  },
  {
    title: "Built for Families",
    description:
      "Parents can create and manage athlete profiles, update AD and help younger athletes build their sporting story.",
  },
  {
    title: "Connect Through Teams",
    description:
      "Build team identities, connect athletes and bring sporting experience into one consistent profile.",
  },
  {
    title: "Get Seen",
    description:
      "A shareable public RADR gives athletes one place to showcase who they are, where they've played and how they're developing.",
  },
];

const journey = [
  {
    number: "01",
    title: "Create your RADR",
    description:
      "Start with your sport, position and basic athlete information.",
  },
  {
    number: "02",
    title: "Build your story",
    description:
      "Add teams, experience, achievements and highlights.",
  },
  {
    number: "03",
    title: "Update your AD",
    description:
      "Track Athlete Development and create a history of progress over time.",
  },
  {
    number: "04",
    title: "Share your profile",
    description:
      "Give coaches, recruiters and your sporting network one place to find you.",
  },
];

const TRACKED_UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
] as const;

export default function HomePage() {
  const [signupHref, setSignupHref] =
    useState("/signup");

  useEffect(() => {
    const currentParams =
      new URLSearchParams(
        window.location.search
      );

    const signupParams =
      new URLSearchParams();

    TRACKED_UTM_KEYS.forEach((key) => {
      const value =
        currentParams.get(key);

      if (value) {
        signupParams.set(key, value);
      }
    });

    const query =
      signupParams.toString();

    setSignupHref(
      query
        ? `/signup?${query}`
        : "/signup"
    );
  }, []);

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(17,77,255,0.45),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(216,242,0,0.08),transparent_35%)]" />

        <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-12 px-4 py-20 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <div className="inline-flex rounded-full border border-[#D8F200]/30 bg-[#D8F200]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#D8F200]">
              RADR Beta
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Your sporting journey.
              <span className="block text-[#D8F200]">
                Built to be seen.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70 md:text-xl">
              RADR gives athletes one
              place to build their
              sporting profile, track
              Athlete Development,
              showcase highlights and
              make their progress
              visible.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={signupHref}
                className="rounded-xl bg-[#D8F200] px-7 py-4 text-center text-base font-extrabold text-[#0B1F5C] transition hover:scale-[1.02]"
              >
                Build Your RADR
              </Link>

              <Link
                href="/explore"
                className="rounded-xl border border-white/15 bg-white/10 px-7 py-4 text-center text-base font-bold transition hover:bg-white/15"
              >
                Explore Athletes
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/50">
              <span>
                ✓ Athlete Profiles
              </span>

              <span>
                ✓ Athlete Development
              </span>

              <span>
                ✓ Family Accounts
              </span>

              <span>
                ✓ Highlights
              </span>
            </div>
          </div>

          {/* PRODUCT PREVIEW */}
          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-[#114DFF]/20 blur-3xl" />

            <div className="relative rounded-[32px] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur md:p-6">
              <div className="rounded-[26px] bg-[#081642] p-5 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl">
                      <Image
                        src="/icon.png"
                        alt="RADR"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D8F200]">
                        RADR Athlete
                      </p>

                      <h2 className="mt-1 text-2xl font-extrabold">
                        Athlete Profile
                      </h2>

                      <p className="mt-1 text-sm text-white/50">
                        Basketball • Guard
                      </p>
                    </div>
                  </div>

                  <div className="rounded-full bg-[#D8F200] px-3 py-1 text-xs font-extrabold text-[#0B1F5C]">
                    92 RADR
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-white/40">
                      Experience
                    </p>

                    <p className="mt-2 text-2xl font-extrabold">
                      5
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-white/40">
                      Achievements
                    </p>

                    <p className="mt-2 text-2xl font-extrabold">
                      8
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-white/40">
                      Highlights
                    </p>

                    <p className="mt-2 text-2xl font-extrabold">
                      6
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[#D8F200]/20 bg-[#D8F200]/10 p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D8F200]">
                        Athlete
                        Development
                      </p>

                      <p className="mt-2 text-4xl font-extrabold">
                        84
                      </p>

                      <p className="text-xs text-white/50">
                        AD Index
                      </p>
                    </div>

                    <p className="text-sm text-white/55">
                      Updated 8 days ago
                    </p>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[84%] rounded-full bg-[#D8F200]" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-white/40">
                      Height
                    </p>

                    <p className="mt-1 font-bold">
                      168 cm
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-white/40">
                      Vertical Jump
                    </p>

                    <p className="mt-1 font-bold">
                      46 cm
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POSITIONING */}
      <section className="border-y border-white/10 bg-[#081642]">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center md:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D8F200]">
            More Than A Profile
          </p>

          <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">
            Hard work should be visible.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/65">
            Sporting development happens
            over years — not in a single
            game, statistic or highlight.
            RADR helps athletes capture
            that journey and build a
            sporting identity that grows
            with them.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D8F200]">
            Your RADR
          </p>

          <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">
            Everything your sporting
            story needs.
          </h2>

          <p className="mt-5 text-lg leading-8 text-white/65">
            One profile that brings
            together who you are, where
            you&apos;ve played, what
            you&apos;ve achieved and how
            you&apos;re developing.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(
            (feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/10 p-7 backdrop-blur"
              >
                <div className="mb-5 h-2 w-12 rounded-full bg-[#D8F200]" />

                <h3 className="text-xl font-extrabold">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-white/60">
                  {
                    feature.description
                  }
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* AD */}
      <section className="bg-[#081642]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 md:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex rounded-full bg-[#D8F200] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[#0B1F5C]">
              AD • Athlete Development
            </div>

            <h2 className="mt-6 text-4xl font-extrabold md:text-5xl">
              Don&apos;t forget to
              update your AD.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-white/65">
              Development shouldn&apos;t
              disappear into notebooks,
              screenshots and old
              spreadsheets. RADR creates
              a timestamped development
              history that grows with the
              athlete.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Height",
                "Weight",
                "Wingspan",
                "Standing Reach",
                "Vertical Jump",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D8F200] text-xs font-extrabold text-[#0B1F5C]">
                    ✓
                  </div>

                  <span className="font-semibold">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-[#D8F200]/20 bg-[#D8F200]/10 p-6 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D8F200]">
              Athlete Development
            </p>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-7xl font-extrabold">
                  86
                </p>

                <p className="mt-1 font-bold">
                  AD Index
                </p>
              </div>

              <p className="text-sm text-white/55">
                Excellent
              </p>
            </div>

            <div className="mt-7 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[86%] rounded-full bg-[#D8F200]" />
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#081642] p-5">
                <p className="text-xs text-white/45">
                  Vertical Jump
                </p>

                <p className="mt-2 text-2xl font-extrabold">
                  46 cm
                </p>

                <p className="mt-2 text-sm font-semibold text-[#D8F200]">
                  ↑ 12.2%
                </p>
              </div>

              <div className="rounded-2xl bg-[#081642] p-5">
                <p className="text-xs text-white/45">
                  Height
                </p>

                <p className="mt-2 text-2xl font-extrabold">
                  168 cm
                </p>

                <p className="mt-2 text-sm text-white/50">
                  Updated 18 days ago
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section className="mx-auto max-w-7xl px-4 py-24 md:px-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D8F200]">
            How RADR Works
          </p>

          <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">
            Build it once. Keep it growing.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {journey.map((step) => (
            <div
              key={step.number}
              className="rounded-3xl border border-white/10 bg-white/10 p-7"
            >
              <p className="text-4xl font-extrabold text-[#D8F200]">
                {step.number}
              </p>

              <h3 className="mt-5 text-xl font-bold">
                {step.title}
              </h3>

              <p className="mt-3 leading-7 text-white/60">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="bg-[#081642]">
        <div className="mx-auto max-w-7xl px-4 py-24 md:px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D8F200]">
              Built For The Sporting
              Community
            </p>

            <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">
              One platform. Different
              perspectives.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                Athletes
              </p>

              <h3 className="mt-3 text-2xl font-extrabold">
                Build your story.
              </h3>

              <p className="mt-3 leading-7 text-white/60">
                Showcase where
                you&apos;ve been, what
                you&apos;ve achieved and
                where you&apos;re
                heading.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                Families
              </p>

              <h3 className="mt-3 text-2xl font-extrabold">
                Help them grow.
              </h3>

              <p className="mt-3 leading-7 text-white/60">
                Manage younger athletes
                and help capture the
                sporting moments that
                matter.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                Coaches
              </p>

              <h3 className="mt-3 text-2xl font-extrabold">
                See more.
              </h3>

              <p className="mt-3 leading-7 text-white/60">
                Understand an athlete
                beyond one performance or
                one season.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                Recruiters
              </p>

              <h3 className="mt-3 text-2xl font-extrabold">
                Discover potential.
              </h3>

              <p className="mt-3 leading-7 text-white/60">
                Review athlete profiles,
                sporting history,
                highlights and
                development in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BETA */}
      <section className="mx-auto max-w-5xl px-4 py-24 text-center md:px-6">
        <div className="rounded-[36px] border border-[#D8F200]/25 bg-[linear-gradient(135deg,rgba(216,242,0,0.14),rgba(17,77,255,0.16))] p-8 md:p-14">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D8F200]">
            RADR Beta
          </p>

          <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">
            Help shape what comes next.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/65">
            RADR is launching with
            athletes and families at the
            centre. Your feedback will
            help guide the next
            generation of Athlete
            Development, performance and
            discovery tools.
          </p>

          <Link
            href={signupHref}
            className="mt-8 inline-block rounded-xl bg-[#D8F200] px-8 py-4 text-base font-extrabold text-[#0B1F5C] transition hover:scale-[1.02]"
          >
            Join RADR Beta
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-white/45 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <span className="font-extrabold text-white">
              RADR
            </span>

            <span className="ml-3">
              Build your sporting journey.
            </span>
          </div>

          <div className="flex flex-wrap gap-5">
            <Link
              href="/login"
              className="transition hover:text-white"
            >
              Log in
            </Link>

            <Link
              href={signupHref}
              className="transition hover:text-white"
            >
              Join Beta
            </Link>

            <Link
              href="/explore"
              className="transition hover:text-white"
            >
              Explore
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}