"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import AppShell from "../../components/AppShell";
import { getAthleteSports, RADR_SPORTS } from "../../lib/sports";

type PublicProfile = {
  id: string;
  full_name: string | null;
  public_slug: string | null;
  headline: string | null;
  bio: string | null;
  primary_sport: string | null;
  other_sports: string[];
  position: string | null;
  is_public: boolean | null;
  state: string | null;
  country: string | null;
  gender: string | null;
  age_band: string | null;
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
  const [ageBand, setAgeBand] = useState("");
  const [gender, setGender] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [association, setAssociation] = useState("");
  const [competition, setCompetition] = useState("");
  const [club, setClub] = useState("");

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .rpc("get_public_explore_profiles");

      if (profileError || !profileData) {
        console.error("Unable to load public Explore profiles:", profileError);
        setProfiles([]);
        setLoading(false);
        return;
      }

      const publicProfiles: PublicProfile[] = (
        profileData as PublicProfile[]
      )
        .map((profile) => ({
          ...profile,
          other_sports: Array.isArray(profile.other_sports)
            ? profile.other_sports
            : [],
        }))
        .sort((a, b) =>
          (a.full_name || "").localeCompare(b.full_name || "")
        );

      const publicProfileIds = publicProfiles.map((profile) => profile.id);

      if (publicProfileIds.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

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
        const mergedWithoutMemberships: ExploreProfile[] = publicProfiles.map(
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

      const mergedProfiles: ExploreProfile[] = publicProfiles.map((profile) => {
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

      const athleteSports = getAthleteSports(
        profile.primary_sport,
        profile.other_sports
      );

      const matchesSport =
        sport === "" || athleteSports.includes(sport);

      const matchesAge =
        ageBand === "" || profile.age_band === ageBand;

      const matchesGender =
        gender === "" || profile.gender === gender;

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
        matchesAge &&
        matchesGender &&
        matchesPosition &&
        matchesLocation &&
        matchesAssociation &&
        matchesCompetition &&
        matchesClub
      );
    });
  }, [
    profiles,
    search,
    sport,
    ageBand,
    gender,
    position,
    location,
    association,
    competition,
    club,
  ]);

  const sports = Array.from(
    new Set([
      ...RADR_SPORTS,
      ...profiles.flatMap((profile) =>
        getAthleteSports(profile.primary_sport, profile.other_sports)
      ),
    ])
  ).sort((a, b) => a.localeCompare(b));

  const ageBands = [
    "9 & Under",
    "10–12",
    "13–15",
    "16–18",
    "19+",
  ];

  return (
    <AppShell>

      <section className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-7 md:px-10 md:py-16">
        <div className="mb-5 sm:mb-7 md:mb-10">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D8F200] sm:mb-3 sm:text-sm sm:tracking-[0.25em]">
            Explore
          </p>
          <h1 className="text-2xl font-extrabold sm:text-3xl md:text-5xl">
            Discover Athletes
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-5 text-white/75 sm:mt-3 sm:text-base sm:leading-normal">
            Browse public athlete profiles and discover talent by sport,
            age, gender, position, location, association, competition, and club.
          </p>
        </div>

        <div className="mb-5 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur sm:mb-6 sm:rounded-3xl sm:p-5 md:mb-8 md:p-6">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium sm:mb-2 sm:text-sm">
                Search name, headline or team
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search athletes..."
                className="min-h-[44px] w-full rounded-lg bg-[#081642] px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium sm:mb-2 sm:text-sm">Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="min-h-[44px] w-full rounded-lg bg-[#081642] px-3 py-2.5 text-sm text-white outline-none sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
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
              <label className="mb-1.5 block text-xs font-medium sm:mb-2 sm:text-sm">
                Age
              </label>
              <select
                value={ageBand}
                onChange={(e) => setAgeBand(e.target.value)}
                className="min-h-[44px] w-full rounded-lg bg-[#081642] px-3 py-2.5 text-sm text-white outline-none sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
              >
                <option value="">All Ages</option>
                {ageBands.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium sm:mb-2 sm:text-sm">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="min-h-[44px] w-full rounded-lg bg-[#081642] px-3 py-2.5 text-sm text-white outline-none sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
              >
                <option value="">All Genders</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium sm:mb-2 sm:text-sm">Position</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Point Guard"
                className="min-h-[44px] w-full rounded-lg bg-[#081642] px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium sm:mb-2 sm:text-sm">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. VIC or Australia"
                className="min-h-[44px] w-full rounded-lg bg-[#081642] px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium sm:mb-2 sm:text-sm">Association</label>
              <input
                type="text"
                value={association}
                onChange={(e) => setAssociation(e.target.value)}
                placeholder="e.g. Basketball VIC"
                className="min-h-[44px] w-full rounded-lg bg-[#081642] px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium sm:mb-2 sm:text-sm">Competition</label>
              <input
                type="text"
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                placeholder="e.g. Junior Premier League"
                className="min-h-[44px] w-full rounded-lg bg-[#081642] px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium sm:mb-2 sm:text-sm">Club</label>
              <input
                type="text"
                value={club}
                onChange={(e) => setClub(e.target.value)}
                placeholder="e.g. Melbourne Tigers"
                className="min-h-[44px] w-full rounded-lg bg-[#081642] px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch("");
                  setSport("");
                  setAgeBand("");
                  setGender("");
                  setPosition("");
                  setLocation("");
                  setAssociation("");
                  setCompetition("");
                  setClub("");
                }}
                className="min-h-[44px] w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/70 backdrop-blur sm:rounded-3xl sm:p-8 sm:text-base">
            Loading athlete profiles...
          </div>
        ) : (
          <>
            <div className="mb-3 text-xs text-white/65 sm:mb-6 sm:text-sm">
              {filteredProfiles.length} profile
              {filteredProfiles.length === 1 ? "" : "s"} found
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
              {filteredProfiles.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/p/${profile.public_slug}`}
                  className="group min-w-0 rounded-xl border border-white/10 bg-white/10 p-3 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:bg-white/15 sm:rounded-2xl sm:p-4 md:rounded-3xl md:p-6"
                >
                  <div className="mb-2 inline-flex rounded-full bg-[#D8F200] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#0B1F5C] sm:mb-3 sm:px-3 sm:text-xs sm:tracking-[0.2em] md:mb-4">
                    Public Profile
                  </div>

                  <h2 className="truncate text-base font-extrabold sm:text-xl md:text-2xl">
                    {profile.full_name || "Unnamed Athlete"}
                  </h2>

                  <p className="mt-1 line-clamp-2 text-xs leading-4 text-white/75 sm:mt-2 sm:text-sm sm:leading-5 md:text-base">
                    {profile.headline || "No headline added yet."}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-4 sm:gap-3 md:mt-5">
                    <div className="min-w-0 rounded-lg bg-[#081642] p-2 sm:rounded-xl sm:p-3 md:rounded-2xl md:p-4">
                      <div className="truncate text-[9px] uppercase text-white/60 sm:text-[10px] md:text-xs">
                        Sport
                      </div>
                      <div className="mt-1 truncate text-xs font-bold sm:text-sm md:mt-2 md:text-base">
                        {profile.primary_sport || "Not set"}
                      </div>
                    </div>

                    <div className="min-w-0 rounded-lg bg-[#081642] p-2 sm:rounded-xl sm:p-3 md:rounded-2xl md:p-4">
                      <div className="truncate text-[9px] uppercase text-white/60 sm:text-[10px] md:text-xs">
                        Position
                      </div>
                      <div className="mt-1 truncate text-xs font-bold sm:text-sm md:mt-2 md:text-base">
                        {profile.position || "Not set"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 rounded-lg bg-[#081642] p-2 sm:mt-3 sm:rounded-xl sm:p-3 md:mt-4 md:rounded-2xl md:p-4">
                    <div className="truncate text-[9px] uppercase text-white/60 sm:text-[10px] md:text-xs">
                      Location
                    </div>
                    <div className="mt-1 truncate text-xs font-bold sm:text-sm md:mt-2 md:text-base">
                      {[profile.state, profile.country].filter(Boolean).join(", ") ||
                        "Not set"}
                    </div>
                  </div>

                  <div className="mt-2 grid gap-1.5 sm:mt-3 sm:gap-3 md:mt-4">
                    <div className="min-w-0 rounded-lg bg-[#081642] p-2 sm:rounded-xl sm:p-3 md:rounded-2xl md:p-4">
                      <div className="truncate text-[9px] uppercase text-white/60 sm:text-[10px] md:text-xs">
                        Current Team
                      </div>
                      <div className="mt-1 truncate text-xs font-bold sm:text-sm md:mt-2 md:text-base">
                        {profile.currentTeam || "Not set"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
                      <div className="min-w-0 rounded-lg bg-[#081642] p-2 sm:rounded-xl sm:p-3 md:rounded-2xl md:p-4">
                        <div className="truncate text-[9px] uppercase text-white/60 sm:text-[10px] md:text-xs">
                          Competition
                        </div>
                        <div className="mt-1 truncate text-[11px] font-medium sm:text-xs md:mt-2 md:text-sm">
                          {profile.currentCompetition || "Not set"}
                        </div>
                      </div>

                      <div className="min-w-0 rounded-lg bg-[#081642] p-2 sm:rounded-xl sm:p-3 md:rounded-2xl md:p-4">
                        <div className="truncate text-[9px] uppercase text-white/60 sm:text-[10px] md:text-xs">
                          Association
                        </div>
                        <div className="mt-1 truncate text-[11px] font-medium sm:text-xs md:mt-2 md:text-sm">
                          {profile.currentAssociation || "Not set"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs font-semibold text-[#D8F200] sm:mt-4 sm:text-sm md:mt-5">
                    View Profile →
                  </div>
                </Link>
              ))}
            </div>

            {filteredProfiles.length === 0 && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4 text-center text-sm text-white/70 backdrop-blur sm:mt-8 sm:rounded-3xl sm:p-8 sm:text-base">
                No public athlete profiles match your search yet.
              </div>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}