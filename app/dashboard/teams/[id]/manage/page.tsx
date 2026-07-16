"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../../../../../components/AppShell";
import TeamMemberSearch from "../../../../../components/TeamMemberSearch";
import { BRAND } from "../../../../../lib/branding";
import { supabase } from "../../../../../lib/supabase";

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
  is_public: boolean;
  verification_status: string;
  created_by: string | null;
};

type ProfileSummary = {
  id: string;
  full_name: string | null;
  public_slug: string | null;
  headline: string | null;
  profile_photo_url: string | null;
  primary_sport: string | null;
  position: string | null;
};

type Membership = {
  id: string;
  profile_id: string;
  position: string | null;
  jersey_number: string | null;
  is_current: boolean;
  membership_role: string;
  membership_status: string;
  joined_at: string | null;
  profiles: ProfileSummary | ProfileSummary[] | null;
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ManageTeamPage() {
  const params = useParams<{ id: string }>();
  const teamId = params.id;

  const [team, setTeam] = useState<Team | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<string | null>(null);

  const [sport, setSport] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [associationName, setAssociationName] = useState("");
  const [competitionName, setCompetitionName] = useState("");
  const [clubName, setClubName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [division, setDivision] = useState("");
  const [season, setSeason] = useState("");
  const [isPublic, setIsPublic] = useState(true);


  const [loading, setLoading] = useState(true);
  const [savingTeam, setSavingTeam] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  const canManage = [
  "admin",
  "head_coach",
  "assistant_coach",
  "manager",
].includes(viewerRole || "");

  const setStatusMessage = (
    text: string,
    type: "success" | "error" | "info"
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  const loadTeam = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setStatusMessage("You must be logged in to manage a team.", "error");
      setLoading(false);
      return;
    }

    setViewerId(user.id);

    const { data: teamData, error: teamError } = await supabase
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
        is_public,
        verification_status,
        created_by
      `
      )
      .eq("id", teamId)
      .single();

    if (teamError || !teamData) {
      setStatusMessage(
        `Unable to load team: ${teamError?.message || "Team not found."}`,
        "error"
      );
      setLoading(false);
      return;
    }

    const loadedTeam = teamData as Team;
    setTeam(loadedTeam);

    setSport(loadedTeam.sport || "");
    setCountry(loadedTeam.country || "");
    setStateRegion(loadedTeam.state || "");
    setAssociationName(loadedTeam.association_name || "");
    setCompetitionName(loadedTeam.competition_name || "");
    setClubName(loadedTeam.club_name || "");
    setTeamName(loadedTeam.team_name || "");
    setAgeGroup(loadedTeam.age_group || "");
    setGender(loadedTeam.gender || "");
    setDivision(loadedTeam.division || "");
    setSeason(loadedTeam.season || "");
    setIsPublic(loadedTeam.is_public ?? true);

    const { data: membershipData, error: membershipError } = await supabase
      .from("player_team_memberships")
      .select(
        `
        id,
        profile_id,
        position,
        jersey_number,
        is_current,
        membership_role,
        membership_status,
        joined_at,
        profiles!player_team_memberships_profile_id_fkey (
          id,
          full_name,
          public_slug,
          headline,
          profile_photo_url,
          primary_sport,
          position
        )
      `
      )
      .eq("team_id", teamId)
      .order("created_at", { ascending: true });

    if (membershipError) {
      setStatusMessage(
        `Team loaded, but roster could not be loaded: ${membershipError.message}`,
        "error"
      );
      setLoading(false);
      return;
    }

    const loadedMemberships =
      (membershipData || []) as unknown as Membership[];

    setMemberships(loadedMemberships);

    const viewerMembership = loadedMemberships.find(
      (membership) =>
        membership.profile_id === user.id &&
        membership.membership_status === "active"
    );

    if (loadedTeam.created_by === user.id) {
      setViewerRole("admin");
    } else {
      setViewerRole(viewerMembership?.membership_role || null);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!teamId) return;

    void loadTeam();
  }, [teamId]);

  const handleSaveTeam = async () => {
    if (!team || !viewerId || !canManage) {
      setStatusMessage(
        "You do not have permission to edit this team.",
        "error"
      );
      return;
    }

    if (!sport || !clubName || !teamName) {
      setStatusMessage(
        "Sport, club name and team name are required.",
        "error"
      );
      return;
    }

    setSavingTeam(true);
    setStatusMessage("Saving team details...", "info");

    const displayName = [
      clubName,
      teamName,
      ageGroup,
      gender,
      division,
    ]
      .filter(Boolean)
      .join(" ");

    const slugBase = createSlug(
      [clubName, teamName, ageGroup, gender, season]
        .filter(Boolean)
        .join("-")
    );

    const slug = team.slug || `${slugBase}-${team.id.slice(0, 6)}`;

    const { error } = await supabase
      .from("teams")
      .update({
        sport,
        country: country || null,
        state: stateRegion || null,
        association_name: associationName || null,
        competition_name: competitionName || null,
        club_name: clubName,
        team_name: teamName,
        age_group: ageGroup || null,
        gender: gender || null,
        division: division || null,
        season: season || null,
        display_name: displayName,
        slug,
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      })
      .eq("id", team.id);

    if (error) {
      setStatusMessage(`Unable to update team: ${error.message}`, "error");
      setSavingTeam(false);
      return;
    }

    setTeam((current) =>
      current
        ? {
            ...current,
            sport,
            country: country || null,
            state: stateRegion || null,
            association_name: associationName || null,
            competition_name: competitionName || null,
            club_name: clubName,
            team_name: teamName,
            age_group: ageGroup || null,
            gender: gender || null,
            division: division || null,
            season: season || null,
            display_name: displayName,
            slug,
            is_public: isPublic,
          }
        : current
    );

    setStatusMessage("Team details updated successfully.", "success");
    setSavingTeam(false);
  };


    const cleanSlug = inviteSlug.trim().toLowerCase();

    if (!cleanSlug) {
      setStatusMessage(
        "Enter the athlete’s public RADR profile slug.",
        "error"
      );
      return;
    }

    setInviting(true);
    setStatusMessage("Finding athlete...", "info");

    const { data: athlete, error: athleteError } = await supabase
      .from("profiles")
      .select("id, full_name, public_slug")
      .eq("public_slug", cleanSlug)
      .eq("is_public", true)
      .maybeSingle();

    if (athleteError || !athlete) {
      setStatusMessage(
        "No public RADR athlete was found with that profile slug.",
        "error"
      );
      setInviting(false);
      return;
    }

    const alreadyMember = memberships.some(
      (membership) => membership.profile_id === athlete.id
    );

    if (alreadyMember) {
      setStatusMessage(
        `${athlete.full_name || "This athlete"} is already connected to this team.`,
        "error"
      );
      setInviting(false);
      return;
    }

    const { error: membershipError } = await supabase
      .from("player_team_memberships")
      .insert({
        profile_id: athlete.id,
        team_id: teamId,
        position: invitePosition || null,
        is_current: true,
        membership_role: inviteRole,
        membership_status: "active",
        invited_by: viewerId,
        joined_at: new Date().toISOString(),
      });

    if (membershipError) {
      setStatusMessage(
        `Unable to add athlete: ${membershipError.message}`,
        "error"
      );
      setInviting(false);
      return;
    }

    setInviteSlug("");
    setInvitePosition("");
    setInviteRole("athlete");

    setStatusMessage(
      `${athlete.full_name || "Athlete"} was added to the team.`,
      "success"
    );

    await loadTeam();
    setInviting(false);
  };

  const handleRoleChange = async (
    membershipId: string,
    membershipProfileId: string,
    newRole: string
  ) => {
    if (!canManage) return;

    if (membershipProfileId === viewerId && viewerRole === "admin") {
      setStatusMessage(
        "You cannot remove your own administrator role from this page.",
        "error"
      );
      return;
    }

    const { error } = await supabase
      .from("player_team_memberships")
      .update({
        membership_role: newRole,
      })
      .eq("id", membershipId);

    if (error) {
      setStatusMessage(
        `Unable to update member role: ${error.message}`,
        "error"
      );
      return;
    }

    setMemberships((current) =>
      current.map((membership) =>
        membership.id === membershipId
          ? { ...membership, membership_role: newRole }
          : membership
      )
    );

    setStatusMessage("Member role updated.", "success");
  };

  const handleRemoveMember = async (
    membershipId: string,
    membershipProfileId: string
  ) => {
    if (!canManage) return;

    if (membershipProfileId === viewerId) {
      setStatusMessage(
        "You cannot remove your own membership from the management page.",
        "error"
      );
      return;
    }

    const confirmed = window.confirm(
      "Remove this person from the team roster?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("player_team_memberships")
      .delete()
      .eq("id", membershipId);

    if (error) {
      setStatusMessage(
        `Unable to remove member: ${error.message}`,
        "error"
      );
      return;
    }

    setMemberships((current) =>
      current.filter((membership) => membership.id !== membershipId)
    );

    setStatusMessage("Team member removed.", "success");
  };

  if (loading) {
    return (
      <AppShell>
        <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6">
            Loading team management...
          </div>
        </section>
      </AppShell>
    );
  }

  if (!team) {
    return (
      <AppShell>
        <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-red-100">
            {message || "Team not found."}
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
              Team Management
            </p>

            <h1 className="mt-3 text-4xl font-extrabold">
              {team.display_name}
            </h1>

            <p className="mt-3 text-white/70">
              Manage team details, roster and member access on {BRAND.name}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/teams"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold"
            >
              Back to Teams
            </Link>

            {team.slug && (
              <Link
                href={`/teams/${team.slug}`}
                className="rounded-xl bg-[#D8F200] px-4 py-3 text-sm font-bold text-[#0B1F5C]"
              >
                View Public Team
              </Link>
            )}
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-2xl p-4 text-sm font-medium ${
              messageType === "success"
                ? "bg-green-500/20 text-green-100"
                : messageType === "error"
                ? "bg-red-500/20 text-red-100"
                : "bg-white/10 text-white/75"
            }`}
          >
            {message}
          </div>
        )}

        {!canManage && (
          <div className="mb-6 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm text-yellow-100">
            You can view this team, but your current role does not allow team
            management.
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
              <h2 className="text-2xl font-bold">Team details</h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Sport
                  </label>
                  <input
                    value={sport}
                    onChange={(event) => setSport(event.target.value)}
                    disabled={!canManage}
                    className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Country
                    </label>
                    <input
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      disabled={!canManage}
                      className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      State / Region
                    </label>
                    <input
                      value={stateRegion}
                      onChange={(event) =>
                        setStateRegion(event.target.value)
                      }
                      disabled={!canManage}
                      className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Association
                  </label>
                  <input
                    value={associationName}
                    onChange={(event) =>
                      setAssociationName(event.target.value)
                    }
                    disabled={!canManage}
                    className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Competition
                  </label>
                  <input
                    value={competitionName}
                    onChange={(event) =>
                      setCompetitionName(event.target.value)
                    }
                    disabled={!canManage}
                    className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Club
                    </label>
                    <input
                      value={clubName}
                      onChange={(event) => setClubName(event.target.value)}
                      disabled={!canManage}
                      className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Team
                    </label>
                    <input
                      value={teamName}
                      onChange={(event) => setTeamName(event.target.value)}
                      disabled={!canManage}
                      className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Age Group
                    </label>
                    <input
                      value={ageGroup}
                      onChange={(event) => setAgeGroup(event.target.value)}
                      disabled={!canManage}
                      className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Gender
                    </label>
                    <input
                      value={gender}
                      onChange={(event) => setGender(event.target.value)}
                      disabled={!canManage}
                      className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Division
                    </label>
                    <input
                      value={division}
                      onChange={(event) => setDivision(event.target.value)}
                      disabled={!canManage}
                      className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Season
                    </label>
                    <input
                      value={season}
                      onChange={(event) => setSeason(event.target.value)}
                      disabled={!canManage}
                      className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(event) => setIsPublic(event.target.checked)}
                    disabled={!canManage}
                  />
                  Make this team publicly visible
                </label>

                <button
                  onClick={handleSaveTeam}
                  disabled={!canManage || savingTeam}
                  className="w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
                >
                  {savingTeam ? "Saving..." : "Save Team Details"}
                </button>
              </div>
            </div>

            <TeamMemberSearch
              teamId={team.id}
              viewerId={viewerId || ""}
              canManage={canManage}
              memberships={memberships}
              onMemberAdded={loadTeam}
              />

              <p className="mt-2 text-sm text-white/65">
                Enter the final part of their public profile address. For
                example, for /p/john-smith enter john-smith.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Athlete profile slug
                  </label>
                  <input
                    value={inviteSlug}
                    onChange={(event) => setInviteSlug(event.target.value)}
                    placeholder="e.g. John-smith"
                    disabled={!canManage}
                    className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Team role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(event) => setInviteRole(event.target.value)}
                      disabled={!canManage}
                      className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                    >
                        <option value="athlete">Athlete</option>
                        <option value="captain">Captain</option>
                        <option value="vice_captain">Vice Captain</option>
                        <option value="head_coach">Head Coach</option>
                        <option value="assistant_coach">Assistant Coach</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Team Admin</option>
                        <option value="trainer">Trainer</option>
                        <option value="physio">Physio</option>
                        <option value="statistician">Statistician</option>
                        <option value="parent_guardian">Parent / Guardian</option>
                        <option value="volunteer">Volunteer</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Playing position
                    </label>
                    <input
                      value={invitePosition}
                      onChange={(event) =>
                        setInvitePosition(event.target.value)
                      }
                      placeholder="e.g. Point Guard"
                      disabled={!canManage}
                      className="w-full rounded-xl bg-[#081642] px-4 py-3 disabled:opacity-60"
                    />
                  </div>
                </div>

                <button
                  onClick={handleInviteAthlete}
                  disabled={!canManage || inviting}
                  className="w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
                >
                  {inviting ? "Adding Athlete..." : "Add Athlete to Team"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Team roster</h2>
                <p className="mt-2 text-sm text-white/65">
                  {memberships.length} team member
                  {memberships.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {memberships.length === 0 && (
                <div className="rounded-2xl bg-[#081642] p-5 text-white/70">
                  No members have been added yet.
                </div>
              )}

              {memberships.map((membership) => {
                const profileValue = membership.profiles;
                const memberProfile = Array.isArray(profileValue)
                  ? profileValue[0]
                  : profileValue;

                return (
                  <div
                    key={membership.id}
                    className="rounded-2xl bg-[#081642] p-5"
                  >
                    <div className="flex items-start gap-4">
                      {memberProfile?.profile_photo_url ? (
                        <img
                          src={memberProfile.profile_photo_url}
                          alt={memberProfile.full_name || "Team member"}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl font-bold">
                          {memberProfile?.full_name?.charAt(0) || "A"}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        {memberProfile?.public_slug ? (
                          <Link
                            href={`/p/${memberProfile.public_slug}`}
                            className="text-lg font-bold hover:underline"
                          >
                            {memberProfile.full_name || "Unnamed Athlete"}
                          </Link>
                        ) : (
                          <p className="text-lg font-bold">
                            {memberProfile?.full_name || "Unnamed Athlete"}
                          </p>
                        )}

                        <p className="mt-1 text-sm text-white/65">
                          {membership.position ||
                            memberProfile?.position ||
                            "Position not set"}
                        </p>

                        <p className="mt-1 text-xs uppercase tracking-[0.15em] text-white/45">
                          {membership.membership_status}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
                        Team role
                      </label>

                      <select
                        value={membership.membership_role}
                        onChange={(event) =>
                          handleRoleChange(
                            membership.id,
                            membership.profile_id,
                            event.target.value
                          )
                        }
                        disabled={
                          !canManage ||
                          membership.profile_id === viewerId
                        }
                        className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm disabled:opacity-60"
                      >
                        <option value="athlete">Athlete</option>
                        <option value="captain">Captain</option>
                        <option value="coach">Coach</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {canManage && membership.profile_id !== viewerId && (
                      <button
                        onClick={() =>
                          handleRemoveMember(
                            membership.id,
                            membership.profile_id
                          )
                        }
                        className="mt-4 w-full rounded-xl bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/30"
                      >
                        Remove from Team
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}