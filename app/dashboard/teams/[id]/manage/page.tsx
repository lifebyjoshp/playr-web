"use client";

import InviteTeammates from "@/components/InviteTeammates";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AppShell from "../../../../../components/AppShell";
import TeamDetailsCard from "../../../../../components/team/TeamDetailsCard";
import TeamManagementHeader from "../../../../../components/team/TeamManagementHeader";
import TeamMemberSearch from "../../../../../components/team/TeamMemberSearch";
import TeamRosterCard from "../../../../../components/team/TeamRosterCard";
import TeamStatusMessage from "../../../../../components/team/TeamStatusMessage";
import { TEAM_MANAGER_ROLES } from "../../../../../components/team/teamRoles";
import type {
  Membership,
  MessageType,
  Team,
  TeamFormValues,
} from "../../../../../components/team/teamTypes";
import { supabase } from "../../../../../lib/supabase";

const EMPTY_FORM: TeamFormValues = {
  sport: "",
  country: "",
  stateRegion: "",
  associationName: "",
  competitionName: "",
  clubName: "",
  teamName: "",
  ageGroup: "",
  gender: "",
  division: "",
  season: "",
  isPublic: true,
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function teamToForm(team: Team): TeamFormValues {
  return {
    sport: team.sport || "",
    country: team.country || "",
    stateRegion: team.state || "",
    associationName: team.association_name || "",
    competitionName: team.competition_name || "",
    clubName: team.club_name || "",
    teamName: team.team_name || "",
    ageGroup: team.age_group || "",
    gender: team.gender || "",
    division: team.division || "",
    season: team.season || "",
    isPublic: team.is_public ?? true,
  };
}

export default function ManageTeamPage() {
  const params = useParams<{ id: string }>();
  const teamId = params.id;

  const [team, setTeam] = useState<Team | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [form, setForm] = useState<TeamFormValues>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [savingTeam, setSavingTeam] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("info");

  const canManage = TEAM_MANAGER_ROLES.includes(
    (viewerRole || "") as (typeof TEAM_MANAGER_ROLES)[number]
  );

  const setStatusMessage = useCallback(
    (text: string, type: MessageType = "info") => {
      setMessage(text);
      setMessageType(type);
    },
    []
  );

  const loadTeam = useCallback(async () => {
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
        "id, slug, display_name, sport, country, state, association_name, competition_name, club_name, team_name, age_group, gender, division, season, is_public, verification_status, created_by"
      )
      .eq("id", teamId)
      .single();

    if (teamError || !teamData) {
      setTeam(null);
      setStatusMessage(
        `Unable to load team: ${teamError?.message || "Team not found."}`,
        "error"
      );
      setLoading(false);
      return;
    }

    const loadedTeam = teamData as Team;
    setTeam(loadedTeam);
    setForm(teamToForm(loadedTeam));

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
      setMemberships([]);
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

    setViewerRole(
      loadedTeam.created_by === user.id
        ? "admin"
        : viewerMembership?.membership_role || null
    );

    setLoading(false);
  }, [setStatusMessage, teamId]);

  useEffect(() => {
    if (!teamId) return;
    void loadTeam();
  }, [loadTeam, teamId]);

  const handleFormChange = <K extends keyof TeamFormValues>(
    field: K,
    value: TeamFormValues[K]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveTeam = async () => {
    if (!team || !viewerId || !canManage) {
      setStatusMessage(
        "You do not have permission to edit this team.",
        "error"
      );
      return;
    }

    if (!form.sport || !form.clubName || !form.teamName) {
      setStatusMessage(
        "Sport, club name and team name are required.",
        "error"
      );
      return;
    }

    setSavingTeam(true);
    setStatusMessage("Saving team details...", "info");

    const displayName = [
      form.clubName,
      form.teamName,
      form.ageGroup,
      form.gender,
      form.division,
    ]
      .filter(Boolean)
      .join(" ");

    const slugBase = createSlug(
      [
        form.clubName,
        form.teamName,
        form.ageGroup,
        form.gender,
        form.season,
      ]
        .filter(Boolean)
        .join("-")
    );

    const slug = team.slug || `${slugBase}-${team.id.slice(0, 6)}`;

    const { error } = await supabase
      .from("teams")
      .update({
        sport: form.sport,
        country: form.country || null,
        state: form.stateRegion || null,
        association_name: form.associationName || null,
        competition_name: form.competitionName || null,
        club_name: form.clubName,
        team_name: form.teamName,
        age_group: form.ageGroup || null,
        gender: form.gender || null,
        division: form.division || null,
        season: form.season || null,
        display_name: displayName,
        slug,
        is_public: form.isPublic,
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
            slug,
            display_name: displayName,
            sport: form.sport,
            country: form.country || null,
            state: form.stateRegion || null,
            association_name: form.associationName || null,
            competition_name: form.competitionName || null,
            club_name: form.clubName,
            team_name: form.teamName,
            age_group: form.ageGroup || null,
            gender: form.gender || null,
            division: form.division || null,
            season: form.season || null,
            is_public: form.isPublic,
          }
        : current
    );

    setStatusMessage("Team details updated successfully.", "success");
    setSavingTeam(false);
  };

  const handleRoleChange = async (
    membershipId: string,
    membershipProfileId: string,
    newRole: string
  ) => {
    if (!canManage) {
      setStatusMessage(
        "You do not have permission to update member roles.",
        "error"
      );
      return;
    }

    if (membershipProfileId === viewerId) {
      setStatusMessage(
        "You cannot change your own team role from this page.",
        "error"
      );
      return;
    }

    const { error } = await supabase
      .from("player_team_memberships")
      .update({ membership_role: newRole })
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
    if (!canManage) {
      setStatusMessage(
        "You do not have permission to remove team members.",
        "error"
      );
      return;
    }

    if (membershipProfileId === viewerId) {
      setStatusMessage(
        "You cannot remove your own membership from this page.",
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
        <TeamManagementHeader team={team} />

        <TeamStatusMessage message={message} type={messageType} />

        {!canManage && (
          <div className="mb-6 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm text-yellow-100">
            You can view this team, but your current role does not allow team
            management.
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
  <div className="space-y-8">
    <TeamDetailsCard
      values={form}
      canManage={canManage}
      saving={savingTeam}
      onChange={handleFormChange}
      onSave={handleSaveTeam}
    />

    {canManage && (
      <InviteTeammates
        teamId={team.id}
        teamName={team.display_name || team.team_name}
      />
    )}

    <TeamMemberSearch
      teamId={team.id}
      viewerId={viewerId || ""}
      canManage={canManage}
      memberships={memberships}
      onMemberAdded={loadTeam}
    />
  </div>

  <TeamRosterCard
    memberships={memberships}
    viewerId={viewerId}
    canManage={canManage}
    onRoleChange={handleRoleChange}
    onRemoveMember={handleRemoveMember}
  />
</div>
</section>
</AppShell>
);
}