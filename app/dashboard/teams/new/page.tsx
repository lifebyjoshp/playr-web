"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppShell from "../../../../components/AppShell";
import { supabase } from "../../../../lib/supabase";

type ExistingTeam = {
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

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalise(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

export default function CreateTeamPage() {
  const router = useRouter();

  const [sport, setSport] = useState("");
  const [country, setCountry] = useState("Australia");
  const [stateRegion, setStateRegion] = useState("");
  const [associationName, setAssociationName] = useState("");
  const [competitionName, setCompetitionName] = useState("");
  const [clubName, setClubName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [division, setDivision] = useState("");
  const [season, setSeason] = useState("");
  const [position, setPosition] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [existingTeam, setExistingTeam] =
    useState<ExistingTeam | null>(null);

  const handleCreateTeam = async () => {
    setLoading(true);
    setMessage("");
    setExistingTeam(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }

    if (!sport || !clubName.trim() || !teamName.trim()) {
      setMessage(
        "Sport, club name and team name are required."
      );
      setLoading(false);
      return;
    }

    /*
     * -------------------------------------------------------
     * DUPLICATE TEAM CHECK
     * -------------------------------------------------------
     *
     * Search RADR before creating a new team.
     *
     * We deliberately fetch possible club/team matches and
     * then compare the structured team fields locally.
     *
     * This prevents normal differences in capitalisation
     * from creating duplicate RADR teams.
     */

    const safeClubName = clubName
      .trim()
      .replace(/[%_,]/g, "");

    const safeTeamName = teamName
      .trim()
      .replace(/[%_,]/g, "");

    const { data: possibleTeams, error: searchError } =
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
        .or(
          `club_name.ilike.%${safeClubName}%,team_name.ilike.%${safeTeamName}%`
        )
        .limit(50);

    if (searchError) {
      setMessage(
        `Unable to check existing teams: ${searchError.message}`
      );
      setLoading(false);
      return;
    }

    const duplicate =
      ((possibleTeams || []) as ExistingTeam[]).find(
        (team) => {
          const sameSport =
            normalise(team.sport) === normalise(sport);

          const sameClub =
            normalise(team.club_name) ===
            normalise(clubName);

          const sameTeam =
            normalise(team.team_name) ===
            normalise(teamName);

          /*
           * Optional identifying fields only become part
           * of the comparison when the new team has them.
           *
           * This allows:
           *
           * Newcastle Falcons
           * U14 Girls
           * 2026
           *
           * to remain different from:
           *
           * Newcastle Falcons
           * U16 Girls
           * 2026
           */

          const sameAgeGroup =
            !ageGroup.trim() ||
            normalise(team.age_group) ===
              normalise(ageGroup);

          const sameGender =
            !gender ||
            normalise(team.gender) ===
              normalise(gender);

          const sameDivision =
            !division.trim() ||
            normalise(team.division) ===
              normalise(division);

          const sameSeason =
            !season.trim() ||
            normalise(team.season) ===
              normalise(season);

          return (
            sameSport &&
            sameClub &&
            sameTeam &&
            sameAgeGroup &&
            sameGender &&
            sameDivision &&
            sameSeason
          );
        }
      ) || null;

    if (duplicate) {
      setExistingTeam(duplicate);

      setMessage(
        "This team already appears to exist on RADR. We haven't created another copy."
      );

      setLoading(false);
      return;
    }

    /*
     * -------------------------------------------------------
     * CREATE NEW TEAM
     * -------------------------------------------------------
     */

    const displayName = [
      clubName.trim(),
      teamName.trim(),
      ageGroup.trim(),
      gender,
      division.trim(),
    ]
      .filter(Boolean)
      .join(" ");

    const slugBase =
      createSlug(
        [
          clubName,
          teamName,
          ageGroup,
          gender,
          season,
        ]
          .filter(Boolean)
          .join("-")
      ) || "team";

    const slug = `${slugBase}-${Date.now()
      .toString()
      .slice(-5)}`;

    const { data: team, error: teamError } =
      await supabase
        .from("teams")
        .insert({
          sport,
          country: country.trim() || null,
          state: stateRegion.trim() || null,
          association_name:
            associationName.trim() || null,
          competition_name:
            competitionName.trim() || "",
          club_name: clubName.trim(),
          team_name: teamName.trim(),
          age_group: ageGroup.trim() || null,
          gender: gender || null,
          division: division.trim() || null,
          season: season.trim() || null,
          display_name: displayName,
          slug,
          created_by: user.id,
          is_public: true,
          verification_status: "unverified",
        })
        .select("id, slug")
        .single();

    if (teamError || !team) {
      setMessage(
        `Unable to create team: ${
          teamError?.message ||
          "Unknown error"
        }`
      );
      setLoading(false);
      return;
    }

    /*
     * Creator becomes the first administrator/member.
     */

    const { error: membershipError } =
      await supabase
        .from("player_team_memberships")
        .insert({
          profile_id: user.id,
          team_id: team.id,
          position: position.trim() || null,
          is_current: true,
          membership_role: "admin",
          membership_status: "active",
          joined_at: new Date().toISOString(),
        });

    if (membershipError) {
      setMessage(
        `Team created, but membership failed: ${membershipError.message}`
      );
      setLoading(false);
      return;
    }

    router.push(
      `/dashboard/teams/${team.id}/manage`
    );
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
            Teams
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Create a team
          </h1>

          <p className="mt-3 max-w-2xl text-white/70">
            Create a shared RADR team for your
            teammates. We&apos;ll check for an
            existing team first to help keep
            everyone connected to the same roster.
          </p>
        </div>

        <div className="space-y-6 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Sport *
            </label>

            <select
              value={sport}
              onChange={(event) =>
                setSport(event.target.value)
              }
              className="w-full rounded-xl bg-[#081642] px-4 py-3"
            >
              <option value="">
                Select sport
              </option>
              <option>Basketball</option>
              <option>Football</option>
              <option>Rugby League</option>
              <option>Rugby Union</option>
              <option>Netball</option>
              <option>Cricket</option>
              <option>Hockey</option>
              <option>Volleyball</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Country
              </label>

              <input
                value={country}
                onChange={(event) =>
                  setCountry(event.target.value)
                }
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
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
                placeholder="e.g. NSW"
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
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
                setAssociationName(
                  event.target.value
                )
              }
              placeholder="e.g. Basketball NSW"
              className="w-full rounded-xl bg-[#081642] px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Competition
            </label>

            <input
              value={competitionName}
              onChange={(event) =>
                setCompetitionName(
                  event.target.value
                )
              }
              placeholder="e.g. Junior Premier League"
              className="w-full rounded-xl bg-[#081642] px-4 py-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Club *
              </label>

              <input
                value={clubName}
                onChange={(event) =>
                  setClubName(event.target.value)
                }
                placeholder="e.g. Newcastle Basketball Association"
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Team *
              </label>

              <input
                value={teamName}
                onChange={(event) =>
                  setTeamName(event.target.value)
                }
                placeholder="e.g. Newcastle Falcons"
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Age Group
              </label>

              <input
                value={ageGroup}
                onChange={(event) =>
                  setAgeGroup(event.target.value)
                }
                placeholder="U14"
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Gender
              </label>

              <select
                value={gender}
                onChange={(event) =>
                  setGender(event.target.value)
                }
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              >
                <option value="">
                  Select
                </option>
                <option>Girls</option>
                <option>Boys</option>
                <option>Women</option>
                <option>Men</option>
                <option>Mixed</option>
                <option>Open</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Division
              </label>

              <input
                value={division}
                onChange={(event) =>
                  setDivision(event.target.value)
                }
                placeholder="Premier"
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Season
              </label>

              <input
                value={season}
                onChange={(event) =>
                  setSeason(event.target.value)
                }
                placeholder="2026"
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Your position
            </label>

            <input
              value={position}
              onChange={(event) =>
                setPosition(event.target.value)
              }
              placeholder="e.g. Point Guard"
              className="w-full rounded-xl bg-[#081642] px-4 py-3"
            />
          </div>

          <div className="rounded-2xl bg-[#081642] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              Public team name
            </p>

            <p className="mt-2 text-xl font-bold">
              {[
                clubName,
                teamName,
                ageGroup,
                gender,
                division,
              ]
                .filter(Boolean)
                .join(" ") ||
                "Your team name will appear here"}
            </p>
          </div>

          {existingTeam && (
            <div className="rounded-2xl border border-[#D8F200]/25 bg-[#D8F200]/10 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                Team already on RADR
              </p>

              <h2 className="mt-2 text-xl font-extrabold">
                {existingTeam.display_name ||
                  [
                    existingTeam.club_name,
                    existingTeam.team_name,
                    existingTeam.age_group,
                  ]
                    .filter(Boolean)
                    .join(" ")}
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/65">
                We found a matching team, so RADR
                has not created another copy.
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {existingTeam.slug && (
                  <Link
                    href={`/teams/${existingTeam.slug}`}
                    className="rounded-xl bg-[#D8F200] px-5 py-3 text-center text-sm font-bold text-[#0B1F5C]"
                  >
                    View Existing Team
                  </Link>
                )}

                <Link
                  href="/dashboard/teams"
                  className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-center text-sm font-semibold"
                >
                  Go to My Teams
                </Link>
              </div>
            </div>
          )}

          {!existingTeam && (
            <button
              type="button"
              onClick={handleCreateTeam}
              disabled={loading}
              className="w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
            >
              {loading
                ? "Checking RADR..."
                : "Create Team"}
            </button>
          )}

          {message && (
            <div className="rounded-xl bg-white/10 p-4 text-sm text-white/75">
              {message}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}