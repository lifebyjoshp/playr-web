"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";

export default function OnboardingPage() {
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

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage("Saving profile...");
    setMessageType("info");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessageType("error");
      setMessage("You must be logged in to save your profile.");
      setLoading(false);
      return;
    }

    const displayName = [clubName, teamName, ageGroup, gender]
      .filter(Boolean)
      .join(" ");

    const { data: teamData, error: teamError } = await supabase
  .from("teams")
  .insert({
    sport,
    country,
    state: stateRegion,
    association_name: associationName,
    competition_name: competitionName,
    club_name: clubName,
    team_name: teamName,
    age_group: ageGroup,
    gender,
    display_name: displayName,
  })
  .select()
  .single();

    if (teamError) {
      setMessageType("error");
      setMessage(`Error creating team: ${teamError.message}`);
      setLoading(false);
      return;
    }

    const { error: membershipError } = await supabase
      .from("player_team_memberships")
      .insert({
        profile_id: user.id,
        team_id: teamData.id,
        position,
        start_date: startDate || null,
        end_date: isCurrent ? null : endDate || null,
        is_current: isCurrent,
      });

    if (membershipError) {
      setMessageType("error");
      setMessage(`Error saving membership: ${membershipError.message}`);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name || "",
      email: user.email || "",
      role: user.user_metadata?.role || "Athlete",
      primary_sport: sport,
      position,
    });

    if (profileError) {
      setMessageType("error");
      setMessage(`Profile saved, but profile update failed: ${profileError.message}`);
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage("Profile and team saved successfully.");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-8 text-4xl font-extrabold">
          Build Your Athlete Profile
        </h1>

        <div className="space-y-6 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
          <div>
            <label className="mb-2 block text-sm font-medium">Sport</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full rounded-xl bg-[#081642] px-4 py-3"
            >
              <option value="">Select sport</option>
              <option>Basketball</option>
              <option>Netball</option>
              <option>Rugby League</option>
              <option>Rugby Union</option>
              <option>AFL</option>
              <option>Football/Soccer</option>
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
              <label className="mb-2 block text-sm font-medium">State / Region</label>
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
    placeholder="e.g. Basketball NSW or Newcastle Basketball Association"
    className="w-full rounded-xl bg-[#081642] px-4 py-3"
  />
</div>
          <div>
            <label className="mb-2 block text-sm font-medium">Competition Name</label>
            <input
              type="text"
              value={competitionName}
              onChange={(e) => setCompetitionName(e.target.value)}
              placeholder="e.g. Newcastle Basketball Junior League"
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
                placeholder="e.g. Point Guard, Defender, Midfielder"
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
            onClick={handleSaveProfile}
            disabled={loading}
            className="w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Profile"}
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
      </section>
    </main>
  );
}