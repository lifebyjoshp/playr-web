import Link from "next/link";
import { TEAM_ROLES, getTeamRoleLabel } from "./teamRoles";
import type { Membership } from "./teamTypes";

type TeamRosterCardProps = {
  memberships: Membership[];
  viewerId: string | null;
  canManage: boolean;
  onRoleChange: (
    membershipId: string,
    membershipProfileId: string,
    newRole: string
  ) => Promise<void>;
  onRemoveMember: (
    membershipId: string,
    membershipProfileId: string
  ) => Promise<void>;
};

export default function TeamRosterCard({
  memberships,
  viewerId,
  canManage,
  onRoleChange,
  onRemoveMember,
}: TeamRosterCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
          Roster
        </p>
        <h2 className="mt-3 text-2xl font-bold">Team members</h2>
        <p className="mt-2 text-sm text-white/65">
          {memberships.length} team member{memberships.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {memberships.length === 0 && (
          <div className="rounded-2xl bg-[#081642] p-5 text-white/70">
            No team members have been added yet.
          </div>
        )}

        {memberships.map((membership) => {
          const profileValue = membership.profiles;
          const memberProfile = Array.isArray(profileValue)
            ? profileValue[0]
            : profileValue;

          const isViewer = membership.profile_id === viewerId;

          return (
            <div key={membership.id} className="rounded-2xl bg-[#081642] p-5">
              <div className="flex items-start gap-4">
                {memberProfile?.profile_photo_url ? (
                  <img
                    src={memberProfile.profile_photo_url}
                    alt={memberProfile.full_name || "Team member"}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
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
                      {memberProfile.full_name || "Unnamed member"}
                    </Link>
                  ) : (
                    <p className="text-lg font-bold">
                      {memberProfile?.full_name || "Unnamed member"}
                    </p>
                  )}

                  <p className="mt-1 text-sm text-white/65">
                    {getTeamRoleLabel(membership.membership_role)}
                  </p>

                  {membership.position && (
                    <p className="mt-1 text-sm text-white/55">
                      {membership.position}
                    </p>
                  )}

                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                    {membership.membership_status}
                    {isViewer ? " • You" : ""}
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
                    void onRoleChange(
                      membership.id,
                      membership.profile_id,
                      event.target.value
                    )
                  }
                  disabled={!canManage || isViewer}
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm disabled:opacity-60"
                >
                  {TEAM_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {canManage && !isViewer && (
                <button
                  type="button"
                  onClick={() =>
                    void onRemoveMember(
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
  );
}
