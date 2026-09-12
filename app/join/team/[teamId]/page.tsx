"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { BRAND } from "../../../../lib/branding";

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

type ExistingMembership = {
  id: string;
  membership_role: string | null;
  membership_status: string | null;
  is_current: boolean | null;
};

export default function JoinTeamPage() {
  const params = useParams<{ teamId: string }>();

  const teamId = params.teamId;

  const [team, setTeam] = useState<Team | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const teamName =
    team?.display_name ||
    [team?.club_name, team?.team_name, team?.age_group, team?.gender]
      .filter(Boolean)
      .join(" ") ||
    "this team";

  useEffect(() => {
    const loadInvitation = async () => {
      setLoading(true);
      setError("");

      if (!teamId) {
        setError("This team invitation is not valid.");
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Unable to check RADR session:", userError);
        }

        setUserId(user?.id ?? null);

        const { data: teamData, error: teamError } =
          await supabase
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
          console.error("Unable to load invited team:", teamError);

          setTeam(null);
          setError(
            "We couldn't find this RADR team. The invitation may no longer be available."
          );

          setLoading(false);
          return;
        }

        setTeam(teamData as Team);
      } catch (err) {
        console.error("Unable to load invitation:", err);

        setError(
          "Something went wrong while loading this team invitation."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadInvitation();
  }, [teamId]);

  const rememberInvitation = () => {
    if (typeof window === "undefined") return;

    localStorage.setItem(
      "radr_pending_team_invite",
      teamId
    );
  };

  const clearInvitation = () => {
    if (typeof window === "undefined") return;

    const storedInvite = localStorage.getItem(
      "radr_pending_team_invite"
    );

    if (storedInvite === teamId) {
      localStorage.removeItem(
        "radr_pending_team_invite"
      );
    }
  };

  const handleJoinTeam = async () => {
    if (!team || !userId) return;

    setJoining(true);
    setError("");
    setSuccess("");

    try {
      /*
       * First check whether this athlete already has a
       * membership record for this team.
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
        .eq("profile_id", userId)
        .maybeSingle();

      if (existingMembershipError) {
        console.error(
          "Unable to check existing membership:",
          existingMembershipError
        );

        setError(
          `We couldn't check your membership with ${teamName}. Please try again.`
        );

        setJoining(false);
        return;
      }

      /*
       * Already an active member.
       */
      if (
        existingMembership &&
        existingMembership.membership_status === "active"
      ) {
        clearInvitation();

        setSuccess(
          `You're already connected to ${teamName} on RADR.`
        );

        setJoining(false);
        return;
      }

      /*
       * Membership exists but isn't currently active.
       *
       * Reactivate it rather than creating a duplicate.
       */
      if (existingMembership) {
        const { error: reactivateError } =
          await supabase
            .from("player_team_memberships")
            .update({
              membership_status: "active",
              is_current: true,
            })
            .eq("id", existingMembership.id);

        if (reactivateError) {
          console.error(
            "Unable to reactivate membership:",
            reactivateError
          );

          setError(
            `We couldn't reconnect you with ${teamName}. Please try again.`
          );

          setJoining(false);
          return;
        }

        clearInvitation();

        setSuccess(
          `You're now connected to ${teamName} on RADR.`
        );

        setJoining(false);
        return;
      }

      /*
       * No membership exists yet.
       *
       * Create a new player membership.
       */
      const { error: joinError } = await supabase
        .from("player_team_memberships")
        .insert({
          team_id: team.id,
          profile_id: userId,
          membership_role: "athlete",
          membership_status: "active",
          is_current: true,
        });

      if (joinError) {
        console.error(
          "Unable to join team:",
          joinError
        );

        /*
         * PostgreSQL unique violation.
         *
         * If two requests happen close together,
         * treat an existing membership as success.
         */
        if (joinError.code === "23505") {
          clearInvitation();

          setSuccess(
            `You're already connected to ${teamName} on RADR.`
          );

          setJoining(false);
          return;
        }

        setError(
          `We couldn't add you to ${teamName}. Please try again.`
        );

        setJoining(false);
        return;
      }

      clearInvitation();

      setSuccess(
        `You're now part of ${teamName} on RADR.`
      );
    } catch (err) {
      console.error("Unable to join team:", err);

      setError(
        "Something went wrong while joining this team."
      );
    } finally {
      setJoining(false);
    }
  };

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
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center backdrop-blur">
            <Link
              href="/"
              className="text-2xl font-black tracking-wide text-white"
            >
              {BRAND.name}
            </Link>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.25em] text-[#D8F200]">
              Team invitation
            </p>

            <h1 className="mt-3 text-2xl font-bold">
              Invitation unavailable
            </h1>

            <p className="mt-4 text-sm leading-6 text-white/60">
              {error ||
                "We couldn't find this RADR team."}
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex rounded-xl bg-[#D8F200] px-6 py-3 text-sm font-bold text-[#0B1F5C]"
            >
              Go to RADR
            </Link>
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
              className="text-2xl font-black tracking-wide text-white"
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
              Connect your athlete profile with your
              teammates and add this team to your RADR
              journey.
            </p>
          </div>

          <div className="mx-5 rounded-3xl border border-white/10 bg-[#081642] p-6 text-center md:mx-8 md:p-8">
            {team.sport && (
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                {team.sport}
              </p>
            )}

            <h2 className="mt-2 text-2xl font-black text-white">
              {teamName}
            </h2>

            {(team.division || team.season) && (
              <p className="mt-2 text-sm text-white/50">
                {[team.division, team.season]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            )}
          </div>

          <div className="p-5 md:p-8">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 text-sm leading-6 text-red-100">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-2xl border border-[#D8F200]/25 bg-[#D8F200]/10 px-5 py-5">
                <p className="font-bold text-white">
                  Team joined
                </p>

                <p className="mt-1 text-sm leading-6 text-white/70">
                  {success}
                </p>
              </div>
            )}

            {!success && userId && (
              <>
                <button
                  type="button"
                  onClick={handleJoinTeam}
                  disabled={joining}
                  className="w-full rounded-2xl bg-[#D8F200] px-6 py-4 text-base font-black text-[#0B1F5C] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {joining
                    ? "Joining team..."
                    : `Join ${team.team_name || "team"}`}
                </button>

                <p className="mt-4 text-center text-xs leading-5 text-white/40">
                  Your athlete profile will be added to this
                  team&apos;s RADR roster.
                </p>
              </>
            )}

            {!success && !userId && (
              <>
                <Link
                  href={`/signup?teamInvite=${encodeURIComponent(
                    teamId
                  )}`}
                  onClick={rememberInvitation}
                  className="block w-full rounded-2xl bg-[#D8F200] px-6 py-4 text-center text-base font-black text-[#0B1F5C] transition hover:brightness-95"
                >
                  Create my RADR profile
                </Link>

                <Link
                  href={`/login?teamInvite=${encodeURIComponent(
                    teamId
                  )}`}
                  onClick={rememberInvitation}
                  className="mt-3 block w-full rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-center text-sm font-bold text-white transition hover:bg-white/10"
                >
                  I already have RADR
                </Link>

                <p className="mt-4 text-center text-xs leading-5 text-white/40">
                  We&apos;ll remember this team while you
                  create or sign in to your RADR account.
                </p>
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
                  href={`/dashboard/teams/${team.id}/manage`}
                  className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-center text-sm font-bold text-white transition hover:bg-white/10"
                >
                  View team
                </Link>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          Build your profile. Track your journey. Get on the RADR.
        </p>
      </div>
    </main>
  );
}