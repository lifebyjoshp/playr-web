import { supabase } from "./supabase";

export type ActiveAthleteProfile = {
  id: string;
  full_name: string | null;
  preferred_name: string | null;
  public_slug: string | null;
  profile_photo_url: string | null;
  primary_sport: string | null;
  position: string | null;
  account_type: string | null;
  guardian_required: boolean;
  auth_user_id: string | null;
  created_by_user_id: string | null;
};

export type ManagedAthlete = {
  guardianLinkId: string;
  relationship: string;
  canEditProfile: boolean;
  canManagePrivacy: boolean;
  canManageTeams: boolean;
  canManageMetrics: boolean;
  athlete: ActiveAthleteProfile;
};

export type ActiveAthleteContext = {
  authUserId: string;

  activeAthlete: ActiveAthleteProfile | null;

  availableAthletes: ActiveAthleteProfile[];

  managedAthletes: ManagedAthlete[];

  isSelfManaged: boolean;

  isGuardianManaged: boolean;

  requiresAthleteSelection: boolean;

  activeGuardianPermissions: {
    relationship: string;
    canEditProfile: boolean;
    canManagePrivacy: boolean;
    canManageTeams: boolean;
    canManageMetrics: boolean;
  } | null;
};

type GuardianLinkRow = {
  id: string;
  relationship: string;
  can_edit_profile: boolean;
  can_manage_privacy: boolean;
  can_manage_teams: boolean;
  can_manage_metrics: boolean;
  athlete_profile_id: string;

  profiles:
    | ActiveAthleteProfile
    | ActiveAthleteProfile[]
    | null;
};

const PROFILE_SELECT = `
  id,
  full_name,
  preferred_name,
  public_slug,
  profile_photo_url,
  primary_sport,
  position,
  account_type,
  guardian_required,
  auth_user_id,
  created_by_user_id
`;

const ACTIVE_ATHLETE_STORAGE_KEY =
  "radr_active_athlete_id";

function getSingleProfile(
  value:
    | ActiveAthleteProfile
    | ActiveAthleteProfile[]
    | null
): ActiveAthleteProfile | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getStoredAthleteId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(
      ACTIVE_ATHLETE_STORAGE_KEY
    );
  } catch {
    return null;
  }
}

export function setActiveAthleteId(
  athleteId: string
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ACTIVE_ATHLETE_STORAGE_KEY,
      athleteId
    );
  } catch {
    // Ignore storage failures.
  }
}

export function clearActiveAthleteId() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(
      ACTIVE_ATHLETE_STORAGE_KEY
    );
  } catch {
    // Ignore storage failures.
  }
}

function buildGuardianPermissions(
  managed: ManagedAthlete
) {
  return {
    relationship: managed.relationship,
    canEditProfile: managed.canEditProfile,
    canManagePrivacy: managed.canManagePrivacy,
    canManageTeams: managed.canManageTeams,
    canManageMetrics: managed.canManageMetrics,
  };
}

/**
 * Resolves the RADR athlete context for the currently
 * authenticated account.
 *
 * authUserId
 * = who is logged in
 *
 * activeAthlete.id
 * = whose athlete data RADR operates against
 *
 * These IDs are intentionally allowed to be different.
 */
