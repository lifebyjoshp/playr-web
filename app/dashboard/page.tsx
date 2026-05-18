"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  primary_sport: string | null;
  team_name?: string | null;
  position: string | null;
  public_slug: string | null;
};

const actionCards = [
  {
  title: "Open Feed",
  description:
    "See new PLAYRs, recent achievements, and fresh highlights in your network.",
  href: "/feed",
},
{
    title: "Add Experience",
    description:
      "Add current or past teams, clubs, competitions, and playing history.",
    href: "/dashboard/experience",
  },
  {
    title: "Add Achievement",
    description:
      "Show awards, milestones, MVPs, captaincy, selections, and key accomplishments.",
    href: "/dashboard/achievements",
  },
  {
    title: "Add Tournament",
    description:
      "Add tournaments you have played in, including dates, teams, and results.",
    href: "/dashboard/tournaments",
  },
  {
    title: "Add Competition",
    description:
      "Build out the competitions you’ve played in across seasons and divisions.",
    href: "/dashboard/competitions",
  },
  {
    title: "Add Highlight",
    description:
      "Upload or link highlight videos so coaches and recruiters can see your game.",
    href: "/dashboard/highlights",
  },
  {
    title: "Edit Public Profile",
    description:
      "Control your public slug, headline, bio, and profile visibility.",
    href: "/dashboard/public-profile",
  },
  {
  title: "Explore Athletes",
  description:
    "Browse public athlete profiles the way coaches and recruiters would.",
  href: "/explore",
},
];

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      setProfileMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setProfileMessage("Could not load user session.");
        setLoadingProfile(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, role, primary_sport, position, public_slug"
        )
        .eq("id", user.id)
        .single();

      if (error) {
        setProfileMessage("Could not load profile data yet.");
        setLoadingProfile(false);
        return;
      }

      setProfile(data);
      setLoadingProfile(false);
    };

    loadProfile();
  }, []);

  const completionItems = [
    profile?.full_name,
    profile?.email,
    profile?.role,
    profile?.primary_sport,
    profile?.position,
  ];

  const completedCount = completionItems.filter(Boolean).length;
  const completionPercentage = Math.round(
    (completedCount / completionItems.length) * 100
  );

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
            Dashboard
          </p>
          <h1 className="text-4xl font-extrabold md:text-5xl">
            Build your PLAYR profile
          </h1>
          <p className="mt-4 max-w-3xl text-white/75">
            Start with the basics, then keep building your athlete presence over
            time. Add your playing experience, achievements, tournaments,
            highlights, and more.
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
          <h2 className="mb-6 text-2xl font-bold">My Profile</h2>

          {loadingProfile ? (
            <div className="rounded-2xl bg-[#081642] p-5 text-white/70">
              Loading profile...
            </div>
          ) : profile ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl bg-[#081642] p-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#D8F200]">
                    Name
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {profile.full_name || "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#D8F200]">
                    Email
                  </p>
                  <p className="mt-1 text-white/80">
                    {profile.email || "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#D8F200]">
                    Role
                  </p>
                  <p className="mt-1 text-white/80">
                    {profile.role || "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#D8F200]">
                    Primary Sport
                  </p>
                  <p className="mt-1 text-white/80">
                    {profile.primary_sport || "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#D8F200]">
                    Position
                  </p>
                  <p className="mt-1 text-white/80">
                    {profile.position || "Not set"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-[#081642] p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-[#D8F200]">
                  Profile Completion
                </p>
                <h3 className="mt-3 text-5xl font-extrabold">
                  {completionPercentage}%
                </h3>

                <div className="mt-4 h-4 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#D8F200]"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>

                <p className="mt-4 text-white/70">
                  Complete more sections to strengthen your athlete profile.
                </p>

                <div className="mt-6">
                  {profile.public_slug ? (
                    <Link
                      href={`/p/${profile.public_slug}`}
                      className="inline-block rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#0B1F5C] transition hover:scale-[1.02]"
                    >
                      View My Public Profile
                    </Link>
                  ) : (
                    <div className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-200">
                      No public profile slug set yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-red-500/20 p-5 text-red-200">
              {profileMessage || "No profile found yet."}
            </div>
          )}
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-[#D8F200]">
              Profile Progress
            </p>
            <h2 className="mt-3 text-3xl font-extrabold">
              {loadingProfile ? "--" : `${completionPercentage}%`}
            </h2>
            <p className="mt-2 text-white/70">
              You’ve started your athlete profile. Keep going to make it stand
              out.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-[#D8F200]">
              Current Focus
            </p>
            <h2 className="mt-3 text-2xl font-extrabold">Complete Experience</h2>
            <p className="mt-2 text-white/70">
              Add your teams, competitions, and playing history first.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-[#D8F200]">
              Next Best Action
            </p>
            <h2 className="mt-3 text-2xl font-extrabold">Add Highlights</h2>
            <p className="mt-2 text-white/70">
              Video and image content will make your profile more compelling.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {actionCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:bg-white/15"
            >
              <div className="mb-4 inline-flex rounded-full bg-[#D8F200] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#0B1F5C]">
                Action
              </div>

              <h3 className="text-2xl font-extrabold">{card.title}</h3>
              <p className="mt-3 text-white/70">{card.description}</p>

              <div className="mt-6 text-sm font-semibold text-[#D8F200]">
                Open →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}