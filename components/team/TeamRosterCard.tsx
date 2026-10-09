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
  onTeamAdminChange: (
    membershipId: string,
    membershipProfileId: string,
    isTeamAdmin: boolean
  ) => Promise<void>;
  onMoveToPrevious: (
    membershipId: string,
    membershipProfileId: string
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
  onTeamAdminChange,
  onMoveToPrevious,
  onRemoveMember,
}: TeamRosterCardProps) {
  const currentCount = memberships.filter(
    (membership) => membership.is_current
  ).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-5 md:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D8F200] sm:text-xs sm:tracking-[0.2em]">
            Roster
          </p>
          <h2 className="mt-1 text-xl font-bold sm:mt-2 sm:text-2xl">Team members</h2>
        </div>
        <div className="shrink-0 rounded-full border border-white/10 bg-[#081642] px-3 py-1.5 text-xs font-bold text-white/75">
          {currentCount} current
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3 md:mt-6">
        {memberships.length === 0 && (
          <div className="rounded-xl bg-[#081642] p-4 text-sm text-white/70 sm:rounded-2xl sm:p-5">
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
            <div
              key={membership.id}
              className={`rounded-xl p-3 sm:rounded-2xl sm:p-4 md:p-5 ${
                membership.is_current
                  ? "bg-[#081642]"
                  : "border border-white/10 bg-[#081642]/55"
              }`}
            >
              <div className="flex items-start gap-3">
                {memberProfile?.profile_photo_url ? (
                  <img
                    src={memberProfile.profile_photo_url}
                    alt={memberProfile.full_name || "Team member"}
                    className="h-11 w-11 shrink-0 rounded-lg object-cover sm:h-12 sm:w-12 sm:rounded-xl md:h-14 md:w-14"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base font-bold sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg md:h-14 md:w-14 md:text-xl">
                    {memberProfile?.full_name?.charAt(0) || "A"}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {memberProfile?.public_slug ? (
                        <Link
                          href={`/p/${memberProfile.public_slug}`}
                          className="block truncate text-sm font-bold hover:underline sm:text-base md:text-lg"
                        >
                          {memberProfile.full_name || "Unnamed member"}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-bold sm:text-base md:text-lg">
                          {memberProfile?.full_name || "Unnamed member"}
                        </p>
                      )}

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/60 sm:text-xs">
                        <span className="font-semibold text-white/75">
                          {getTeamRoleLabel(membership.membership_role)}
                        </span>
                        {membership.is_team_admin && (
                          <>
                            <span className="text-white/25">•</span>
                            <span className="font-bold text-[#D8F200]">Team Admin</span>
                          </>
                        )}
                        {membership.position && (
                          <>
                            <span className="text-white/25">•</span>
                            <span>{membership.position}</span>
                          </>
                        )}
                        {membership.jersey_number && (
                          <>
                            <span className="text-white/25">•</span>
                            <span>#{membership.jersey_number}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] sm:text-[10px] ${
                          membership.is_current
                            ? "bg-[#D8F200]/15 text-[#D8F200]"
                            : "bg-white/10 text-white/45"
                        }`}
                      >
                        {membership.is_current ? "Current" : "Previous"}
                      </span>
                      {isViewer && (
                        <p className="mt-1 text-[10px] font-bold text-[#D8F200]">You</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 sm:text-xs sm:tracking-[0.15em]">
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
                    disabled={!canManage || isViewer || !membership.is_current}
                    className="min-h-[42px] w-full rounded-lg bg-white/10 px-3 py-2 text-xs disabled:opacity-60 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    {TEAM_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-white">Team Admin</p>
                      <p className="mt-1 text-[11px] leading-4 text-white/50">
                        Can edit team details, manage the roster and invite members.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={membership.is_team_admin}
                      disabled={
                        !canManage ||
                        !membership.is_current ||
                        (isViewer && membership.is_team_admin)
                      }
                      onClick={() =>
                        void onTeamAdminChange(
                          membership.id,
                          membership.profile_id,
                          !membership.is_team_admin
                        )
                      }
                      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        membership.is_team_admin
                          ? "bg-[#D8F200]"
                          : "bg-white/15"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                          membership.is_team_admin ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {canManage && !isViewer && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {membership.is_current && (
                      <button
                        type="button"
                        onClick={() =>
                          void onMoveToPrevious(
                            membership.id,
                            membership.profile_id
                          )
                        }
                        className="min-h-[42px] rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                      >
                        Move to Previous
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        void onRemoveMember(
                          membership.id,
                          membership.profile_id
                        )
                      }
                      className="min-h-[42px] rounded-lg bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/30 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