export async function getActiveAthleteContext(): Promise<ActiveAthleteContext | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(
      "Unable to load authenticated RADR account: " +
        authError.message
    );
  }

  if (!user) {
    return null;
  }

  /*
   * ------------------------------------------------------
   * 1. Load the profile associated with the auth account.
   * ------------------------------------------------------
   */
  const { data: ownProfile, error: ownProfileError } =
    await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", user.id)
      .maybeSingle();

  if (ownProfileError) {
    throw new Error(
      "Unable to load RADR account profile: " +
        ownProfileError.message
    );
  }

  /*
   * ------------------------------------------------------
   * 2. Self-managed athlete
   * ------------------------------------------------------
   */
  if (
    ownProfile &&
    ownProfile.account_type === "athlete"
  ) {
    const athlete =
      ownProfile as ActiveAthleteProfile;

    return {
      authUserId: user.id,
      activeAthlete: athlete,
      availableAthletes: [athlete],
      managedAthletes: [],
      isSelfManaged: true,
      isGuardianManaged: false,
      requiresAthleteSelection: false,
      activeGuardianPermissions: null,
    };
  }

  /*
   * ------------------------------------------------------
   * 3. Parent / guardian account
   * ------------------------------------------------------
   */
  const { data: guardianData, error: guardianError } =
    await supabase
      .from("guardian_links")
      .select(
        `
        id,
        relationship,
        can_edit_profile,
        can_manage_privacy,
        can_manage_teams,
        can_manage_metrics,
        athlete_profile_id,
        profiles!guardian_links_athlete_profile_id_fkey (
          ${PROFILE_SELECT}
        )
      `
      )
      .eq("guardian_profile_id", user.id)
      .eq("status", "active")
      .order("created_at", {
        ascending: true,
      });

  if (guardianError) {
    throw new Error(
      "Unable to load managed athletes: " +
        guardianError.message
    );
  }

  const guardianRows =
    (guardianData || []) as unknown as GuardianLinkRow[];

  const managedAthletes: ManagedAthlete[] =
    guardianRows
      .map((link) => {
        const athlete = getSingleProfile(
          link.profiles
        );

        if (!athlete) {
          return null;
        }

        return {
          guardianLinkId: link.id,
          relationship: link.relationship,
          canEditProfile: link.can_edit_profile,
          canManagePrivacy:
            link.can_manage_privacy,
          canManageTeams:
            link.can_manage_teams,
          canManageMetrics:
            link.can_manage_metrics,
          athlete,
        };
      })
      .filter(
        (
          item
        ): item is ManagedAthlete =>
          item !== null
      );

  const availableAthletes =
    managedAthletes.map(
      (item) => item.athlete
    );

  /*
   * ------------------------------------------------------
   * 4. Guardian without a managed athlete
   * ------------------------------------------------------
   */
  if (managedAthletes.length === 0) {
    clearActiveAthleteId();

    return {
      authUserId: user.id,
      activeAthlete: null,
      availableAthletes: [],
      managedAthletes: [],
      isSelfManaged: false,
      isGuardianManaged: false,
      requiresAthleteSelection: false,
      activeGuardianPermissions: null,
    };
  }

  /*
   * ------------------------------------------------------
   * 5. Guardian with one athlete
   *
   * Automatically use that athlete.
   * ------------------------------------------------------
   */
  if (managedAthletes.length === 1) {
    const managed = managedAthletes[0];

    setActiveAthleteId(
      managed.athlete.id
    );

    return {
      authUserId: user.id,
      activeAthlete: managed.athlete,
      availableAthletes,
      managedAthletes,
      isSelfManaged: false,
      isGuardianManaged: true,
      requiresAthleteSelection: false,
      activeGuardianPermissions:
        buildGuardianPermissions(managed),
    };
  }

  /*
   * ------------------------------------------------------
   * 6. Guardian with multiple athletes
   *
   * Look for the athlete previously selected by the user.
   * ------------------------------------------------------
   */
  const storedAthleteId =
    getStoredAthleteId();

  if (storedAthleteId) {
    const selectedManagedAthlete =
      managedAthletes.find(
        (item) =>
          item.athlete.id ===
          storedAthleteId
      );

    if (selectedManagedAthlete) {
      return {
        authUserId: user.id,
        activeAthlete:
          selectedManagedAthlete.athlete,
        availableAthletes,
        managedAthletes,
        isSelfManaged: false,
        isGuardianManaged: true,
        requiresAthleteSelection: false,
        activeGuardianPermissions:
          buildGuardianPermissions(
            selectedManagedAthlete
          ),
      };
    }

    /*
     * The stored athlete is no longer managed by this
     * account, so remove the stale selection.
     */
    clearActiveAthleteId();
  }

  /*
   * ------------------------------------------------------
   * 7. Multiple athletes but none selected yet.
   * ------------------------------------------------------
   */
  return {
    authUserId: user.id,
    activeAthlete: null,
    availableAthletes,
    managedAthletes,
    isSelfManaged: false,
    isGuardianManaged: true,
    requiresAthleteSelection: true,
    activeGuardianPermissions: null,
  };
}