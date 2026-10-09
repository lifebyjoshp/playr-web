"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../../../components/AppShell";
import { BRAND } from "../../../lib/branding";
import { supabase } from "../../../lib/supabase";
import {
  ActiveAthleteContext,
  getActiveAthleteContext,
  setActiveAthleteId,
} from "../../../lib/activeAthlete";

type TeamSummary = {
  id: string;
  slug: string | null;
  display_name: string;
  sport: string;
  age_group: string | null;
  gender: string | null;
  division: string | null;
  season: string | null;
  season_start: string | null;
  season_end: string | null;
  is_current: boolean;
  is_team_admin: boolean;
  membership_role: string;
  membership_status: string;
};

type MembershipRow = {
  is_current: boolean;
  is_team_admin: boolean;
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
        season_start: string | null;
        season_end: string | null;
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
        season_start: string | null;
        season_end: string | null;
      }[]
    | null;
};

function formatSeasonDate(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function getSeasonDateLabel(seasonStart: string | null, seasonEnd: string | null) {
  const start = formatSeasonDate(seasonStart);
  const end = formatSeasonDate(seasonEnd);

  if (start && end) return `${start} – ${end}`;
  if (start) return `Started ${start}`;
  if (end) return `Ended ${end}`;
  return null;
}

export default function TeamsDashboardPage() {
  const [athleteContext, setAthleteContext] =
    useState<ActiveAthleteContext | null>(null);

  const [teams, setTeams] = useState<TeamSummary[]>([]);

  const [loadingAccount, setLoadingAccount] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const [message, setMessage] = useState("");

  const activeAthlete = athleteContext?.activeAthlete || null;

  const canManageActiveAthleteTeams =
    athleteContext?.isSelfManaged ||
    athleteContext?.activeGuardianPermissions?.canManageTeams === true;

  const today = new Date().toISOString().slice(0, 10);

  const isCurrentTeam = (team: TeamSummary) =>
    team.is_current &&
    (!team.season_end || team.season_end >= today);

  const currentTeams = teams.filter(isCurrentTeam);

  const previousTeams = teams.filter(
    (team) => !isCurrentTeam(team)
  );

  const loadTeams = async (profileId: string) => {
    setLoadingTeams(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("player_team_memberships")
        .select(
          `
          is_current,
          is_team_admin,
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
            season,
            season_start,
            season_end
          )
        `
        )
        .eq("profile_id", profileId)
        .in("membership_status", [
          "active",
          "pending",
          "invited",
        ])
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      const memberships =
        (data || []) as unknown as MembershipRow[];

      const formattedTeams = memberships
        .map((membership) => {
          const team = Array.isArray(
            membership.teams
          )
            ? membership.teams[0]
            : membership.teams;

          if (!team) {
            return null;
          }

          return {
            id: team.id,
            slug: team.slug,
            display_name: team.display_name,
            sport: team.sport,
            age_group: team.age_group,
            gender: team.gender,
            division: team.division,
            season: team.season,
            season_start: team.season_start,
            season_end: team.season_end,
            is_current: membership.is_current,
            is_team_admin: membership.is_team_admin,
            membership_role:
              membership.membership_role,
            membership_status:
              membership.membership_status,
          };
        })
        .filter(
          (
            team
          ): team is TeamSummary =>
            team !== null
        );

      setTeams(formattedTeams);
    } catch (error) {
      console.error(
        "Unable to load teams:",
        error
      );

      setTeams([]);

      setMessage(
        error instanceof Error
          ? "Unable to load teams: " +
              error.message
          : "Unable to load teams."
      );
    } finally {
      setLoadingTeams(false);
    }
  };

  const refreshAthleteContext = async () => {
    const context =
      await getActiveAthleteContext();

    setAthleteContext(context);

    if (context?.activeAthlete) {
      await loadTeams(
        context.activeAthlete.id
      );
    } else {
      setTeams([]);
    }

    return context;
  };

  useEffect(() => {
    const initialisePage = async () => {
      setLoadingAccount(true);
      setMessage("");

      try {
        await refreshAthleteContext();
      } catch (error) {
        console.error(
          "Unable to initialise Teams:",
          error
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load your RADR athlete account."
        );
      } finally {
        setLoadingAccount(false);
      }
    };

    void initialisePage();
  }, []);

  const handleAthleteSelection = async (
    athleteId: string
  ) => {
    setMessage("");

    try {
      setActiveAthleteId(athleteId);

      setLoadingAccount(true);

      const context =
        await getActiveAthleteContext();

      setAthleteContext(context);

      if (!context?.activeAthlete) {
        setTeams([]);

        setMessage(
          "Unable to select this athlete."
        );

        return;
      }

      await loadTeams(
        context.activeAthlete.id
      );
    } catch (error) {
      console.error(
        "Unable to switch athlete:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to switch athlete."
      );
    } finally {
      setLoadingAccount(false);
    }
  };

  const getRoleLabel = (
    role: string
  ) => {
    switch (role) {
      case "athlete":
        return "Athlete";

      case "captain":
        return "Captain";

      case "vice_captain":
        return "Vice Captain";

      case "head_coach":
        return "Head Coach";

      case "assistant_coach":
        return "Assistant Coach";

      case "manager":
        return "Manager";

      case "admin":
        return "Admin";

      case "trainer":
        return "Trainer";

      case "physio":
        return "Physio";

      case "statistician":
        return "Statistician";

      case "parent_guardian":
        return "Parent / Guardian";

      case "volunteer":
        return "Volunteer";

      default:
        return role;
    }
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
              Teams
            </p>

            <h1 className="mt-3 text-4xl font-extrabold">
              My teams
            </h1>

            <p className="mt-3 max-w-2xl text-white/70">
              View current teams and previous team history on{" "}
              {BRAND.name}.
            </p>
          </div>

          {activeAthlete &&
            canManageActiveAthleteTeams && (
              <Link
                href="/dashboard/teams/new"
                className="rounded-xl bg-[#D8F200] px-5 py-3 text-center font-bold text-[#0B1F5C]"
              >
                Create Team
              </Link>
            )}
        </div>

        {!loadingAccount &&
          athleteContext &&
          athleteContext.availableAthletes.length >
            0 && (
            <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                Athlete
              </p>

              {athleteContext.availableAthletes
                .length === 1 ? (
                <div className="mt-3 flex items-center gap-4">
                  {activeAthlete?.profile_photo_url ? (
                    <img
                      src={
                        activeAthlete.profile_photo_url
                      }
                      alt={
                        activeAthlete.full_name ||
                        "Athlete"
                      }
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#081642] text-lg font-black">
                      {activeAthlete?.full_name?.charAt(
                        0
                      ) || "A"}
                    </div>
                  )}

                  <div>
                    <p className="font-bold">
                      {activeAthlete?.full_name ||
                        "Athlete"}
                    </p>

                    <p className="text-sm text-white/55">
                      {athleteContext.isGuardianManaged
                        ? "Managed athlete"
                        : "Your athlete profile"}

                      {activeAthlete?.primary_sport
                        ? ` • ${activeAthlete.primary_sport}`
                        : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {athleteContext.availableAthletes.map(
                    (athlete) => {
                      const active =
                        athlete.id ===
                        activeAthlete?.id;

                      return (
                        <button
                          key={athlete.id}
                          type="button"
                          onClick={() =>
                            void handleAthleteSelection(
                              athlete.id
                            )
                          }
                          className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                            active
                              ? "border-[#D8F200]/50 bg-[#D8F200]/10"
                              : "border-white/10 bg-[#081642] hover:bg-white/10"
                          }`}
                        >
                          {athlete.profile_photo_url ? (
                            <img
                              src={
                                athlete.profile_photo_url
                              }
                              alt={
                                athlete.full_name ||
                                "Athlete"
                              }
                              className="h-11 w-11 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 font-black">
                              {athlete.full_name?.charAt(
                                0
                              ) || "A"}
                            </div>
                          )}

                          <div>
                            <p className="font-bold">
                              {athlete.full_name ||
                                "Athlete"}
                            </p>

                            <p className="text-xs text-white/50">
                              {athlete.primary_sport ||
                                "Athlete"}
                            </p>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          )}

        {!loadingAccount &&
          athleteContext?.requiresAthleteSelection && (
            <div className="mb-6 rounded-3xl border border-[#D8F200]/30 bg-[#D8F200]/10 p-6">
              <p className="font-bold text-[#D8F200]">
                Choose an athlete
              </p>

              <p className="mt-2 text-sm text-white/70">
                Select the athlete whose teams you
                want to view.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {athleteContext.availableAthletes.map(
                  (athlete) => (
                    <button
                      key={athlete.id}
                      type="button"
                      onClick={() =>
                        void handleAthleteSelection(
                          athlete.id
                        )
                      }
                      className="rounded-2xl border border-white/10 bg-[#081642] p-4 text-left transition hover:border-[#D8F200]/50"
                    >
                      <p className="font-bold">
                        {athlete.full_name ||
                          "Athlete"}
                      </p>

                      <p className="mt-1 text-xs text-white/50">
                        {athlete.primary_sport ||
                          "Athlete"}
                      </p>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

        {message && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/75">
            {message}
          </div>
        )}

        {loadingAccount || loadingTeams ? (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6">
            Loading teams...
          </div>
        ) : !activeAthlete ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8">
            <h2 className="text-2xl font-bold">
              {athleteContext?.requiresAthleteSelection
                ? "Select an athlete"
                : "No athlete connected"}
            </h2>

            <p className="mt-3 text-white/70">
              {athleteContext?.requiresAthleteSelection
                ? "Choose an athlete above to view their teams."
                : "Create or connect an athlete profile before managing teams."}
            </p>
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
            <h2 className="text-2xl font-bold">
              No teams added yet
            </h2>

            <p className="mt-3 text-white/70">
              {activeAthlete.full_name ||
                "This athlete"}{" "}
              is not connected to a team yet.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {canManageActiveAthleteTeams && (
                <Link
                  href="/dashboard/teams/new"
                  className="rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#0B1F5C]"
                >
                  Create Team
                </Link>
              )}

              <Link
                href="/dashboard/experience"
                className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-semibold"
              >
                Add Experience
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {currentTeams.length > 0 && (
              <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                      Active
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold">
                      Current Teams
                    </h2>
                  </div>

                  <span className="rounded-full bg-[#D8F200]/10 px-3 py-1 text-xs font-bold text-[#D8F200]">
                    {currentTeams.length}
                  </span>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {currentTeams.map((team) => (
                    <div
                      key={team.id}
                      className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                              {getRoleLabel(team.membership_role)}
                            </p>

                            {team.is_team_admin && (
                              <span className="rounded-full border border-[#D8F200]/25 bg-[#D8F200]/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#D8F200]">
                                Team Admin
                              </span>
                            )}

                            <span className="rounded-full bg-[#D8F200]/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#D8F200]">
                              Current
                            </span>
                          </div>

                          <h2 className="mt-2 text-2xl font-extrabold">
                            {team.display_name}
                          </h2>
                        </div>

                        {team.membership_status !== "active" && (
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-white/75">
                            {team.membership_status}
                          </span>
                        )}
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-[#081642] p-4">
                          <p className="text-xs uppercase text-white/50">Sport</p>
                          <p className="mt-2 font-bold">{team.sport}</p>
                        </div>
                        <div className="rounded-2xl bg-[#081642] p-4">
                          <p className="text-xs uppercase text-white/50">Season</p>
                          <p className="mt-2 font-bold">{team.season || "Not set"}</p>
                        </div>
                        <div className="rounded-2xl bg-[#081642] p-4">
                          <p className="text-xs uppercase text-white/50">Age / Gender</p>
                          <p className="mt-2 font-bold">
                            {[team.age_group, team.gender].filter(Boolean).join(" ") || "Not set"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#081642] p-4">
                          <p className="text-xs uppercase text-white/50">Division</p>
                          <p className="mt-2 font-bold">{team.division || "Not set"}</p>
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

                        {team.is_team_admin && (
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
              </section>
            )}

            {previousTeams.length > 0 && (
              <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                      History
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold">
                      Previous Teams
                    </h2>
                  </div>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">
                    {previousTeams.length}
                  </span>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {previousTeams.map((team) => (
                    <div
                      key={team.id}
                      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                              {getRoleLabel(team.membership_role)}
                            </p>

                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/55">
                              Previous
                            </span>
                          </div>

                          <h2 className="mt-2 text-2xl font-extrabold">
                            {team.display_name}
                          </h2>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-[#081642] p-4">
                          <p className="text-xs uppercase text-white/50">Sport</p>
                          <p className="mt-2 font-bold">{team.sport}</p>
                        </div>
                        <div className="rounded-2xl bg-[#081642] p-4">
                          <p className="text-xs uppercase text-white/50">Season</p>
                          <p className="mt-2 font-bold">{team.season || "Not set"}</p>
                        </div>
                        <div className="rounded-2xl bg-[#081642] p-4">
                          <p className="text-xs uppercase text-white/50">Age / Gender</p>
                          <p className="mt-2 font-bold">
                            {[team.age_group, team.gender].filter(Boolean).join(" ") || "Not set"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#081642] p-4">
                          <p className="text-xs uppercase text-white/50">Division</p>
                          <p className="mt-2 font-bold">{team.division || "Not set"}</p>
                        </div>
                      </div>

                      {getSeasonDateLabel(team.season_start, team.season_end) && (
                          <div className="mt-4">
                            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/70">
                              {getSeasonDateLabel(team.season_start, team.season_end)}
                            </span>
                          </div>
                        )}

                        {team.slug && (
                        <div className="mt-5">
                          <Link
                            href={`/teams/${team.slug}`}
                            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold"
                          >
                            View Team
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </section>
    </AppShell>
  );
}