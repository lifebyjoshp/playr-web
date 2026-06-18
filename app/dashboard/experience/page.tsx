"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import AppShell from "../../../components/AppShell";

type TeamMembership = {
  id: string;
  position: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  team_id: string;
  teams: {
    id: string;
    sport: string;
    country: string;
    state: string;
    association_name: string | null;
    competition_name: string;
    club_name: string;
    team_name: string;
    age_group: string | null;
    gender: string | null;
    display_name: string;
  };
};

export default function ExperiencePage() {
  const [sport, setSport] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [associationName, setAssociationName] = useState("");
  const [competitionName, setCompetitionName] = useState("");
  const [clubName, setClubName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [position, setPosition] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);

  const [editingMembershipId, setEditingMembershipId] = useState<string | null>(
    null
  );
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  const resetForm = () => {
    setSport("");
    setCountry("");
    setStateRegion("");
    setAssociationName("");
    setCompetitionName("");
    setClubName("");
    setTeamName("");
    setAgeGroup("");
    setGender("");
    setPosition("");
    setStartDate("");
    setEndDate("");
    setIsCurrent(true);
    setEditingMembershipId(null);
    setEditingTeamId(null);
  };

  const loadMemberships = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("player_team_memberships")
      .select(
        `
        id,
        team_id,
        position,
        start_date,
        end_date,
        is_current,
        teams (
          id,
          sport,
          country,
          state,
          association_name,
          competition_name,
          club_name,
          team_name,
          age_group,
          gender,
          display_name
        )
      `
      )
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMemberships(data as unknown as TeamMembership[]);
    }
  };

  useEffect(() => {
    loadMemberships();
  }, []);

  const handleEdit = (membership: TeamMembership) => {
    setEditingMembershipId(membership.id);
    setEditingTeamId(membership.teams.id);

    setSport(membership.teams.sport || "");
    setCountry(membership.teams.country || "");
    setStateRegion(membership.teams.state || "");
    setAssociationName(membership.teams.association_name || "");
    setCompetitionName(membership.teams.competition_name || "");
    setClubName(membership.teams.club_name || "");
    setTeamName(membership.teams.team_name || "");
    setAgeGroup(membership.teams.age_group || "");
    setGender(membership.teams.gender || "");
    setPosition(membership.position || "");
    setStartDate(membership.start_date || "");
    setEndDate(membership.end_date || "");
    setIsCurrent(membership.is_current);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (membershipId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this experience?"
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("Deleting experience...");
    setMessageType("info");

    const { error } = await supabase
      .from("player_team_memberships")
      .delete()
      .eq("id", membershipId);

    if (error) {
      setMessageType("error");
      setMessage(`Error deleting experience: ${error.message}`);
      setLoading(false);
      return;
    }

    if (editingMembershipId === membershipId) {
      resetForm();
    }

    setMessageType("success");
    setMessage("Experience deleted successfully.");
    await loadMemberships();
    setLoading(false);
  };

  const handleSaveExperience = async () => {
    setLoading(true);
    setMessage(
      editingMembershipId ? "Updating experience..." : "Saving experience..."
    );
    setMessageType("info");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessageType("error");
      setMessage("You must be logged in to manage experience.");
      setLoading(false);
      return;
    }

    const displayName = [clubName, teamName, ageGroup, gender]
      .filter(Boolean)
      .join(" ");

    let savedTeamId = editingTeamId;

    if (editingTeamId) {
      const { error: teamUpdateError } = await supabase
        .from("teams")
        .update({
          sport,
          country,
          state: stateRegion,
          association_name: associationName,
          competition_name: competitionName,
          club_name: clubName,
          team_name: teamName,
          age_group: ageGroup || null,
          gender: gender || null,
          display_name: displayName,
        })
        .eq("id", editingTeamId);

      if (teamUpdateError) {
        setMessageType("error");
        setMessage(`Error updating team: ${teamUpdateError.message}`);
        setLoading(false);
        return;
      }
    } else {
      const { data: teamData, error: teamInsertError } = await supabase
        .from("teams")
        .insert({
          sport,
          country,
          state: stateRegion,
          association_name: associationName || null,
          competition_name: competitionName,
          club_name: clubName,
          team_name: teamName,
          age_group: ageGroup || null,
          gender: gender || null,
          display_name: displayName,
        })
        .select()
        .single();

      if (teamInsertError || !teamData) {
        setMessageType("error");
        setMessage(`Error creating team: ${teamInsertError?.message}`);
        setLoading(false);
        return;
      }

      savedTeamId = teamData.id;
    }

    if (editingMembershipId) {
      const { error: membershipUpdateError } = await supabase
        .from("player_team_memberships")
        .update({
          position: position || null,
          start_date: startDate || null,
          end_date: isCurrent ? null : endDate || null,
          is_current: isCurrent,
        })
        .eq("id", editingMembershipId);

      if (membershipUpdateError) {
        setMessageType("error");
        setMessage(`Error updating experience: ${membershipUpdateError.message}`);
        setLoading(false);
        return;
      }
    } else {
      const { error: membershipInsertError } = await supabase
        .from("player_team_memberships")
        .insert({
          profile_id: user.id,
          team_id: savedTeamId,
          position: position || null,
          start_date: startDate || null,
          end_date: isCurrent ? null : endDate || null,
          is_current: isCurrent,
        });

      if (membershipInsertError) {
        setMessageType("error");
        setMessage(`Error saving experience: ${membershipInsertError.message}`);
        setLoading(false);
        return;
      }
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name || "",
      email: user.email || "",
      role: user.user_metadata?.role || "Athlete",
      primary_sport: sport || null,
      position: position || null,
    });

    if (profileError) {
      setMessageType("error");
      setMessage(
        `Experience saved, but profile update failed: ${profileError.message}`
      );
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage(
      editingMembershipId
        ? "Experience updated successfully."
        : "Experience added successfully."
    );

    resetForm();
    await loadMemberships();
    setLoading(false);
  };

  return (
    <AppShell>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
            Experience
          </p>
          <h1 className="text-4xl font-extrabold md:text-5xl">
            Add playing experience
          </h1>
          <p className="mt-3 max-w-3xl text-white/75">
            Add current and past teams, competitions, and playing history like a
            sports version of LinkedIn experience.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">
                {editingMembershipId ? "Edit Experience" : "Add Experience"}
              </h2>

              {editingMembershipId && (
                <button
                  onClick={resetForm}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              >
                <option value="">Select sport</option>
                <option>Basketball</option>
                <option>Football</option>
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Australia"
                  className="w-full rounded-xl bg-[#081642] px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  State / Region
                </label>
                <input
                  type="text"
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  placeholder="e.g. NSW"
                  className="w-full rounded-xl bg-[#081642] px-4 py-3"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Association</label>
              <input
                type="text"
                value={associationName}
                onChange={(e) => setAssociationName(e.target.value)}
                placeholder="e.g. Basketball NSW"
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Competition Name
              </label>
              <input
                type="text"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                placeholder="e.g. Junior Premier League"
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Club Name</label>
                <input
                  type="text"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="e.g. Newcastle Falcons"
                  className="w-full rounded-xl bg-[#081642] px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Red"
                  className="w-full rounded-xl bg-[#081642] px-4 py-3"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">Age Group</label>
                <input
                  type="text"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  placeholder="e.g. U14"
                  className="w-full rounded-xl bg-[#081642] px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl bg-[#081642] px-4 py-3"
                >
                  <option value="">Select gender</option>
                  <option>Boys</option>
                  <option>Girls</option>
                  <option>Men</option>
                  <option>Women</option>
                  <option>Mixed</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Position</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Point Guard"
                  className="w-full rounded-xl bg-[#081642] px-4 py-3"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl bg-[#081642] px-4 py-3"
                />
              </div>

              {!isCurrent && (
                <div>
                  <label className="mb-2 block text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl bg-[#081642] px-4 py-3"
                  />
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
              />
              I currently play for this team
            </label>

            <button
              onClick={handleSaveExperience}
              disabled={loading}
              className="w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
            >
              {loading
                ? editingMembershipId
                  ? "Updating..."
                  : "Saving..."
                : editingMembershipId
                ? "Update Experience"
                : "Add Experience"}
            </button>

            {message && (
              <div
                className={`rounded-xl p-4 text-sm font-medium ${
                  messageType === "success"
                    ? "bg-green-500/20 text-green-200"
                    : messageType === "error"
                    ? "bg-red-500/20 text-red-200"
                    : "bg-white/10 text-white"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
            <h2 className="mb-6 text-2xl font-bold">Your Experience</h2>

            <div className="space-y-4">
              {memberships.length === 0 && (
                <div className="rounded-2xl bg-[#081642] p-5 text-white/70">
                  No experience added yet.
                </div>
              )}

              {memberships.map((membership) => (
                <div
                  key={membership.id}
                  className="rounded-2xl bg-[#081642] p-5"
                >
                  <h3 className="text-xl font-bold">
                    {membership.teams.display_name}
                  </h3>

                  <p className="mt-1 text-sm text-white/70">
                    {membership.teams.sport} •{" "}
                    {membership.position || "Position not set"}
                  </p>

                  <p className="mt-2 text-sm text-white/60">
                    {membership.teams.association_name
                      ? `${membership.teams.association_name} • `
                      : ""}
                    {membership.teams.competition_name}
                  </p>

                  <p className="mt-2 text-sm text-white/60">
                    {membership.start_date || "No start date"} –{" "}
                    {membership.is_current
                      ? "Current"
                      : membership.end_date || "No end date"}
                  </p>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleEdit(membership)}
                      className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(membership.id)}
                      className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}