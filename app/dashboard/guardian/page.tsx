"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../../../components/AppShell";
import { supabase } from "../../../lib/supabase";

type ProfileSummary = {
  id: string;
  full_name: string | null;
  preferred_name: string | null;
  public_slug: string | null;
  profile_photo_url: string | null;
  primary_sport: string | null;
  state: string | null;
  country: string | null;
};

type GuardianLink = {
  id: string;
  athlete_profile_id: string;
  guardian_profile_id: string;
  relationship: string;
  status: string;
  can_edit_profile: boolean;
  can_manage_privacy: boolean;
  can_manage_teams: boolean;
  can_manage_metrics: boolean;
  requested_by: string | null;
  created_at: string;
  accepted_at: string | null;

  athlete:
    | ProfileSummary
    | ProfileSummary[]
    | null;

  guardian:
    | ProfileSummary
    | ProfileSummary[]
    | null;
};

type SearchResult = {
  id: string;
  full_name: string | null;
  preferred_name: string | null;
  public_slug: string | null;
  profile_photo_url: string | null;
  primary_sport: string | null;
  state: string | null;
  country: string | null;
};

function getProfile(
  value: ProfileSummary | ProfileSummary[] | null
): ProfileSummary | null {
  if (!value) return null;

  return Array.isArray(value)
    ? value[0] || null
    : value;
}

function displayName(profile: ProfileSummary | null) {
  if (!profile) return "Unknown profile";

  return (
    profile.preferred_name ||
    profile.full_name ||
    "Unnamed profile"
  );
}

