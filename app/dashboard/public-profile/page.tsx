"use client";

import { useEffect, useState } from "react";
import AppShell from "../../../components/AppShell";
import { BRAND } from "../../../lib/branding";
import { supabase } from "../../../lib/supabase";
import { getActiveAthleteContext } from "../../../lib/activeAthlete";

function cleanList(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

export default function PublicProfilePage() {
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
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [eligibleCountries, setEligibleCountries] = useState<string[]>([]);
  const [newEligibleCountry, setNewEligibleCountry] = useState("");

  const [languages, setLanguages] = useState<string[]>([]);
  const [newLanguage, setNewLanguage] = useState("");

  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [athleteProfileId, setAthleteProfileId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  useEffect(() => {
    const loadProfile = async () => {
      const context = await getActiveAthleteContext();

      if (!context || context.requiresAthleteSelection || !context.activeAthlete) {
        setMessageType("error");
        setMessage(
          context?.requiresAthleteSelection
            ? "Choose an athlete before editing a profile."
            : "No athlete profile is connected to this RADR account yet."
        );
        return;
      }

      const activeAthleteId = context.activeAthlete.id;
      setAthleteProfileId(activeAthleteId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", activeAthleteId)
        .single();

      if (error || !data) return;

      setFullName(data.full_name || "");
      setPreferredName(data.preferred_name || "");
      setHeadline(data.headline || "");
      setBio(data.bio || "");
      setPublicSlug(data.public_slug || "");
      setIsPublic(data.is_public ?? true);

      setPrimarySport(data.primary_sport || "");
      setPosition(data.position || "");
      setStateRegion(data.state || "");
      setCountry(data.country || "");
      setSchoolName(data.school_name || "");
      setDateOfBirth(data.date_of_birth || "");

      setEligibleCountries(
        Array.isArray(data.eligible_countries)
          ? cleanList(data.eligible_countries)
          : []
      );

      setLanguages(
        Array.isArray(data.languages)
          ? cleanList(data.languages)
          : []
      );

      setProfilePhotoUrl(data.profile_photo_url || "");
    };

    void loadProfile();
  }, []);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingImage(true);
    setMessage("Uploading image...");
    setMessageType("info");

    if (!athleteProfileId) {
      setMessageType("error");
      setMessage("No active athlete profile is available.");
      setUploadingImage(false);
      return;
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${athleteProfileId}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, file);

    if (uploadError) {
      setMessageType("error");
      setMessage(`Upload failed: ${uploadError.message}`);
      setUploadingImage(false);
      return;
    }

    const { data } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        profile_photo_url: publicUrl,
      })
      .eq("id", athleteProfileId);

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
    setMessage("Profile photo uploaded and saved.");
    setUploadingImage(false);
  };

  const addEligibleCountry = () => {
    const value = newEligibleCountry.trim();

    if (!value) return;

    setEligibleCountries((current) =>
      cleanList([...current, value])
    );

    setNewEligibleCountry("");
  };

  const removeEligibleCountry = (countryToRemove: string) => {
    setEligibleCountries((current) =>
      current.filter((item) => item !== countryToRemove)
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

  const removeLanguage = (languageToRemove: string) => {
    setLanguages((current) =>
      current.filter((item) => item !== languageToRemove)
    );
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage("Saving profile...");
    setMessageType("info");

    if (!athleteProfileId) {
      setMessageType("error");
      setMessage("No active athlete profile is available.");
      setLoading(false);
      return;
    }

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
        date_of_birth: dateOfBirth || null,
        eligible_countries: cleanList(eligibleCountries),
        languages: cleanList(languages),
        profile_photo_url: profilePhotoUrl,
      })
      .eq("id", athleteProfileId);

    if (error) {
      setMessageType("error");
      setMessage(`Error saving profile: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage("Profile updated successfully.");
    setLoading(false);
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-6 py-16 md:px-10">
        <div className="mb-10">
          <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[#D8F200]">
            Public Profile
          </p>

          <h1 className="text-4xl font-extrabold md:text-5xl">
            Edit your {BRAND.name} profile
          </h1>

          <p className="mt-3 text-white/75">
            Manage your public athlete identity and profile information.
          </p>
        </div>

        <div className="space-y-6 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
          <div>
            <label className="mb-3 block text-sm font-medium">
              Profile Photo
            </label>

            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt="Profile"
                className="mb-4 h-32 w-32 rounded-2xl object-cover"
              />
            ) : (
              <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-2xl bg-[#081642] text-sm text-white/60">
                No Photo
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-white"
            />

            {uploadingImage && (
              <p className="mt-2 text-sm text-white/70">
                Uploading image...
              </p>
            )}
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
                placeholder="Enter your full name"
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
                placeholder="e.g. Josh"
                className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#081642] p-5">
            <label className="block text-sm font-medium">
              Date of Birth
            </label>

            <p className="mt-1 text-xs leading-5 text-white/55">
              Used to calculate athlete age and development data. Your full
              date of birth is private and will not be displayed publicly.
            </p>

            <input
              type="date"
              value={dateOfBirth}
              onChange={(event) =>
                setDateOfBirth(event.target.value)
              }
              className="mt-4 w-full rounded-xl bg-[#0B1F5C] px-4 py-3 outline-none md:max-w-sm"
            />

            {dateOfBirth && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-white/70">
                  Full DOB: Private
                </span>

                <span className="rounded-full bg-[#D8F200]/10 px-3 py-1.5 font-semibold text-[#D8F200]">
                  Public birth year: {dateOfBirth.slice(0, 4)}
                </span>
              </div>
            )}
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
              placeholder="e.g. Basketball Guard | Newcastle Falcons"
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
              placeholder="Tell people about yourself..."
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
              placeholder="e.g. josh-phillips"
              className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
            />

            <p className="mt-2 text-sm text-white/60">
              Your public profile will appear at:
            </p>

            <p className="mt-1 text-sm text-[#D8F200]">
              /p/{publicSlug || "your-name"}
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
                placeholder="e.g. Basketball"
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
                placeholder="e.g. Point Guard"
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
                placeholder="e.g. NSW"
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
                placeholder="e.g. Australia"
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
              placeholder="e.g. Newcastle High School"
              className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
            />
          </div>

          <div className="rounded-2xl bg-[#081642] p-5">
            <label className="block text-sm font-medium">
              Nationality / Eligibility
            </label>

            <p className="mt-1 text-xs text-white/55">
              Optional. Add countries you are nationally eligible to
              represent.
            </p>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newEligibleCountry}
                onChange={(event) =>
                  setNewEligibleCountry(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
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
                {eligibleCountries.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      removeEligibleCountry(item)
                    }
                    className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
                  >
                    {item} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-[#081642] p-5">
            <label className="block text-sm font-medium">
              Languages Spoken
            </label>

            <p className="mt-1 text-xs text-white/55">
              Optional. Add languages you can communicate in.
            </p>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newLanguage}
                onChange={(event) =>
                  setNewLanguage(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
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
                {languages.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      removeLanguage(item)
                    }
                    className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
                  >
                    {item} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) =>
                setIsPublic(event.target.checked)
              }
            />

            Make my {BRAND.name} profile public
          </label>

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={loading}
            className="w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>

          {message && (
            <div
              className={`rounded-xl p-4 text-sm font-medium ${
                messageType === "success"
                  ? "bg-green-500/20 text-green-200"
                  : messageType === "error"
                    ? "bg-red-500/20 text-red-200"
                    : "bg-white/10 text-white"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}