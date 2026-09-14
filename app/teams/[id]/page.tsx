"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import InviteTeammates from "../../../components/InviteTeammates";
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

type TeamMember = {
  id: string;
  profile_id: string;
  position: string | null;
  jersey_number: string | number | null;
  membership_role: string;
  membership_status: string;
  profiles:
    | {
        id: string;
        full_name: string | null;
        public_slug: string | null;
        profile_photo_url: string | null;
      }
    | {
        id: string;
        full_name: string | null;
        public_slug: string | null;
        profile_photo_url: string | null;
      }[]
    | null;
};

function getRoleLabel(role: string) {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PublicTeamPage() {
  const params = useParams<{ id: string }>();
  const slug = params.id;

  const [team, setTeam] = useState<Team | null>(null);
  const [memberships, setMemberships] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [canInvite, setCanInvite] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

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
        setMemberships([]);
        setMessage(
          error
            ? `Unable to load team: ${error.message}`
            : "This team could not be found or is not publicly available."
        );
        setLoading(false);
        return;
      }

      const loadedTeam = data as Team;
      setTeam(loadedTeam);

      const { data: membershipData, error: membershipError } = await supabase
        .from("player_team_memberships")
        .select(
          `
          id,
          profile_id,
          position,
          jersey_number,
          membership_role,
          membership_status,
          profiles!player_team_memberships_profile_id_fkey (
            id,
            full_name,
            public_slug,
            profile_photo_url
          )
        `
        )
        .eq("team_id", loadedTeam.id)
        .eq("membership_status", "active")
        .order("created_at", { ascending: true });

      if (membershipError) {
        setMemberships([]);
        setMessage(`Roster could not be loaded: ${membershipError.message}`);
      } else {
        setMemberships((membershipData || []) as unknown as TeamMember[]);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: activeMembership } = await supabase
          .from("player_team_memberships")
          .select("id")
          .eq("team_id", loadedTeam.id)
          .eq("profile_id", user.id)
          .eq("membership_status", "active")
          .maybeSingle();

        setCanInvite(Boolean(activeMembership));
      } else {
        setCanInvite(false);
      }

      setLoading(false);
    };

    if (slug) {
      void loadTeam();
    }
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B1F5C] pb-24 text-white md:pb-0">
        <Navbar />
        <section className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 md:px-6 md:py-16">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 sm:rounded-3xl sm:p-6 md:p-8">
            Loading team...
          </div>
        </section>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="min-h-screen bg-[#0B1F5C] pb-24 text-white md:pb-0">
        <Navbar />
        <section className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 md:px-6 md:py-16">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 sm:rounded-3xl sm:p-6 md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D8F200] sm:text-sm sm:tracking-[0.25em]">
              {BRAND.name}
            </p>

            <h1 className="mt-2 text-2xl font-extrabold sm:mt-3 sm:text-3xl md:text-4xl">
              Team not found
            </h1>

            <p className="mt-3 text-sm text-white/70 sm:mt-4 sm:text-base">
              {message}
            </p>

            <Link
              href="/dashboard/teams"
              className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-[#D8F200] px-4 py-2.5 text-sm font-bold text-[#0B1F5C] sm:mt-6 sm:px-5 sm:py-3 sm:text-base"
            >
              Back to Teams
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1F5C] pb-24 text-white md:pb-0">
      <Navbar />

      <section className="relative">
        <div className="h-36 bg-[linear-gradient(135deg,#114DFF,#0B1F5C)] sm:h-48 md:h-64" />

        <div className="mx-auto max-w-6xl px-3 sm:px-4 md:px-6">
          <div className="-mt-14 rounded-2xl border border-white/10 bg-[#0B1F5C]/95 p-4 shadow-2xl backdrop-blur sm:-mt-16 sm:rounded-3xl sm:p-6 md:-mt-20 md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D8F200] sm:text-sm sm:tracking-[0.25em]">
              {BRAND.name} Team
            </p>

            <h1 className="mt-2 text-2xl font-extrabold sm:mt-3 sm:text-3xl md:text-5xl">
              {team.display_name}
            </h1>

            <p className="mt-2 text-sm text-white/70 sm:mt-3 sm:text-base md:text-lg">
              {[team.sport, team.season].filter(Boolean).join(" • ")}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70 sm:px-3 sm:text-xs sm:tracking-[0.15em]">
                {team.verification_status || "unverified"}
              </span>

              {team.division && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/70 sm:px-3 sm:text-xs">
                  {team.division}
                </span>
              )}

              <span className="rounded-full bg-[#D8F200]/10 px-2.5 py-1 text-[10px] font-semibold text-[#D8F200] sm:px-3 sm:text-xs">
                {memberships.length} member{memberships.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 lg:mt-8 lg:grid-cols-4 lg:gap-4">
              <div className="min-w-0 rounded-xl bg-[#081642] p-3 sm:rounded-2xl sm:p-4">
                <p className="truncate text-[9px] uppercase text-white/50 sm:text-xs">
                  Association
                </p>
                <p className="mt-1 truncate text-xs font-bold sm:mt-2 sm:text-base">
                  {team.association_name || "Not set"}
                </p>
              </div>

              <div className="min-w-0 rounded-xl bg-[#081642] p-3 sm:rounded-2xl sm:p-4">
                <p className="truncate text-[9px] uppercase text-white/50 sm:text-xs">
                  Competition
                </p>
                <p className="mt-1 truncate text-xs font-bold sm:mt-2 sm:text-base">
                  {team.competition_name || "Not set"}
                </p>
              </div>

              <div className="min-w-0 rounded-xl bg-[#081642] p-3 sm:rounded-2xl sm:p-4">
                <p className="truncate text-[9px] uppercase text-white/50 sm:text-xs">
                  Age / Gender
                </p>
                <p className="mt-1 truncate text-xs font-bold sm:mt-2 sm:text-base">
                  {[team.age_group, team.gender].filter(Boolean).join(" ") ||
                    "Not set"}
                </p>
              </div>

              <div className="min-w-0 rounded-xl bg-[#081642] p-3 sm:rounded-2xl sm:p-4">
                <p className="truncate text-[9px] uppercase text-white/50 sm:text-xs">
                  Location
                </p>
                <p className="mt-1 truncate text-xs font-bold sm:mt-2 sm:text-base">
                  {[team.state, team.country].filter(Boolean).join(", ") ||
                    "Not set"}
                </p>
              </div>
            </div>
          </div>

          <div className="py-4 sm:py-6 md:py-8">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-5 md:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D8F200] sm:text-xs sm:tracking-[0.2em]">
                    Roster
                  </p>
                  <h2 className="mt-1 text-xl font-bold sm:mt-2 sm:text-2xl">
                    Team members
                  </h2>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {canInvite && (
                    <button
                      type="button"
                      onClick={() => setShowInvite((current) => !current)}
                      className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#D8F200] px-3 py-2 text-xs font-extrabold text-[#0B1F5C] transition hover:brightness-95 sm:min-h-[44px] sm:px-4 sm:text-sm"
                    >
                      <span className="mr-1 text-base leading-none">+</span>
                      Invite
                    </button>
                  )}

                  <div className="rounded-full border border-white/10 bg-[#081642] px-3 py-1.5 text-xs font-bold text-white/75">
                    {memberships.length}
                  </div>
                </div>
              </div>

              {canInvite && showInvite && (
                <div className="mt-4">
                  <InviteTeammates
                    teamId={team.id}
                    teamName={team.display_name}
                  />
                </div>
              )}

              {message && (
                <div className="mt-4 rounded-xl border border-yellow-300/20 bg-yellow-400/10 p-3 text-xs text-yellow-100 sm:text-sm">
                  {message}
                </div>
              )}

              <div className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-3 md:mt-5 lg:grid-cols-3">
                {memberships.length === 0 && (
                  <div className="rounded-xl bg-[#081642] p-4 text-sm text-white/70 sm:col-span-2 lg:col-span-3">
                    No active team members are listed yet.
                  </div>
                )}

                {memberships.map((membership) => {
                  const profileValue = membership.profiles;
                  const memberProfile = Array.isArray(profileValue)
                    ? profileValue[0]
                    : profileValue;

                  const content = (
                    <div className="flex items-center gap-3">
                      {memberProfile?.profile_photo_url ? (
                        <img
                          src={memberProfile.profile_photo_url}
                          alt={memberProfile.full_name || "Team member"}
                          className="h-11 w-11 shrink-0 rounded-lg object-cover sm:h-12 sm:w-12 sm:rounded-xl"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base font-bold sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg">
                          {memberProfile?.full_name?.charAt(0) || "A"}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-bold sm:text-base">
                            {memberProfile?.full_name || "Unnamed member"}
                          </p>

                          {membership.jersey_number !== null &&
                            membership.jersey_number !== undefined &&
                            String(membership.jersey_number).trim() !== "" && (
                              <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/75">
                                #{membership.jersey_number}
                              </span>
                            )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-white/55 sm:text-xs">
                          {membership.position && (
                            <span>{membership.position}</span>
                          )}

                          {membership.position && membership.membership_role && (
                            <span className="text-white/25">•</span>
                          )}

                          <span className="font-medium text-white/70">
                            {getRoleLabel(membership.membership_role)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );

                  return memberProfile?.public_slug ? (
                    <Link
                      key={membership.id}
                      href={`/p/${memberProfile.public_slug}`}
                      className="rounded-xl bg-[#081642] p-3 transition hover:bg-white/10 sm:rounded-2xl sm:p-4"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      key={membership.id}
                      className="rounded-xl bg-[#081642] p-3 sm:rounded-2xl sm:p-4"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
