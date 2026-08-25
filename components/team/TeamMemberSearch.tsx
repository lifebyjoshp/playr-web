"use client";

import { useEffect, useMemo, useState } from "react";
import { BRAND } from "../../lib/branding";
import { supabase } from "../../lib/supabase";
import { TEAM_ROLES } from "./teamRoles";
import type { AthleteSearchResult, Membership } from "./teamTypes";

type TeamMemberSearchProps = {
  teamId: string;
  viewerId: string;
  canManage: boolean;
  memberships: Membership[];
  onMemberAdded: () => Promise<void>;
};

export default function TeamMemberSearch({
  teamId,
  viewerId,
  canManage,
  memberships,
  onMemberAdded,
}: TeamMemberSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<AthleteSearchResult[]>([]);
  const [selectedMember, setSelectedMember] =
    useState<AthleteSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState("athlete");
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  const existingProfileIds = useMemo(
    () => new Set(memberships.map((membership) => membership.profile_id)),
    [memberships]
  );

  useEffect(() => {
    const cleanSearchTerm = searchTerm.trim();

    if (!canManage || cleanSearchTerm.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      setMessage("");

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, public_slug, headline, primary_sport, state, country, profile_photo_url"
        )
        .eq("is_public", true)
        .neq("id", viewerId)
        .ilike("full_name", `%${cleanSearchTerm}%`)
        .order("full_name", { ascending: true })
        .limit(8);

      if (error) {
        setMessageType("error");
        setMessage(`Unable to search RADR members: ${error.message}`);
        setResults([]);
        setSearching(false);
        return;
      }

      const availableMembers = (data || []).filter(
        (member) => !existingProfileIds.has(member.id)
      );

      setResults(availableMembers);
      setSearching(false);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [canManage, existingProfileIds, searchTerm, viewerId]);

  const handleAddMember = async () => {
    if (!canManage) {
      setMessageType("error");
      setMessage("You do not have permission to add team members.");
      return;
    }

    if (!selectedMember) {
      setMessageType("error");
      setMessage("Select a RADR member first.");
      return;
    }

    if (existingProfileIds.has(selectedMember.id)) {
      setMessageType("error");
      setMessage("This person is already connected to the team.");
      return;
    }

    setAdding(true);
    setMessageType("info");
    setMessage("Adding team member...");

    const { error } = await supabase
      .from("player_team_memberships")
      .insert({
        profile_id: selectedMember.id,
        team_id: teamId,
        position: null,
        is_current: true,
        membership_role: selectedRole,
        membership_status: "active",
        invited_by: viewerId,
        joined_at: new Date().toISOString(),
      });

    if (error) {
      setMessageType("error");
      setMessage(`Unable to add team member: ${error.message}`);
      setAdding(false);
      return;
    }

    const name = selectedMember.full_name || "Team member";

    await onMemberAdded();

    setSearchTerm("");
    setResults([]);
    setSelectedMember(null);
    setSelectedRole("athlete");
    setMessageType("success");
    setMessage(`${name} was added to the team.`);
    setAdding(false);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
        Build Your Team
      </p>

      <h2 className="mt-3 text-2xl font-bold">Search {BRAND.name} members</h2>

      <p className="mt-2 text-sm text-white/65">
        Search by name for an athlete, coach, manager, parent or another team
        member who already has a public profile.
      </p>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium">Search by name</label>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setSelectedMember(null);
            setMessage("");
          }}
          placeholder="Start typing a name..."
          disabled={!canManage}
          className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 text-white placeholder:text-white/40 outline-none disabled:opacity-60"
        />
        <p className="mt-2 text-xs text-white/50">
          Enter at least two characters.
        </p>
      </div>

      {searching && (
        <div className="mt-4 rounded-xl bg-[#081642] p-4 text-sm text-white/65">
          Searching {BRAND.name}...
        </div>
      )}

      {!searching &&
        searchTerm.trim().length >= 2 &&
        results.length === 0 &&
        !selectedMember &&
        !message && (
          <div className="mt-4 rounded-xl bg-[#081642] p-4">
            <p className="font-semibold">No available members found</p>
            <p className="mt-2 text-sm text-white/60">
              Check the spelling or try the person&apos;s full name. Email and
              mobile invitations will be added in the next sprint.
            </p>
          </div>
        )}

      {!selectedMember && results.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            Search results
          </p>

          {results.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => {
                setSelectedMember(member);
                setSelectedRole("athlete");
                setMessage("");
              }}
              className="flex w-full items-center gap-4 rounded-2xl bg-[#081642] p-4 text-left transition hover:bg-white/15"
            >
              {member.profile_photo_url ? (
                <img
                  src={member.profile_photo_url}
                  alt={member.full_name || "RADR member"}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl font-bold">
                  {member.full_name?.charAt(0) || "R"}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold">
                  {member.full_name || "Unnamed RADR member"}
                </p>
                <p className="mt-1 truncate text-sm text-white/65">
                  {member.headline || member.primary_sport || "RADR member"}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {[member.state, member.country].filter(Boolean).join(", ") ||
                    "Location not listed"}
                </p>
              </div>

              <span className="rounded-xl bg-[#D8F200] px-4 py-2 text-sm font-bold text-[#0B1F5C]">
                Select
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedMember && (
        <div className="mt-6 rounded-2xl border border-[#D8F200]/25 bg-[#081642] p-5">
          <div className="flex items-start gap-4">
            {selectedMember.profile_photo_url ? (
              <img
                src={selectedMember.profile_photo_url}
                alt={selectedMember.full_name || "Selected member"}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl font-bold">
                {selectedMember.full_name?.charAt(0) || "R"}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D8F200]">
                Selected member
              </p>
              <h3 className="mt-2 text-xl font-bold">
                {selectedMember.full_name || "Unnamed RADR member"}
              </h3>
              <p className="mt-1 text-sm text-white/65">
                {selectedMember.headline ||
                  selectedMember.primary_sport ||
                  "RADR member"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedMember(null);
                setSelectedRole("athlete");
              }}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold"
            >
              Change
            </button>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">Team role</label>
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0B1F5C] px-4 py-3 text-white"
            >
              {TEAM_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void handleAddMember()}
            disabled={adding}
            className="mt-5 w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
          >
            {adding ? "Adding to Team..." : "Add to Team"}
          </button>
        </div>
      )}

      {message && (
        <div
          className={`mt-5 rounded-xl p-4 text-sm font-medium ${
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
    </div>
  );
}
