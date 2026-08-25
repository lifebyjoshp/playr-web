"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../../../../../components/AppShell";
import { supabase } from "../../../../../lib/supabase";

type AthleteProfile = {
  id: string;
  full_name: string | null;
  preferred_name: string | null;
  headline: string | null;
  bio: string | null;
  public_slug: string | null;
  is_public: boolean | null;
  primary_sport: string | null;
  position: string | null;
  state: string | null;
  country: string | null;
  school_name: string | null;
  eligible_countries: string[];
  languages: string[];
  profile_photo_url: string | null;
};

type GuardianLink = {
  id: string;
  athlete_profile_id: string;
  guardian_profile_id: string;
  status: string;
  can_edit_profile: boolean;
};

function cleanList(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

export default function GuardianManagedProfilePage() {
  const params = useParams<{ athleteId: string }>();
  const athleteId = params.athleteId;

  const [guardianLink, setGuardianLink] =
    useState<GuardianLink | null>(null);

  const [profile, setProfile] =
    useState<AthleteProfile | null>(null);

  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [primarySport, setPrimarySport] = useState("");
  const [position, setPosition] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("");
  const [schoolName, setSchoolName] = useState("");

  const [eligibleCountries, setEligibleCountries] = useState<
    string[]
  >([]);

  const [languages, setLanguages] = useState<string[]>([]);

  const [newEligibleCountry, setNewEligibleCountry] =
    useState("");

  const [newLanguage, setNewLanguage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  useEffect(() => {
    const loadAthlete = async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessageType("error");
        setMessage("You must be logged in.");
        setLoading(false);
        return;
      }

      const { data: linkData, error: linkError } =
        await supabase
          .from("guardian_links")
          .select(
            `
            id,
            athlete_profile_id,
            guardian_profile_id,
            status,
            can_edit_profile
          `
          )
          .eq("athlete_profile_id", athleteId)
          .eq("guardian_profile_id", user.id)
          .eq("status", "active")
          .maybeSingle();

      if (linkError || !linkData) {
        setMessageType("error");
        setMessage(
          "You do not have an active guardian link for this athlete."
        );
        setLoading(false);
        return;
      }

      const loadedLink = linkData as GuardianLink;

      if (!loadedLink.can_edit_profile) {
        setMessageType("error");
        setMessage(
          "Your guardian permissions do not allow profile editing."
        );
        setGuardianLink(loadedLink);
        setLoading(false);
        return;
      }

      setGuardianLink(loadedLink);

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            `
            id,
            full_name,
            preferred_name,
            headline,
            bio,
            public_slug,
            is_public,
            primary_sport,
            position,
            state,
            country,
            school_name,
            eligible_countries,
            languages,
            profile_photo_url
          `
          )
          .eq("id", athleteId)
          .single();

      if (profileError || !profileData) {
        setMessageType("error");
        setMessage(
          `Unable to load athlete profile: ${
            profileError?.message || "Profile not found."
          }`
        );
        setLoading(false);
        return;
      }

      const loadedProfile: AthleteProfile = {
        ...profileData,
        eligible_countries: Array.isArray(
          profileData.eligible_countries
        )
          ? profileData.eligible_countries
          : [],
        languages: Array.isArray(profileData.languages)
          ? profileData.languages
          : [],
      };

      setProfile(loadedProfile);

      setFullName(loadedProfile.full_name || "");
      setPreferredName(
        loadedProfile.preferred_name || ""
      );
      setHeadline(loadedProfile.headline || "");
      setBio(loadedProfile.bio || "");
      setPublicSlug(loadedProfile.public_slug || "");
      setIsPublic(loadedProfile.is_public ?? true);

      setPrimarySport(
        loadedProfile.primary_sport || ""
      );
      setPosition(loadedProfile.position || "");
      setStateRegion(loadedProfile.state || "");
      setCountry(loadedProfile.country || "");
      setSchoolName(loadedProfile.school_name || "");

      setEligibleCountries(
        cleanList(loadedProfile.eligible_countries)
      );

      setLanguages(
        cleanList(loadedProfile.languages)
      );

      setLoading(false);
    };

    if (athleteId) {
      void loadAthlete();
    }
  }, [athleteId]);

  const addEligibleCountry = () => {
    const value = newEligibleCountry.trim();

    if (!value) return;

    setEligibleCountries((current) =>
      cleanList([...current, value])
    );

    setNewEligibleCountry("");
  };

  const removeEligibleCountry = (
    countryToRemove: string
  ) => {
    setEligibleCountries((current) =>
      current.filter(
        (item) => item !== countryToRemove
      )
    );
  };

  const addLanguage = () => {
    const value = newLanguage.trim();

    if (!value) return;

    setLanguages((current) =>
      cleanList([...current, value])
    );

    setNewLanguage("");
  };

  const removeLanguage = (
    languageToRemove: string
  ) => {
    setLanguages((current) =>
      current.filter(
        (item) => item !== languageToRemove
      )
    );
  };

  const handleSave = async () => {
    if (!guardianLink?.can_edit_profile) {
      setMessageType("error");
      setMessage(
        "You do not have permission to edit this athlete."
      );
      return;
    }

    setSaving(true);
    setMessageType("info");
    setMessage("Saving athlete profile...");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        preferred_name: preferredName || null,
        headline,
        bio,
        public_slug: publicSlug,
        is_public: isPublic,
        primary_sport: primarySport,
        position,
        state: stateRegion,
        country,
        school_name: schoolName || null,
        eligible_countries:
          cleanList(eligibleCountries),
        languages: cleanList(languages),
      })
      .eq("id", athleteId);

    if (error) {
      setMessageType("error");
      setMessage(
        `Unable to save athlete profile: ${error.message}`
      );
      setSaving(false);
      return;
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            full_name: fullName,
            preferred_name:
              preferredName || null,
            headline,
            bio,
            public_slug: publicSlug,
            is_public: isPublic,
            primary_sport: primarySport,
            position,
            state: stateRegion,
            country,
            school_name:
              schoolName || null,
            eligible_countries:
              cleanList(eligibleCountries),
            languages:
              cleanList(languages),
          }
        : current
    );

    setMessageType("success");
    setMessage(
      "Athlete profile updated successfully."
    );

    setSaving(false);
  };

  if (loading) {
    return (
      <AppShell>
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8">
            Loading athlete profile...
          </div>
        </section>
      </AppShell>
    );
  }

  if (!profile || !guardianLink?.can_edit_profile) {
    return (
      <AppShell>
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-red-100">
            <h1 className="text-2xl font-bold">
              Profile access unavailable
            </h1>

            <p className="mt-3">
              {message ||
                "You do not have permission to edit this athlete."}
            </p>
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
            Guardian Access
          </p>

          <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
            Manage Athlete Profile
          </h1>

          <p className="mt-3 text-white/70">
            You are editing this athlete profile using
            approved parent / guardian access.
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

        <div className="space-y-6 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
          <div className="flex items-center gap-4 rounded-2xl bg-[#081642] p-5">
            {profile.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={
                  profile.full_name ||
                  "Athlete"
                }
                className="h-20 w-20 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/10 text-2xl font-bold">
                {(
                  preferredName ||
                  fullName ||
                  "A"
                ).charAt(0)}
              </div>
            )}

            <div>
              <p className="text-xl font-bold">
                {preferredName ||
                  fullName ||
                  "Unnamed Athlete"}
              </p>

              <p className="mt-1 text-sm text-white/55">
                Guardian-managed athlete profile
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Preferred Name
              </label>

              <input
                type="text"
                value={preferredName}
                onChange={(event) =>
                  setPreferredName(event.target.value)
                }
                className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Headline
            </label>

            <input
              type="text"
              value={headline}
              onChange={(event) =>
                setHeadline(event.target.value)
              }
              className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Bio
            </label>

            <textarea
              value={bio}
              onChange={(event) =>
                setBio(event.target.value)
              }
              rows={5}
              className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Public Profile URL
            </label>

            <input
              type="text"
              value={publicSlug}
              onChange={(event) =>
                setPublicSlug(event.target.value)
              }
              className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
            />

            <p className="mt-2 text-sm text-[#D8F200]">
              /p/{publicSlug || "athlete-name"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Primary Sport
              </label>

              <input
                type="text"
                value={primarySport}
                onChange={(event) =>
                  setPrimarySport(event.target.value)
                }
                className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Position
              </label>

              <input
                type="text"
                value={position}
                onChange={(event) =>
                  setPosition(event.target.value)
                }
                className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                State / Region
              </label>

              <input
                type="text"
                value={stateRegion}
                onChange={(event) =>
                  setStateRegion(event.target.value)
                }
                className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Country
              </label>

              <input
                type="text"
                value={country}
                onChange={(event) =>
                  setCountry(event.target.value)
                }
                className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              School / College
            </label>

            <input
              type="text"
              value={schoolName}
              onChange={(event) =>
                setSchoolName(event.target.value)
              }
              className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
            />
          </div>

          <div className="rounded-2xl bg-[#081642] p-5">
            <label className="block text-sm font-medium">
              Nationality / Eligibility
            </label>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newEligibleCountry}
                onChange={(event) =>
                  setNewEligibleCountry(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    addEligibleCountry();
                  }
                }}
                placeholder="e.g. Australia"
                className="min-w-0 flex-1 rounded-xl bg-[#0B1F5C] px-4 py-3 outline-none"
              />

              <button
                type="button"
                onClick={addEligibleCountry}
                className="rounded-xl bg-[#D8F200] px-4 py-3 font-bold text-[#0B1F5C]"
              >
                Add
              </button>
            </div>

            {eligibleCountries.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {eligibleCountries.map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        removeEligibleCountry(
                          item
                        )
                      }
                      className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold"
                    >
                      {item} ×
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-[#081642] p-5">
            <label className="block text-sm font-medium">
              Languages Spoken
            </label>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newLanguage}
                onChange={(event) =>
                  setNewLanguage(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    addLanguage();
                  }
                }}
                placeholder="e.g. English"
                className="min-w-0 flex-1 rounded-xl bg-[#0B1F5C] px-4 py-3 outline-none"
              />

              <button
                type="button"
                onClick={addLanguage}
                className="rounded-xl bg-[#D8F200] px-4 py-3 font-bold text-[#0B1F5C]"
              >
                Add
              </button>
            </div>

            {languages.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {languages.map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        removeLanguage(item)
                      }
                      className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold"
                    >
                      {item} ×
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) =>
                setIsPublic(
                  event.target.checked
                )
              }
            />

            Make athlete profile public
          </label>

          <button
            type="button"
            onClick={() =>
              void handleSave()
            }
            disabled={saving}
            className="w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Athlete Profile"}
          </button>
        </div>
      </section>
    </AppShell>
  );
}