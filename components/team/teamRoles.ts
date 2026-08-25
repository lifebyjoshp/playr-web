export const TEAM_ROLES = [
  { value: "athlete", label: "Athlete" },
  { value: "captain", label: "Captain" },
  { value: "vice_captain", label: "Vice Captain" },
  { value: "head_coach", label: "Head Coach" },
  { value: "assistant_coach", label: "Assistant Coach" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Team Admin" },
  { value: "trainer", label: "Trainer" },
  { value: "physio", label: "Physio" },
  { value: "statistician", label: "Statistician" },
  { value: "parent_guardian", label: "Parent / Guardian" },
  { value: "volunteer", label: "Volunteer" },
] as const;

export const TEAM_MANAGER_ROLES = [
  "admin",
  "head_coach",
  "assistant_coach",
  "manager",
] as const;

export function getTeamRoleLabel(role: string) {
  return TEAM_ROLES.find((item) => item.value === role)?.label ?? role;
}
