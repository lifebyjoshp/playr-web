export type MessageType = "success" | "error" | "info";

export type Team = {
  id: string;
  slug: string | null;
  display_name: string;
  sport: string;
  country: string | null;
  state: string | null;
  association_name: string | null;
  competition_name: string | null;
  club_name: string;
  team_name: string;
  age_group: string | null;
  gender: string | null;
  division: string | null;
  season: string | null;
  is_public: boolean;
  verification_status: string;
  created_by: string | null;
};

export type TeamFormValues = {
  sport: string;
  country: string;
  stateRegion: string;
  associationName: string;
  competitionName: string;
  clubName: string;
  teamName: string;
  ageGroup: string;
  gender: string;
  division: string;
  season: string;
  isPublic: boolean;
};

export type ProfileSummary = {
  id: string;
  full_name: string | null;
  public_slug: string | null;
  headline: string | null;
  profile_photo_url: string | null;
  primary_sport: string | null;
  position: string | null;
};

export type Membership = {
  id: string;
  profile_id: string;
  position: string | null;
  jersey_number: string | null;
  is_current: boolean;
  membership_role: string;
  membership_status: string;
  joined_at: string | null;
  profiles: ProfileSummary | ProfileSummary[] | null;
};

export type AthleteSearchResult = {
  id: string;
  full_name: string | null;
  public_slug: string | null;
  headline: string | null;
  primary_sport: string | null;
  state: string | null;
  country: string | null;
  profile_photo_url: string | null;
};
