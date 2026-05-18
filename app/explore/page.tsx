"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";

type PublicProfile = {
  id: string;
  full_name: string | null;
  public_slug: string | null;
  headline: string | null;
  bio: string | null;
  primary_sport: string | null;
  position: string | null;
  is_public: boolean | null;
  state: string | null;
  country: string | null;
};

type MembershipRow = {
  profile_id: string;
  is_current: boolean;
  teams: {
    association_name: string | null;
    competition_name: string | null;
    club_name: string | null;
    team_name: string | null;
    display_name: string | null;
    sport: string | null;
  } | null;
};

type ExploreProfile = PublicProfile & {
  associations: string[];
  competitions: string[];
  clubs: string[];
  teams: string[];
  currentTeam: string | null;
  currentCompetition: string | null;
  currentAssociation: string | null;
};

export default function ExplorePage() {
  const [profiles, setProfiles] = useState<ExploreProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [association, setAssociation] = useState("");
  const [competition, setCompetition] = useState("");
  const [club, setClub] = useState("");

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, public_slug, headline, bio, primary_sport, position, is_public, state, country"
        )
        .eq("is_public", true)
        .not("public_slug", "is", null)
        .order("full_name", { ascending: true });

      if (profileError || !profileData) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const publicProfileIds = profileData.map((profile) => profile.id);

      const { data: membershipData, error: membershipError } = await supabase
        .from("player_team_memberships")
        .select(
          `
          profile_id,
          is_current,
          teams (
            association_name,
            competition_name,
            club_name,
            team_name,
            display_name,
            sport
          )
        `
        )
        .in("profile_id", publicProfileIds);

      if (membershipError || !membershipData) {
        const mergedWithoutMemberships: ExploreProfile[] = profileData.map(
          (profile) => ({
            ...profile,
            associations: [],
            competitions: [],
            clubs: [],
            teams: [],
            currentTeam: null,
            currentCompetition: null,
            currentAssociation: null,
          })
        );

        setProfiles(mergedWithoutMemberships);
        setLoading(false);
        return;
      }

      const memberships = membershipData as unknown as MembershipRow[];

      const mergedProfiles: ExploreProfile[] = profileData.map((profile) => {
        const profileMemberships = memberships.filter(
          (membership) => membership.profile_id === profile.id
        );

        const associations = Array.from(
          new Set(
            profileMemberships
              .map((membership) => membership.teams?.association_name)
              .filter((value): value is string => Boolean(value))
          )
        );

        const competitions = Array.from(
          new Set(
            profileMemberships
              .map((membership) => membership.teams?.competition_name)
              .filter((value): value is string => Boolean(value))
          )
        );

        const clubs = Array.from(
          new Set(
            profileMemberships
              .map((membership) => membership.teams?.club_name)
              .filter((value): value is string => Boolean(value))
          )
        );

        const teams = Array.from(
          new Set(
            profileMemberships
              .map((membership) => membership.teams?.display_name)
              .filter((value): value is string => Boolean(value))
          )
        );

        const currentMembership = profileMemberships.find(
          (membership) => membership.is_current && membership.teams
        );

        return {
          ...profile,
          associations,
          competitions,
          clubs,
          teams,
          currentTeam: currentMembership?.teams?.display_name || null,
          currentCompetition:
            currentMembership?.teams?.competition_name || null,
          currentAssociation:
            currentMembership?.teams?.association_name || null,
        };
      });

      setProfiles(mergedProfiles);
      setLoading(false);
    };

    loadProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch =
        search === "" ||
        (profile.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (profile.headline || "").toLowerCase().includes(search.toLowerCase()) ||
        profile.teams.some((team) =>
          team.toLowerCase().includes(search.toLowerCase())
        );

      const matchesSport = sport === "" || profile.primary_sport === sport;

      const matchesPosition =
        position === "" ||
        (profile.position || "").toLowerCase().includes(position.toLowerCase());

      const locationText =
        `${profile.state || ""} ${profile.country || ""}`.toLowerCase();

      const matchesLocation =
        location === "" || locationText.includes(location.toLowerCase());

      const matchesAssociation =
        association === "" ||
        profile.associations.some((item) =>
          item.toLowerCase().includes(association.toLowerCase())
        );

      const matchesCompetition =
        competition === "" ||
        profile.competitions.some((item) =>
          item.toLowerCase().includes(competition.toLowerCase())
        );

      const matchesClub =
        club === "" ||
        profile.clubs.some((item) =>
          item.toLowerCase().includes(club.toLowerCase())
        );

      return (
        matchesSearch &&
        matchesSport &&
        matchesPosition &&
        matchesLocation &&
        matchesAssociation &&
        matchesCompetition &&
        matchesClub
      );
    });
  }, [profiles, search, sport, position, location, association, competition, club]);

  const sports = Array.from(
    new Set(
      profiles
        .map((profile) => profile.primary_sport)
        .filter((value): value is string => Boolean(value))
    )
  ).sort();

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
            Explore
          </p>
          <h1 className="text-4xl font-extrabold md:text-5xl">
            Discover PLAYRs
          </h1>
          <p className="mt-3 max-w-3xl text-white/75">
            Browse public athlete profiles and discover talent by sport,
            position, location, association, competition, and club.
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Search name, headline or team
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search athletes..."
                className="w-full rounded-xl bg-[#081642] px-4 py-3 text-white placeholder:text-white/40 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full rounded-xl bg-[#081642] px-4 py-3 text-white outline-none"
              >
                <option value="">All Sports</option>
                {sports.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Position</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Point Guard"
                className="w-full rounded-xl bg-[#081642] px-4 py-3 text-white placeholder:text-white/40 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. NSW or Australia"
                className="w-full rounded-xl bg-[#081642] px-4 py-3 text-white placeholder:text-white/40 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Association</label>
              <input
                type="text"
                value={association}
                onChange={(e) => setAssociation(e.target.value)}
                placeholder="e.g. Basketball NSW"
                className="w-full rounded-xl bg-[#081642] px-4 py-3 text-white placeholder:text-white/40 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Competition</label>
              <input
                type="text"
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                placeholder="e.g. Junior Premier League"
                className="w-full rounded-xl bg-[#081642] px-4 py-3 text-white placeholder:text-white/40 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Club</label>
              <input
                type="text"
                value={club}
                onChange={(e) => setClub(e.target.value)}
                placeholder="e.g. Newcastle Falcons"
                className="w-full rounded-xl bg-[#081642] px-4 py-3 text-white placeholder:text-white/40 outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch("");
                  setSport("");
                  setPosition("");
                  setLocation("");
                  setAssociation("");
                  setCompetition("");
                  setClub("");
                }}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/15"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-white/70 backdrop-blur">
            Loading athlete profiles...
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-white/65">
              {filteredProfiles.length} profile
              {filteredProfiles.length === 1 ? "" : "s"} found
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredProfiles.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/p/${profile.public_slug}`}
                  className="group rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:bg-white/15"
                >
                  <div className="mb-4 inline-flex rounded-full bg-[#D8F200] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#0B1F5C]">
                    Public Profile
                  </div>

                  <h2 className="text-2xl font-extrabold">
                    {profile.full_name || "Unnamed Athlete"}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-white/75">
                    {profile.headline || "No headline added yet."}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#081642] p-4">
                      <div className="text-xs uppercase text-white/60">
                        Sport
                      </div>
                      <div className="mt-2 font-bold">
                        {profile.primary_sport || "Not set"}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#081642] p-4">
                      <div className="text-xs uppercase text-white/60">
                        Position
                      </div>
                      <div className="mt-2 font-bold">
                        {profile.position || "Not set"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#081642] p-4">
                    <div className="text-xs uppercase text-white/60">
                      Location
                    </div>
                    <div className="mt-2 font-bold">
                      {[profile.state, profile.country].filter(Boolean).join(", ") ||
                        "Not set"}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-[#081642] p-4">
                      <div className="text-xs uppercase text-white/60">
                        Current Team
                      </div>
                      <div className="mt-2 font-bold">
                        {profile.currentTeam || "Not set"}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-[#081642] p-4">
                        <div className="text-xs uppercase text-white/60">
                          Competition
                        </div>
                        <div className="mt-2 text-sm font-medium">
                          {profile.currentCompetition || "Not set"}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#081642] p-4">
                        <div className="text-xs uppercase text-white/60">
                          Association
                        </div>
                        <div className="mt-2 text-sm font-medium">
                          {profile.currentAssociation || "Not set"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-sm font-semibold text-[#D8F200]">
                    View Profile →
                  </div>
                </Link>
              ))}
            </div>

            {filteredProfiles.length === 0 && (
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-8 text-center text-white/70 backdrop-blur">
                No public athlete profiles match your search yet.
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}