export default function GuardianPage() {
  const [viewerId, setViewerId] = useState<string | null>(
    null
  );

  const [viewerProfile, setViewerProfile] =
    useState<ProfileSummary | null>(null);

  const [links, setLinks] = useState<GuardianLink[]>([]);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    SearchResult[]
  >([]);
  const [searching, setSearching] = useState(false);

  const [selectedGuardian, setSelectedGuardian] =
    useState<SearchResult | null>(null);

  const [creatingLink, setCreatingLink] = useState(false);

  const activeGuardianLinks = useMemo(
    () =>
      links.filter(
        (link) =>
          link.athlete_profile_id === viewerId &&
          link.status === "active"
      ),
    [links, viewerId]
  );

  const pendingGuardianLinks = useMemo(
    () =>
      links.filter(
        (link) =>
          link.athlete_profile_id === viewerId &&
          link.status === "pending"
      ),
    [links, viewerId]
  );

  const guardianRequestsForMe = useMemo(
    () =>
      links.filter(
        (link) =>
          link.guardian_profile_id === viewerId &&
          link.status === "pending"
      ),
    [links, viewerId]
  );

  const athletesIManage = useMemo(
    () =>
      links.filter(
        (link) =>
          link.guardian_profile_id === viewerId &&
          link.status === "active"
      ),
    [links, viewerId]
  );

  const loadGuardianData = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessageType("error");
      setMessage(
        "You must be logged in to manage guardian permissions."
      );
      setLoading(false);
      return;
    }

    setViewerId(user.id);

    const { data: profileData } = await supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        preferred_name,
        public_slug,
        profile_photo_url,
        primary_sport,
        state,
        country
      `
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileData) {
      setViewerProfile(profileData as ProfileSummary);
    }

    const { data: linkData, error: linkError } =
      await supabase
        .from("guardian_links")
        .select(
          `
          id,
          athlete_profile_id,
          guardian_profile_id,
          relationship,
          status,
          can_edit_profile,
          can_manage_privacy,
          can_manage_teams,
          can_manage_metrics,
          requested_by,
          created_at,
          accepted_at,

          athlete:profiles!guardian_links_athlete_profile_id_fkey (
            id,
            full_name,
            preferred_name,
            public_slug,
            profile_photo_url,
            primary_sport,
            state,
            country
          ),

          guardian:profiles!guardian_links_guardian_profile_id_fkey (
            id,
            full_name,
            preferred_name,
            public_slug,
            profile_photo_url,
            primary_sport,
            state,
            country
          )
        `
        )
        .or(
          `athlete_profile_id.eq.${user.id},guardian_profile_id.eq.${user.id}`
        )
        .order("created_at", {
          ascending: false,
        });

    if (linkError) {
      setMessageType("error");
      setMessage(
        `Unable to load guardian relationships: ${linkError.message}`
      );
      setLoading(false);
      return;
    }

    setLinks(
      (linkData || []) as unknown as GuardianLink[]
    );

    setLoading(false);
  };

  useEffect(() => {
    void loadGuardianData();
  }, []);

  useEffect(() => {
    const cleanSearch = searchTerm.trim();

    if (
      !viewerId ||
      cleanSearch.length < 2
    ) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          preferred_name,
          public_slug,
          profile_photo_url,
          primary_sport,
          state,
          country
        `
        )
        .neq("id", viewerId)
        .ilike(
          "full_name",
          `%${cleanSearch}%`
        )
        .limit(8);

      if (error) {
        setMessageType("error");
        setMessage(
          `Unable to search profiles: ${error.message}`
        );
        setSearchResults([]);
        setSearching(false);
        return;
      }

      const linkedIds = new Set(
        links
          .filter(
            (link) =>
              link.athlete_profile_id === viewerId
          )
          .map(
            (link) =>
              link.guardian_profile_id
          )
      );

      const available = (data || []).filter(
        (profile) =>
          !linkedIds.has(profile.id)
      );

      setSearchResults(
        available as SearchResult[]
      );

      setSearching(false);
    }, 350);

    return () =>
      window.clearTimeout(timer);
  }, [links, searchTerm, viewerId]);

  const handleCreateGuardianLink = async () => {
    if (!viewerId || !selectedGuardian) {
      return;
    }

    setCreatingLink(true);
    setMessageType("info");
    setMessage(
      "Sending guardian request..."
    );

    const { error } = await supabase
      .from("guardian_links")
      .insert({
        athlete_profile_id: viewerId,
        guardian_profile_id:
          selectedGuardian.id,
        relationship: "parent_guardian",
        status: "pending",
        requested_by: viewerId,
        can_edit_profile: true,
        can_manage_privacy: true,
        can_manage_teams: true,
        can_manage_metrics: true,
      });

    if (error) {
      setMessageType("error");
      setMessage(
        `Unable to create guardian request: ${error.message}`
      );
      setCreatingLink(false);
      return;
    }

    setMessageType("success");
    setMessage(
      `Guardian request sent to ${
        selectedGuardian.preferred_name ||
        selectedGuardian.full_name ||
        "the selected profile"
      }.`
    );

    setSelectedGuardian(null);
    setSearchTerm("");
    setSearchResults([]);

    await loadGuardianData();

    setCreatingLink(false);
  };

  const handleRespondToRequest = async (
    linkId: string,
    nextStatus: "active" | "declined"
  ) => {
    const { error } = await supabase
      .from("guardian_links")
      .update({
        status: nextStatus,
        accepted_at:
          nextStatus === "active"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", linkId);

    if (error) {
      setMessageType("error");
      setMessage(
        `Unable to update guardian request: ${error.message}`
      );
      return;
    }

    setMessageType("success");
    setMessage(
      nextStatus === "active"
        ? "Guardian request accepted."
        : "Guardian request declined."
    );

    await loadGuardianData();
  };

  const handlePermissionChange = async (
    linkId: string,
    field:
      | "can_edit_profile"
      | "can_manage_privacy"
      | "can_manage_teams"
      | "can_manage_metrics",
    value: boolean
  ) => {
    const { error } = await supabase
      .from("guardian_links")
      .update({
        [field]: value,
      })
      .eq("id", linkId);

    if (error) {
      setMessageType("error");
      setMessage(
        `Unable to update permission: ${error.message}`
      );
      return;
    }

    setLinks((current) =>
      current.map((link) =>
        link.id === linkId
          ? {
              ...link,
              [field]: value,
            }
          : link
      )
    );

    setMessageType("success");
    setMessage("Guardian permission updated.");
  };

  const handleRemoveLink = async (
    linkId: string
  ) => {
    const confirmed =
      window.confirm(
        "Remove this guardian relationship?"
      );

    if (!confirmed) return;

    const { error } = await supabase
      .from("guardian_links")
      .update({
        status: "removed",
      })
      .eq("id", linkId);

    if (error) {
      setMessageType("error");
      setMessage(
        `Unable to remove guardian: ${error.message}`
      );
      return;
    }

    setMessageType("success");
    setMessage(
      "Guardian relationship removed."
    );

    await loadGuardianData();
  };

  if (loading) {
    return (
      <AppShell>
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8">
            Loading guardian settings...
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
            Safety & Permissions
          </p>

          <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
            Parent & Guardian
          </h1>

          <p className="mt-3 max-w-3xl text-white/70">
            Link trusted parent or guardian accounts and control
            what they can manage on your RADR profile.
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-2xl p-4 text-sm font-medium ${
              messageType === "success"
                ? "bg-green-500/20 text-green-100"
                : messageType === "error"
                  ? "bg-red-500/20 text-red-100"
                  : "bg-white/10 text-white/75"
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
            <h2 className="text-2xl font-bold">
              Your Profile
            </h2>

            <div className="mt-5 flex items-center gap-4 rounded-2xl bg-[#081642] p-5">
              {viewerProfile?.profile_photo_url ? (
                <img
                  src={
                    viewerProfile.profile_photo_url
                  }
                  alt={
                    viewerProfile.full_name ||
                    "Profile"
                  }
                  className="h-16 w-16 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 text-2xl font-bold">
                  {displayName(
                    viewerProfile
                  ).charAt(0)}
                </div>
              )}

              <div>
                <p className="text-lg font-bold">
                  {displayName(viewerProfile)}
                </p>

                <p className="mt-1 text-sm text-white/60">
                  {[
                    viewerProfile?.primary_sport,
                    viewerProfile?.state,
                    viewerProfile?.country,
                  ]
                    .filter(Boolean)
                    .join(" • ") ||
                    "RADR profile"}
                </p>
              </div>
            </div>
          </div>

          {guardianRequestsForMe.length > 0 && (
            <div className="rounded-3xl border border-[#D8F200]/20 bg-white/10 p-6 backdrop-blur md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                Action Required
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                Guardian Requests
              </h2>

              <div className="mt-6 space-y-4">
                {guardianRequestsForMe.map(
                  (link) => {
                    const athlete =
                      getProfile(link.athlete);

                    return (
                      <div
                        key={link.id}
                        className="rounded-2xl bg-[#081642] p-5"
                      >
                        <p className="font-bold">
                          {displayName(athlete)}
                        </p>

                        <p className="mt-2 text-sm text-white/65">
                          wants to link you as a
                          parent / guardian.
                        </p>

                        <div className="mt-5 flex gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              void handleRespondToRequest(
                                link.id,
                                "active"
                              )
                            }
                            className="rounded-xl bg-[#D8F200] px-5 py-3 font-bold text-[#0B1F5C]"
                          >
                            Accept
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleRespondToRequest(
                                link.id,
                                "declined"
                              )
                            }
                            className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-semibold"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
              Linked Guardians
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Active Guardians
            </h2>

            <p className="mt-2 text-sm text-white/65">
              Guardians can only access the areas you explicitly
              allow.
            </p>

            <div className="mt-6 space-y-4">
              {activeGuardianLinks.length === 0 && (
                <div className="rounded-2xl bg-[#081642] p-5 text-white/65">
                  No active guardians linked yet.
                </div>
              )}

              {activeGuardianLinks.map(
                (link) => {
                  const guardian =
                    getProfile(link.guardian);

                  return (
                    <div
                      key={link.id}
                      className="rounded-2xl bg-[#081642] p-5"
                    >
                      <div className="flex items-start gap-4">
                        {guardian?.profile_photo_url ? (
                          <img
                            src={
                              guardian.profile_photo_url
                            }
                            alt={
                              guardian.full_name ||
                              "Guardian"
                            }
                            className="h-14 w-14 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-xl font-bold">
                            {displayName(
                              guardian
                            ).charAt(0)}
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="text-lg font-bold">
                            {displayName(guardian)}
                          </p>

                          <p className="mt-1 text-sm text-white/55">
                            Parent / Guardian
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <label className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm">
                          <input
                            type="checkbox"
                            checked={
                              link.can_edit_profile
                            }
                            onChange={(event) =>
                              void handlePermissionChange(
                                link.id,
                                "can_edit_profile",
                                event.target.checked
                              )
                            }
                          />

                          Edit athlete profile
                        </label>

                        <label className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm">
                          <input
                            type="checkbox"
                            checked={
                              link.can_manage_privacy
                            }
                            onChange={(event) =>
                              void handlePermissionChange(
                                link.id,
                                "can_manage_privacy",
                                event.target.checked
                              )
                            }
                          />

                          Manage privacy
                        </label>

                        <label className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm">
                          <input
                            type="checkbox"
                            checked={
                              link.can_manage_teams
                            }
                            onChange={(event) =>
                              void handlePermissionChange(
                                link.id,
                                "can_manage_teams",
                                event.target.checked
                              )
                            }
                          />

                          Manage teams
                        </label>

                        <label className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm">
                          <input
                            type="checkbox"
                            checked={
                              link.can_manage_metrics
                            }
                            onChange={(event) =>
                              void handlePermissionChange(
                                link.id,
                                "can_manage_metrics",
                                event.target.checked
                              )
                            }
                          />

                          Manage measurements & metrics
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void handleRemoveLink(
                            link.id
                          )
                        }
                        className="mt-5 rounded-xl bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-100"
                      >
                        Remove Guardian
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {pendingGuardianLinks.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
              <h2 className="text-2xl font-bold">
                Pending Requests
              </h2>

              <div className="mt-5 space-y-3">
                {pendingGuardianLinks.map(
                  (link) => {
                    const guardian =
                      getProfile(link.guardian);

                    return (
                      <div
                        key={link.id}
                        className="rounded-2xl bg-[#081642] p-5"
                      >
                        <p className="font-bold">
                          {displayName(guardian)}
                        </p>

                        <p className="mt-1 text-sm text-white/55">
                          Waiting for guardian acceptance
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
              Link Guardian
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Find a Parent or Guardian
            </h2>

            <p className="mt-2 text-sm text-white/65">
              Search for an existing RADR account by name.
            </p>

            <div className="mt-6">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(
                    event.target.value
                  );

                  setSelectedGuardian(null);
                }}
                placeholder="Start typing their name..."
                className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
              />
            </div>

            {searching && (
              <div className="mt-4 rounded-xl bg-[#081642] p-4 text-sm text-white/65">
                Searching RADR...
              </div>
            )}

            {!selectedGuardian &&
              searchResults.length > 0 && (
                <div className="mt-5 space-y-3">
                  {searchResults.map(
                    (profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() =>
                          setSelectedGuardian(
                            profile
                          )
                        }
                        className="flex w-full items-center gap-4 rounded-2xl bg-[#081642] p-4 text-left transition hover:bg-white/15"
                      >
                        {profile.profile_photo_url ? (
                          <img
                            src={
                              profile.profile_photo_url
                            }
                            alt={
                              profile.full_name ||
                              "Profile"
                            }
                            className="h-14 w-14 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-xl font-bold">
                            {(
                              profile.preferred_name ||
                              profile.full_name ||
                              "R"
                            ).charAt(0)}
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="font-bold">
                            {profile.preferred_name ||
                              profile.full_name ||
                              "Unnamed profile"}
                          </p>

                          <p className="mt-1 text-sm text-white/55">
                            {[
                              profile.primary_sport,
                              profile.state,
                              profile.country,
                            ]
                              .filter(Boolean)
                              .join(" • ") ||
                              "RADR member"}
                          </p>
                        </div>

                        <span className="rounded-xl bg-[#D8F200] px-4 py-2 text-sm font-bold text-[#0B1F5C]">
                          Select
                        </span>
                      </button>
                    )
                  )}
                </div>
              )}

            {selectedGuardian && (
              <div className="mt-5 rounded-2xl border border-[#D8F200]/20 bg-[#081642] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D8F200]">
                  Selected Guardian
                </p>

                <h3 className="mt-2 text-xl font-bold">
                  {selectedGuardian.preferred_name ||
                    selectedGuardian.full_name ||
                    "Unnamed profile"}
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    void handleCreateGuardianLink()
                  }
                  disabled={creatingLink}
                  className="mt-5 w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
                >
                  {creatingLink
                    ? "Sending Request..."
                    : "Send Guardian Request"}
                </button>
              </div>
            )}
          </div>

          {athletesIManage.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
                Guardian Access
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                Athletes You Manage
              </h2>

              <div className="mt-6 space-y-4">
                {athletesIManage.map(
                  (link) => {
                    const athlete =
                      getProfile(link.athlete);

                    return (
                      <div
                        key={link.id}
                        className="rounded-2xl bg-[#081642] p-5"
                      >
                        <p className="text-lg font-bold">
                          {displayName(athlete)}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {athlete?.public_slug && (
                            <Link
                              href={`/p/${athlete.public_slug}`}
                              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold"
                            >
                              View Profile
                            </Link>
                          )}

                          {link.can_edit_profile && (
                            <Link
                              href="/dashboard/public-profile"
                              className="rounded-xl bg-[#D8F200] px-4 py-2 text-sm font-bold text-[#0B1F5C]"
                            >
                              Profile Access
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}