"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import WelcomeStep from "../../components/onboarding/WelcomeStep";
import AboutStep from "../../components/onboarding/AboutStep";
import SportStep from "../../components/onboarding/SportStep";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  preferred_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  primary_sport: string | null;
  position: string | null;
  account_type: string | null;
  onboarding_complete: boolean;
  profile_photo_url: string | null;
  public_slug: string | null;
  is_founding_athlete: boolean;
  founding_athlete_number: number | null;
};

const TOTAL_STEPS = 5;

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [sport, setSport] = useState("");
  const [position, setPosition] = useState("");

  const [associationName, setAssociationName] =
    useState("");

  const [competitionName, setCompetitionName] =
    useState("");

  const [clubName, setClubName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);

  const [profilePhotoUrl, setProfilePhotoUrl] =
    useState("");

  const [teamAdded, setTeamAdded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          preferred_name,
          date_of_birth,
          gender,
          primary_sport,
          position,
          account_type,
          onboarding_complete,
          country,
          state,
          age_group,
          profile_photo_url,
          public_slug,
          is_founding_athlete,
          founding_athlete_number
        `
        )
        .eq("id", user.id)
        .single();

      if (error || !data) {
        setMessageType("error");
        setMessage(
          "Unable to load your RADR profile."
        );
        setLoading(false);
        return;
      }

      if (data.account_type === "family") {
        router.replace(
          "/dashboard/family/new-athlete"
        );
        return;
      }

      if (data.onboarding_complete) {
        router.replace("/dashboard");
        return;
      }

      setProfile(data as Profile);

      setFullName(data.full_name || "");
      setPreferredName(data.preferred_name || "");
      setDateOfBirth(data.date_of_birth || "");
      setGender(data.gender || "");
      setSport(data.primary_sport || "");
      setPosition(data.position || "");
      setCountry(data.country || "");
      setStateRegion(data.state || "");
      setAgeGroup(data.age_group || "");
      setProfilePhotoUrl(
        data.profile_photo_url || ""
      );

      setLoading(false);
    };

    void loadProfile();
  }, [router]);

  const saveAbout = async () => {
    if (!profile) return;

    if (!fullName.trim()) {
      setMessageType("error");
      setMessage(
        "Please enter your full name."
      );
      return;
    }

    if (!dateOfBirth) {
      setMessageType("error");
      setMessage(
        "Please enter your date of birth."
      );
      return;
    }

    if (!gender) {
      setMessageType("error");
      setMessage(
        "Please select your gender."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        preferred_name:
          preferredName.trim() || null,
        date_of_birth: dateOfBirth,
        gender,
      })
      .eq("id", profile.id);

    if (error) {
      setMessageType("error");
      setMessage(
        `Unable to save your details: ${error.message}`
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    setStep(2);
  };

  const saveSport = async () => {
    if (!profile) return;

    if (!sport) {
      setMessageType("error");
      setMessage(
        "Please choose your primary sport."
      );
      return;
    }

    if (!position.trim()) {
      setMessageType("error");
      setMessage(
        "Please add your primary position."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        primary_sport: sport,
        position: position.trim(),
      })
      .eq("id", profile.id);

    if (error) {
      setMessageType("error");
      setMessage(
        `Unable to save your sport: ${error.message}`
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    setStep(3);
  };

  const saveTeam = async () => {
    if (!profile) return;

    const hasTeamDetails = Boolean(
      associationName.trim() ||
        competitionName.trim() ||
        clubName.trim() ||
        teamName.trim()
    );

    if (!hasTeamDetails) {
      setTeamAdded(false);
      setStep(4);
      return;
    }

    setSaving(true);
    setMessage("");

    const displayName = [
      clubName.trim(),
      teamName.trim(),
      ageGroup.trim(),
    ]
      .filter(Boolean)
      .join(" ");

    const {
      data: teamData,
      error: teamError,
    } = await supabase
      .from("teams")
      .insert({
        sport,
        country: country.trim() || null,
        state: stateRegion.trim() || null,
        association_name:
          associationName.trim() || null,
        competition_name:
          competitionName.trim() || null,
        club_name: clubName.trim() || null,
        team_name: teamName.trim() || null,
        age_group: ageGroup.trim() || null,
        gender: gender || null,
        display_name:
          displayName ||
          clubName.trim() ||
          teamName.trim() ||
          `${sport} Team`,
      })
      .select("id")
      .single();

    if (teamError || !teamData) {
      setMessageType("error");

      setMessage(
        `Unable to create your team: ${
          teamError?.message ||
          "Unknown error"
        }`
      );

      setSaving(false);
      return;
    }

    const { error: membershipError } =
      await supabase
        .from("player_team_memberships")
        .insert({
          profile_id: profile.id,
          team_id: teamData.id,
          position: position.trim(),
          start_date: startDate || null,
          end_date: null,
          is_current: isCurrent,
        });

    if (membershipError) {
      setMessageType("error");

      setMessage(
        `Team created, but experience could not be saved: ${membershipError.message}`
      );

      setSaving(false);
      return;
    }

    const { error: profileError } =
      await supabase
        .from("profiles")
        .update({
          country: country.trim() || null,
          state: stateRegion.trim() || null,
          age_group: ageGroup.trim() || null,
        })
        .eq("id", profile.id);

    if (profileError) {
      setMessageType("error");

      setMessage(
        `Team saved, but athlete details could not be updated: ${profileError.message}`
      );

      setSaving(false);
      return;
    }

    setTeamAdded(true);
    setSaving(false);
    setStep(4);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setUploadingImage(true);
    setMessageType("info");
    setMessage("Uploading image...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessageType("error");
      setMessage(
        "You must be logged in."
      );
      setUploadingImage(false);
      return;
    }

    const fileExt =
      file.name.split(".").pop() ||
      "jpg";

    const fileName =
      `${user.id}-${Date.now()}.${fileExt}`;

    const filePath =
      `profiles/${fileName}`;

    const { error: uploadError } =
      await supabase.storage
        .from("profile-photos")
        .upload(filePath, file);

    if (uploadError) {
      setMessageType("error");
      setMessage(
        `Upload failed: ${uploadError.message}`
      );
      setUploadingImage(false);
      return;
    }

    const { data } =
      supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

    const publicUrl =
      data.publicUrl;

    const {
      error: profileUpdateError,
    } = await supabase
      .from("profiles")
      .update({
        profile_photo_url: publicUrl,
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      setMessageType("error");

      setMessage(
        `Image uploaded but profile update failed: ${profileUpdateError.message}`
      );

      setUploadingImage(false);
      return;
    }

    setProfilePhotoUrl(publicUrl);

    setMessageType("success");
    setMessage(
      "Profile photo uploaded."
    );

    setUploadingImage(false);
  };

  const finishOnboarding = async () => {
    if (!profile) return;

    setSaving(true);
    setMessageType("info");
    setMessage(
      "Finishing your RADR..."
    );

    let publicSlug =
      profile.public_slug;

    if (!publicSlug) {
      const slugBase =
        createSlug(
          preferredName.trim() ||
            fullName.trim()
        ) || "athlete";

      publicSlug =
        `${slugBase}-${profile.id.slice(
          0,
          6
        )}`;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        public_slug: publicSlug,
        is_public: true,
        onboarding_complete: true,
        activated_at:
          new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      setMessageType("error");

      setMessage(
        `Unable to finish onboarding: ${error.message}`
      );

      setSaving(false);
      return;
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            public_slug: publicSlug,
            onboarding_complete: true,
          }
        : current
    );

    setMessage("");
    setSaving(false);
    setStep(5);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B1F5C] text-white">
        <Navbar />

        <section className="mx-auto max-w-4xl px-4 py-16 md:px-6">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-white/65">
            Preparing your RADR...
          </div>
        </section>
      </main>
    );
  }

  const progressStep =
    Math.min(step, TOTAL_STEPS);

  const progressPercentage =
    Math.round(
      (progressStep /
        TOTAL_STEPS) *
        100
    );

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <section className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
        {step > 0 &&
          step < 5 && (
            <div className="mb-7">
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                  Building Your RADR
                </p>

                <p className="text-xs font-semibold text-white/45">
                  {progressPercentage}%
                </p>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#D8F200] transition-all duration-300"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>
            </div>
          )}

        {message && (
          <div
            className={`mb-6 rounded-2xl p-4 text-sm font-medium ${
              messageType ===
              "success"
                ? "bg-green-500/20 text-green-100"
                : messageType ===
                    "error"
                  ? "bg-red-500/20 text-red-100"
                  : "bg-white/10 text-white/75"
            }`}
          >
            {message}
          </div>
        )}

        {step === 0 && (
          <WelcomeStep
            displayName={
              preferredName ||
              fullName.split(" ")[0] ||
              ""
            }
            onContinue={() => {
              setMessage("");
              setStep(1);
            }}
          />
        )}

        {step === 1 && (
          <AboutStep
            fullName={fullName}
            preferredName={preferredName}
            dateOfBirth={dateOfBirth}
            gender={gender}
            onFullNameChange={setFullName}
            onPreferredNameChange={
              setPreferredName
            }
            onDateOfBirthChange={
              setDateOfBirth
            }
            onGenderChange={setGender}
            onBack={() => {
              setMessage("");
              setStep(0);
            }}
            onContinue={() => {
              if (!saving) {
                void saveAbout();
              }
            }}
          />
        )}

        {step === 2 && (
          <SportStep
            sport={sport}
            position={position}
            onSportChange={setSport}
            onPositionChange={
              setPosition
            }
            onBack={() => {
              setMessage("");
              setStep(1);
            }}
            onContinue={() => {
              if (!saving) {
                void saveSport();
              }
            }}
          />
        )}

        {step === 3 && (
          <section className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur md:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D8F200]">
              Current Team
            </p>

            <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
              Where are you playing now?
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/65">
              Add your current team so
              your RADR starts with real
              sporting context. You can
              skip this and add it later.
            </p>

            <div className="mt-8 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Country
                  </label>

                  <input
                    type="text"
                    value={country}
                    onChange={(event) =>
                      setCountry(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Australia"
                    className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    State / Region
                  </label>

                  <input
                    type="text"
                    value={stateRegion}
                    onChange={(event) =>
                      setStateRegion(
                        event.target.value
                      )
                    }
                    placeholder="e.g. NSW"
                    className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Association
                </label>

                <input
                  type="text"
                  value={associationName}
                  onChange={(event) =>
                    setAssociationName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Basketball NSW"
                  className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Competition
                </label>

                <input
                  type="text"
                  value={competitionName}
                  onChange={(event) =>
                    setCompetitionName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Junior Premier League"
                  className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Club
                  </label>

                  <input
                    type="text"
                    value={clubName}
                    onChange={(event) =>
                      setClubName(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Newcastle Falcons"
                    className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Team
                  </label>

                  <input
                    type="text"
                    value={teamName}
                    onChange={(event) =>
                      setTeamName(
                        event.target.value
                      )
                    }
                    placeholder="e.g. U14 Girls"
                    className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Age Group
                  </label>

                  <input
                    type="text"
                    value={ageGroup}
                    onChange={(event) =>
                      setAgeGroup(
                        event.target.value
                      )
                    }
                    placeholder="e.g. U14"
                    className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none focus:border-[#D8F200]/50"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-xl bg-[#081642] p-4 text-sm">
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(event) =>
                    setIsCurrent(
                      event.target.checked
                    )
                  }
                />

                I currently play for
                this team
              </label>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setStep(2);
                }}
                className="rounded-xl border border-white/15 bg-white/10 px-6 py-3 font-semibold"
              >
                ← Back
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setTeamAdded(false);
                    setStep(4);
                  }}
                  className="rounded-xl border border-white/15 px-6 py-3 font-semibold text-white/65"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    if (!saving) {
                      void saveTeam();
                    }
                  }}
                  className="rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : "Continue →"}
                </button>
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
  <section className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur md:p-9">
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D8F200]">
      Profile Photo
    </p>

    <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
      Put a face to your story.
    </h1>

    <p className="mt-4 max-w-2xl leading-7 text-white/65">
      A profile photo makes your RADR instantly more recognisable.
      You can change it at any time.
    </p>

    <div className="mt-8 flex flex-col items-center rounded-3xl bg-[#081642] p-8 text-center">
      {profilePhotoUrl ? (
        <img
          src={profilePhotoUrl}
          alt="Profile"
          className="h-40 w-40 rounded-3xl object-cover"
        />
      ) : (
        <div className="flex h-40 w-40 items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/5 text-sm text-white/45">
          No Photo
        </div>
      )}

      <label className="mt-6 cursor-pointer rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C]">
        {uploadingImage
          ? "Uploading..."
          : profilePhotoUrl
            ? "Change Photo"
            : "Upload Photo"}

        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploadingImage}
          className="hidden"
        />
      </label>

      {uploadingImage && (
        <p className="mt-3 text-sm text-white/55">
          Uploading your photo...
        </p>
      )}

      {profilePhotoUrl && (
        <p className="mt-3 text-sm font-semibold text-[#D8F200]">
          ✓ Photo added
        </p>
      )}
    </div>

    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={() => {
          setMessage("");
          setStep(3);
        }}
        disabled={uploadingImage}
        className="rounded-xl border border-white/15 bg-white/10 px-6 py-3 font-semibold disabled:opacity-50"
      >
        ← Back
      </button>

      <div className="flex flex-col gap-3 sm:flex-row">
        {!profilePhotoUrl && (
          <button
            type="button"
            onClick={() => {
              setMessage("");
              void finishOnboarding();
            }}
            disabled={uploadingImage}
            className="rounded-xl border border-white/15 px-6 py-3 font-semibold text-white/65 disabled:opacity-50"
          >
            Skip for now
          </button>
        )}

        {profilePhotoUrl && (
          <button
            type="button"
            onClick={() => {
              setMessage("");
              void finishOnboarding();
            }}
            disabled={uploadingImage}
            className="rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-50"
          >
            Finish My RADR →
          </button>
        )}
      </div>
    </div>
  </section>
)}

        {step === 5 && (
          <section className="overflow-hidden rounded-[36px] border border-[#D8F200]/25 bg-white/10 shadow-2xl backdrop-blur">
            <div className="bg-[linear-gradient(135deg,rgba(216,242,0,0.15),rgba(17,77,255,0.18))] p-8 text-center md:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F200] text-3xl">
                ✓
              </div>

              <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-[#D8F200]">
                Welcome to RADR
              </p>

              <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
                Your RADR is live.
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/65">
                You&apos;ve built the
                foundation. Now keep adding
                to your sporting story as
                you grow.
              </p>
            </div>

            {profile?.is_founding_athlete && (
              <div className="border-y border-[#D8F200]/20 bg-[#D8F200]/10 p-7 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D8F200]">
                  Founding Athlete
                </p>

                <p className="mt-3 text-4xl font-extrabold">
                  #
                  {String(
                    profile.founding_athlete_number ||
                      0
                  ).padStart(3, "0")}
                </p>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/65">
                  You&apos;re one of the
                  first athletes helping
                  shape RADR. Your Founding
                  Athlete status will remain
                  part of your RADR.
                </p>
              </div>
            )}

            <div className="p-7 md:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                Your RADR So Far
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl bg-[#081642] p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D8F200] text-sm font-extrabold text-[#0B1F5C]">
                    ✓
                  </span>

                  <span className="font-semibold">
                    Athlete details
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-[#081642] p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D8F200] text-sm font-extrabold text-[#0B1F5C]">
                    ✓
                  </span>

                  <span className="font-semibold">
                    Sport & position
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-[#081642] p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D8F200] text-sm font-extrabold text-[#0B1F5C]">
                    {teamAdded
                      ? "✓"
                      : "○"}
                  </span>

                  <span className="font-semibold">
                    Current team
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-[#081642] p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D8F200] text-sm font-extrabold text-[#0B1F5C]">
                    {profilePhotoUrl
                      ? "✓"
                      : "○"}
                  </span>

                  <span className="font-semibold">
                    Profile photo
                  </span>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-white/10 bg-[#081642] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                  Next Opportunities
                </p>

                <h2 className="mt-2 text-2xl font-extrabold">
                  Keep strengthening your
                  RADR.
                </h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/5 p-4 text-sm font-semibold">
                    + Add an Achievement
                  </div>

                  <div className="rounded-xl bg-white/5 p-4 text-sm font-semibold">
                    + Add a Highlight
                  </div>

                  <div className="rounded-xl bg-white/5 p-4 text-sm font-semibold">
                    + Add Experience
                  </div>

                  <div className="rounded-xl bg-white/5 p-4 text-sm font-semibold">
                    + Start your AD
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {profile.public_slug && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/p/${profile.public_slug}`
                      )
                    }
                    className="rounded-xl border border-white/15 bg-white/10 px-6 py-4 font-bold transition hover:bg-white/15"
                  >
                    View My RADR
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/dashboard"
                    )
                  }
                  className="rounded-xl bg-[#D8F200] px-6 py-4 font-extrabold text-[#0B1F5C]"
                >
                  Go to Dashboard →
                </button>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}