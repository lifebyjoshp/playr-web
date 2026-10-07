"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { BRAND } from "../../../../lib/branding";
import {
  ActiveAthleteProfile,
  getActiveAthleteContext,
} from "../../../../lib/activeAthlete";

type Team = {
  id: string;
  slug: string | null;
  display_name: string | null;
  sport: string | null;
  club_name: string | null;
  team_name: string | null;
  age_group: string | null;
  gender: string | null;
  division: string | null;
  season: string | null;
};

export default function JoinTeamPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;

  const [team, setTeam] = useState<Team | null>(null);

  const [userId, setUserId] =
    useState<string | null>(null);

  const [activeAthlete, setActiveAthlete] =
    useState<ActiveAthleteProfile | null>(null);

  const [isGuardianManaged, setIsGuardianManaged] =
    useState(false);

  const [canManageTeams, setCanManageTeams] =
    useState(false);

  const [requiresAthleteSelection, setRequiresAthleteSelection] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const autoJoinAttempted = useRef(false);

  const teamName =
    team?.display_name ||
    [
      team?.club_name,
      team?.team_name,
      team?.age_group,
      team?.gender,
    ]
      .filter(Boolean)
      .join(" ") ||
    "this team";

  const athleteName =
    activeAthlete?.preferred_name ||
    activeAthlete?.full_name ||
    "Athlete";

  useEffect(() => {
    const loadInvitation = async () => {
      setLoading(true);
      setError("");
      setSuccess("");

      if (!teamId) {
        setError(
          "This team invitation is not valid."
        );
        setLoading(false);
        return;
      }

      try {
        /*
         * ------------------------------------------------
         * 1. Load the team.
         * ------------------------------------------------
         */
        const {
          data: teamData,
          error: teamError,
        } = await supabase
          .from("teams")
          .select(
            `
            id,
            slug,
            display_name,
            sport,
            club_name,
            team_name,
            age_group,
            gender,
            division,
            season
          `
          )
          .eq("id", teamId)
          .single();

        if (teamError || !teamData) {
          setTeam(null);

          setError(
            "We couldn't find this RADR team. The invitation may no longer be available."
          );

          return;
        }

        setTeam(teamData as Team);

        /*
         * ------------------------------------------------
         * 2. Check authentication.
         *
         * We still need this separately because the
         * invitation page must also work for logged-out
         * visitors.
         * ------------------------------------------------
         */
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "Unable to check RADR session:",
            userError
          );
        }

        if (!user) {
          setUserId(null);
          setActiveAthlete(null);
          setIsGuardianManaged(false);
          setCanManageTeams(false);
          setRequiresAthleteSelection(false);
          return;
        }

        /*
         * ------------------------------------------------
         * 3. Resolve RADR athlete context.
         *
         * This is now the same identity model used by:
         *
         * - Dashboard
         * - Profile
         * - Experience
         * - Achievements
         * - Highlights
         * - My Teams
         * - View Team
         * - Manage Team
         * - Create Team
         *
         * authUserId
         * = who is logged in
         *
         * activeAthlete.id
         * = who the sporting action belongs to
         * ------------------------------------------------
         */
        const context =
          await getActiveAthleteContext();

        if (!context) {
          setUserId(null);
          setActiveAthlete(null);
          return;
        }

        setUserId(context.authUserId);

        setRequiresAthleteSelection(
          context.requiresAthleteSelection
        );

        if (!context.activeAthlete) {
          setActiveAthlete(null);
          setIsGuardianManaged(
            context.isGuardianManaged
          );
          setCanManageTeams(false);

          if (context.requiresAthleteSelection) {
            setError(
              "Select the athlete you're managing before joining this team."
            );
          }

          return;
        }

        setActiveAthlete(
          context.activeAthlete
        );

        setIsGuardianManaged(
          context.isGuardianManaged
        );

        /*
         * Self-managed athletes can join teams
         * themselves.
         *
         * A guardian-managed athlete requires explicit
         * can_manage_teams authority.
         */
        const hasTeamPermission =
          context.isSelfManaged ||
          (context.isGuardianManaged &&
            context.activeGuardianPermissions
              ?.canManageTeams === true);

        setCanManageTeams(
          hasTeamPermission
        );

        if (!hasTeamPermission) {
          setError(
            `You do not have permission to manage teams for ${
              context.activeAthlete.preferred_name ||
              context.activeAthlete.full_name ||
              "this athlete"
            }.`
          );
        }
      } catch (err) {
        console.error(
          "Unable to load invitation:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading this team invitation."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadInvitation();
  }, [teamId]);

  const rememberInvitation = () => {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(
      "radr_pending_team_invite",
      teamId
    );
  };

  const clearInvitation = () => {
    if (typeof window === "undefined") {
      return;
    }

    const storedInvite =
      localStorage.getItem(
        "radr_pending_team_invite"
      );

    if (storedInvite === teamId) {
      localStorage.removeItem(
        "radr_pending_team_invite"
      );
    }
  };

  const handleJoinTeam = async () => {
    if (
      !team ||
      !userId ||
      !activeAthlete ||
      !canManageTeams
    ) {
      return;
    }

    setJoining(true);
    setError("");
    setSuccess("");

    try {
      /*
       * ------------------------------------------------
       * 1. Check for an existing membership.
       * ------------------------------------------------
       */
      const {
        data: existingMembership,
        error: existingMembershipError,
      } = await supabase
        .from("player_team_memberships")
        .select(
          `
          id,
          membership_role,
          membership_status,
          is_current
        `
        )
        .eq("team_id", team.id)
        .eq(
          "profile_id",
          activeAthlete.id
        )
        .maybeSingle();

      if (existingMembershipError) {
        setError(
          `We couldn't check ${athleteName}'s membership with ${teamName}: ${existingMembershipError.message}`
        );

        return;
      }

      /*
       * ------------------------------------------------
       * 2. Already active.
       * ------------------------------------------------
       */
      if (
        existingMembership &&
        existingMembership.membership_status ===
          "active"
      ) {
        clearInvitation();

        setSuccess(
          `${athleteName} is already connected to ${teamName} on RADR.`
        );

        return;
      }

      /*
       * ------------------------------------------------
       * 3. Existing inactive membership.
       *
       * Reactivate rather than create a duplicate.
       * ------------------------------------------------
       */
      if (existingMembership) {
        const { error: reactivateError } =
          await supabase
            .from(
              "player_team_memberships"
            )
            .update({
              membership_status: "active",
              is_current: true,
              joined_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              existingMembership.id
            );

        if (reactivateError) {
          setError(
            `We couldn't reconnect ${athleteName} with ${teamName}: ${reactivateError.message}`
          );

          return;
        }

        clearInvitation();

        setSuccess(
          `${athleteName} is now connected to ${teamName} on RADR.`
        );

        return;
      }

      /*
       * ------------------------------------------------
       * 4. Create new membership.
       *
       * CRITICAL:
       *
       * profile_id = ACTIVE ATHLETE
       *
       * For a guardian-managed account:
       *
       * Parent is authenticated.
       * Athlete joins the roster.
       * Parent never becomes a team member.
       * ------------------------------------------------
       */
      const { error: joinError } =
        await supabase
          .from(
            "player_team_memberships"
          )
          .insert({
            team_id: team.id,
            profile_id:
              activeAthlete.id,
            membership_role:
              "athlete",
            membership_status:
              "active",
            is_current: true,
            joined_at:
              new Date().toISOString(),
          });

      if (joinError) {
        /*
         * Unique constraint race / duplicate protection.
         */
        if (joinError.code === "23505") {
          clearInvitation();

          setSuccess(
            `${athleteName} is already connected to ${teamName}.`
          );

          return;
        }

        setError(
          `We couldn't add ${athleteName} to ${teamName}: ${joinError.message}`
        );

        return;
      }

      clearInvitation();

      setSuccess(
        `${athleteName} is now part of ${teamName} on RADR.`
      );
    } catch (err) {
      console.error(
        "Unable to join team:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while joining this team."
      );
    } finally {
      setJoining(false);
    }
  };

  /*
   * ----------------------------------------------------
   * Preserve automatic post-signup/login joining.
   *
   * Auto-join is now based on ONE resolved active
   * athlete rather than this page independently
   * rebuilding athlete identity.
   * ----------------------------------------------------
   */
  useEffect(() => {
    if (
      loading ||
      !team ||
      !userId ||
      !activeAthlete ||
      !canManageTeams ||
      requiresAthleteSelection ||
      joining ||
      success ||
      autoJoinAttempted.current
    ) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const pendingInvite =
      localStorage.getItem(
        "radr_pending_team_invite"
      );

    if (pendingInvite !== teamId) {
      return;
    }

    autoJoinAttempted.current = true;

    void handleJoinTeam();
  }, [
    loading,
    team,
    userId,
    activeAthlete,
    canManageTeams,
    requiresAthleteSelection,
    joining,
    success,
    teamId,
  ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B1F5C] px-4 py-16 text-white">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center backdrop-blur">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/15 border-t-[#D8F200]" />

            <p className="mt-5 text-sm text-white/60">
              Loading your RADR invitation...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="min-h-screen bg-[#0B1F5C] px-4 py-16 text-white">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center">
            <Link
              href="/"
              className="text-2xl font-black tracking-wide"
            >
              {BRAND.name}
            </Link>

            <h1 className="mt-8 text-2xl font-bold">
              Invitation unavailable
            </h1>

            <p className="mt-4 text-sm text-white/60">
              {error ||
                "We couldn't find this RADR team."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1F5C] px-4 py-10 text-white md:py-16">
      <div className="mx-auto max-w-xl">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur">
          <div className="p-6 text-center md:p-8">
            <Link
              href={userId ? "/feed" : "/"}
              className="text-2xl font-black tracking-wide"
            >
              {BRAND.name}
            </Link>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.25em] text-[#D8F200]">
              Team invitation
            </p>

            <h1 className="mt-3 text-3xl font-black md:text-4xl">
              You&apos;ve been invited.
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/60">
              Your team is already on RADR.
              Connect your athlete profile and join
              the team roster.
            </p>
          </div>

          <div className="mx-5 rounded-3xl border border-white/10 bg-[#081642] p-6 text-center md:mx-8 md:p-8">
            {team.sport && (
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                {team.sport}
              </p>
            )}

            <h2 className="mt-2 text-2xl font-black">
              {teamName}
            </h2>

            {(team.division ||
              team.season) && (
              <p className="mt-2 text-sm text-white/50">
                {[
                  team.division,
                  team.season,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            )}
          </div>

          <div className="p-5 md:p-8">
            {!userId && !success && (
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                  What is RADR?
                </p>

                <h3 className="mt-2 text-xl font-black">
                  Your sporting journey. One
                  profile.
                </h3>

                <div className="mt-4 grid gap-3 text-sm text-white/65 sm:grid-cols-2">
                  <p>
                    ✓ Build your athlete profile
                  </p>

                  <p>
                    ✓ Connect teams and achievements
                  </p>

                  <p>
                    ✓ Add highlights and development
                  </p>

                  <p>
                    ✓ Discover and follow athletes
                  </p>
                </div>
              </div>
            )}

            {userId &&
              activeAthlete &&
              !success && (
                <div className="mb-6 rounded-2xl border border-white/10 bg-[#081642] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                    Joining as
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    {activeAthlete.profile_photo_url ? (
                      <img
                        src={
                          activeAthlete.profile_photo_url
                        }
                        alt={
                          activeAthlete.full_name ||
                          athleteName
                        }
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 font-black">
                        {athleteName.charAt(0)}
                      </div>
                    )}

                    <div>
                      <p className="font-bold">
                        {athleteName}
                      </p>

                      <p className="text-xs text-white/50">
                        {activeAthlete.primary_sport ||
                          "Athlete"}
                      </p>
                    </div>
                  </div>

                  {isGuardianManaged && (
                    <p className="mt-3 text-xs text-white/50">
                      Parent/guardian managed
                      athlete
                    </p>
                  )}
                </div>
              )}

            {userId &&
              requiresAthleteSelection &&
              !success && (
                <div className="mb-5 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 px-4 py-4 text-sm text-yellow-100">
                  Select the athlete you&apos;re
                  managing in RADR before using this
                  team invitation.
                </div>
              )}

            {error && (
              <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 text-sm text-red-100">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-2xl border border-[#D8F200]/25 bg-[#D8F200]/10 px-5 py-5">
                <p className="font-bold">
                  Team joined
                </p>

                <p className="mt-1 text-sm text-white/70">
                  {success}
                </p>
              </div>
            )}

            {!success &&
              userId &&
              activeAthlete &&
              canManageTeams && (
                <button
                  type="button"
                  onClick={handleJoinTeam}
                  disabled={joining}
                  className="w-full rounded-2xl bg-[#D8F200] px-6 py-4 text-base font-black text-[#0B1F5C] disabled:opacity-60"
                >
                  {joining
                    ? "Joining team..."
                    : `Add ${athleteName} to Team`}
                </button>
              )}

            {!success &&
              userId &&
              !activeAthlete &&
              !requiresAthleteSelection && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                  <p className="font-bold">
                    No athlete profile available
                  </p>

                  <p className="mt-2 text-sm text-white/60">
                    Create or connect an athlete
                    profile before joining this team.
                  </p>
                </div>
              )}

            {!success && !userId && (
              <>
                <Link
                  href={`/signup?teamInvite=${encodeURIComponent(
                    teamId
                  )}`}
                  onClick={rememberInvitation}
                  className="block w-full rounded-2xl bg-[#D8F200] px-6 py-4 text-center text-base font-black text-[#0B1F5C]"
                >
                  Join Team &amp; Create My RADR
                </Link>

                <Link
                  href={`/login?teamInvite=${encodeURIComponent(
                    teamId
                  )}`}
                  onClick={rememberInvitation}
                  className="mt-3 block w-full rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-center text-sm font-bold"
                >
                  Already on RADR? Log in to join
                </Link>
              </>
            )}

            {success && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/feed"
                  className="rounded-2xl bg-[#D8F200] px-5 py-4 text-center text-sm font-black text-[#0B1F5C]"
                >
                  Go to Home
                </Link>

                <Link
                  href="/dashboard/teams"
                  className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-center text-sm font-bold"
                >
                  My Teams
                </Link>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          Build your profile. Track your journey.
          Get on the RADR.
        </p>
      </div>
    </main>
  );
}