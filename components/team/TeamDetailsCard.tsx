import type { TeamFormValues } from "./teamTypes";

type TeamDetailsCardProps = {
  values: TeamFormValues;
  canManage: boolean;
  saving: boolean;
  onChange: <K extends keyof TeamFormValues>(
    field: K,
    value: TeamFormValues[K]
  ) => void;
  onSave: () => Promise<void>;
};

const inputClassName =
  "w-full rounded-xl bg-[#081642] px-4 py-3 outline-none disabled:opacity-60";

export default function TeamDetailsCard({
  values,
  canManage,
  saving,
  onChange,
  onSave,
}: TeamDetailsCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
      <h2 className="text-2xl font-bold">Team details</h2>

      <p className="mt-2 text-sm text-white/65">
        Maintain the structured identity used across team, club and athlete
        profiles.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium">Sport</label>
          <input
            value={values.sport}
            onChange={(event) => onChange("sport", event.target.value)}
            disabled={!canManage}
            className={inputClassName}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Country</label>
            <input
              value={values.country}
              onChange={(event) => onChange("country", event.target.value)}
              disabled={!canManage}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              State / Region
            </label>
            <input
              value={values.stateRegion}
              onChange={(event) => onChange("stateRegion", event.target.value)}
              disabled={!canManage}
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Association</label>
          <input
            value={values.associationName}
            onChange={(event) =>
              onChange("associationName", event.target.value)
            }
            disabled={!canManage}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Competition</label>
          <input
            value={values.competitionName}
            onChange={(event) =>
              onChange("competitionName", event.target.value)
            }
            disabled={!canManage}
            className={inputClassName}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Club</label>
            <input
              value={values.clubName}
              onChange={(event) => onChange("clubName", event.target.value)}
              disabled={!canManage}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Team</label>
            <input
              value={values.teamName}
              onChange={(event) => onChange("teamName", event.target.value)}
              disabled={!canManage}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Age Group</label>
            <input
              value={values.ageGroup}
              onChange={(event) => onChange("ageGroup", event.target.value)}
              disabled={!canManage}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Gender</label>
            <input
              value={values.gender}
              onChange={(event) => onChange("gender", event.target.value)}
              disabled={!canManage}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Division</label>
            <input
              value={values.division}
              onChange={(event) => onChange("division", event.target.value)}
              disabled={!canManage}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Season</label>
            <input
              value={values.season}
              onChange={(event) => onChange("season", event.target.value)}
              disabled={!canManage}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-[#081642] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            Public display name
          </p>
          <p className="mt-2 text-lg font-bold">
            {[
              values.clubName,
              values.teamName,
              values.ageGroup,
              values.gender,
              values.division,
            ]
              .filter(Boolean)
              .join(" ") || "Team name not set"}
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={values.isPublic}
            onChange={(event) => onChange("isPublic", event.target.checked)}
            disabled={!canManage}
          />
          Make this team publicly visible
        </label>

        <button
          type="button"
          onClick={() => void onSave()}
          disabled={!canManage || saving}
          className="w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Team Details"}
        </button>
      </div>
    </div>
  );
}
