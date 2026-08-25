import Link from "next/link";
import { BRAND } from "../../lib/branding";
import type { Team } from "./teamTypes";

type TeamManagementHeaderProps = {
  team: Team;
};

export default function TeamManagementHeader({
  team,
}: TeamManagementHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
          Team Management
        </p>

        <h1 className="mt-3 text-4xl font-extrabold">{team.display_name}</h1>

        <p className="mt-3 text-white/70">
          Manage team details, roster and member access on {BRAND.name}.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
          <span className="rounded-full bg-white/10 px-3 py-1">
            {team.verification_status || "unverified"}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            {team.is_public ? "Public" : "Private"}
          </span>
        </div>
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
  );
}
