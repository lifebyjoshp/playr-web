"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../../../components/AppShell";
import { BRAND } from "../../../lib/branding";
import { supabase } from "../../../lib/supabase";

type TeamSummary = {
  id: string;
  slug: string | null;
  display_name: string;
  sport: string;
  age_group: string | null;
  gender: string | null;
  division: string | null;
  season: string | null;
  is_current: boolean;
  membership_role: string;
  membership_status: string;
};

type MembershipRow = {
  is_current: boolean;
  membership_role: string;
  membership_status: string;
  teams:
    | {
        id: string;
        slug: string | null;
        display_name: string;
        sport: string;
        age_group: string | null;
        gender: string | null;
        division: string | null;
        season: string | null;
      }
    | {
        id: string;
        slug: string | null;
        display_name: string;
        sport: string;
        age_group: string | null;
        gender: string | null;
        division: string | null;
        season: string | null;
      }[]
    | null;
};

export default function TeamsDashboardPage() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Log in to view your teams.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("player_team_memberships")
        .select(
          `
          is_current,
          membership_role,
          membership_status,
          teams (
            id,
            slug,
            display_name,
            sport,
            age_group,
            gender,
            division,
            season
          )
        `
        )
        .eq("profile_id", user.id)
        .in("membership_status", ["active", "pending", "invited"])
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(`Unable to load teams: ${error.message}`);
        setLoading(false);
        return;
      }

      const memberships = (data || []) as unknown as MembershipRow[];

      const formattedTeams = memberships
        .map((membership) => {
          const team = Array.isArray(membership.teams)
            ? membership.teams[0]
            : membership.teams;

          if (!team) return null;

          return {
            id: team.id,
            slug: team.slug,
            display_name: team.display_name,
            sport: team.sport,
            age_group: team.age_group,
            gender: team.gender,
            division: team.division,
            season: team.season,
            is_current: membership.is_current,
            membership_role: membership.membership_role,
            membership_status: membership.membership_status,
          };
        })
        .filter((team): team is TeamSummary => team !== null);

      setTeams(formattedTeams);
      setLoading(false);
    };

    void loadTeams();
  }, []);

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
              Teams
            </p>

            <h1 className="mt-3 text-4xl font-extrabold">My teams</h1>

            <p className="mt-3 max-w-2xl text-white/70">
              View your current teams, previous teams and team memberships on{" "}
              {BRAND.name}.
            </p>
          </div>

          <Link
            href="/dashboard/teams/new"
            className="rounded-xl bg-[#D8F200] px-5 py-3 text-center font-bold text-[#0B1F5C]"
          >
            Create Team
          </Link>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/75">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6">
            Loading teams...
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
            <h2 className="text-2xl font-bold">No teams added yet</h2>

            <p className="mt-3 text-white/70">
              Create a team or add playing experience to connect your profile
              with an existing team.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/teams/new"
                className="rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#0B1F5C]"
              >
                Create Team
              </Link>

              <Link
                href="/dashboard/experience"
                className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-semibold"
              >
                Add Experience
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {teams.map((team) => (
              <div
                key={team.id}
                className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                      {team.membership_role}
                    </p>

                    <h2 className="mt-2 text-2xl font-extrabold">
                      {team.display_name}
                    </h2>
                  </div>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
                    {team.membership_status}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#081642] p-4">
                    <p className="text-xs uppercase text-white/50">Sport</p>
                    <p className="mt-2 font-bold">{team.sport}</p>
                  </div>

                  <div className="rounded-2xl bg-[#081642] p-4">
                    <p className="text-xs uppercase text-white/50">Season</p>
                    <p className="mt-2 font-bold">
                      {team.season || "Not set"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#081642] p-4">
                    <p className="text-xs uppercase text-white/50">
                      Age / Gender
                    </p>
                    <p className="mt-2 font-bold">
                      {[team.age_group, team.gender]
                        .filter(Boolean)
                        .join(" ") || "Not set"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#081642] p-4">
                    <p className="text-xs uppercase text-white/50">Division</p>
                    <p className="mt-2 font-bold">
                      {team.division || "Not set"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {team.slug && (
                    <Link
                      href={`/teams/${team.slug}`}
                      className="rounded-xl bg-[#D8F200] px-4 py-2 text-sm font-bold text-[#0B1F5C]"
                    >
                      View Team
                    </Link>
                  )}

                  {["admin", "manager", "coach"].includes(
                    team.membership_role
                  ) && (
                    <Link
                      href={`/dashboard/teams/${team.id}/manage`}
                      className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold"
                    >
                      Manage Team
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}