"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { BRAND } from "../../../lib/branding";
import { supabase } from "../../../lib/supabase";

type Team = {
  id: string;
  slug: string | null;
  display_name: string;
  sport: string;
  country: string | null;
  state: string | null;
  association_name: string | null;
  competition_name: string | null;
  club_name: string;
  team_name: string;
  age_group: string | null;
  gender: string | null;
  division: string | null;
  season: string | null;
  verification_status: string;
  is_public: boolean;
};

export default function PublicTeamPage() {
  const params = useParams<{ id: string }>();
  const slug = params.id;

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadTeam = async () => {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("teams")
        .select(
          `
          id,
          slug,
          display_name,
          sport,
          country,
          state,
          association_name,
          competition_name,
          club_name,
          team_name,
          age_group,
          gender,
          division,
          season,
          verification_status,
          is_public
        `
        )
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();

      if (error || !data) {
        setTeam(null);
        setMessage(
          error
            ? `Unable to load team: ${error.message}`
            : "This team could not be found or is not publicly available."
        );
        setLoading(false);
        return;
      }

      setTeam(data as Team);
      setLoading(false);
    };

    if (slug) {
      void loadTeam();
    }
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B1F5C] text-white">
        <Navbar />
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8">
            Loading team...
          </div>
        </section>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="min-h-screen bg-[#0B1F5C] text-white">
        <Navbar />
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
              {BRAND.name}
            </p>

            <h1 className="mt-3 text-4xl font-extrabold">Team not found</h1>

            <p className="mt-4 text-white/70">{message}</p>

            <Link
              href="/dashboard/teams"
              className="mt-6 inline-block rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#0B1F5C]"
            >
              Back to Teams
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <section className="relative">
        <div className="h-64 bg-[linear-gradient(135deg,#114DFF,#0B1F5C)]" />

        <div className="mx-auto max-w-6xl px-6">
          <div className="-mt-20 rounded-3xl border border-white/10 bg-[#0B1F5C]/95 p-8 shadow-2xl backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
              {BRAND.name} Team
            </p>

            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
              {team.display_name}
            </h1>

            <p className="mt-3 text-lg text-white/70">
              {[team.sport, team.season].filter(Boolean).join(" • ")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
                {team.verification_status || "unverified"}
              </span>

              {team.division && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                  {team.division}
                </span>
              )}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-[#081642] p-4">
                <p className="text-xs uppercase text-white/50">Association</p>
                <p className="mt-2 font-bold">
                  {team.association_name || "Not set"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#081642] p-4">
                <p className="text-xs uppercase text-white/50">Competition</p>
                <p className="mt-2 font-bold">
                  {team.competition_name || "Not set"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#081642] p-4">
                <p className="text-xs uppercase text-white/50">Age / Gender</p>
                <p className="mt-2 font-bold">
                  {[team.age_group, team.gender].filter(Boolean).join(" ") ||
                    "Not set"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#081642] p-4">
                <p className="text-xs uppercase text-white/50">Location</p>
                <p className="mt-2 font-bold">
                  {[team.state, team.country].filter(Boolean).join(", ") ||
                    "Not set"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}