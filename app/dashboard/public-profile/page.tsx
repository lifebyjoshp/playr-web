"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import AppShell from "../../../components/AppShell";

export default function PublicProfilePage() {
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [primarySport, setPrimarySport] = useState("");
  const [position, setPosition] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("");

  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!data) return;

      setFullName(data.full_name || "");
      setHeadline(data.headline || "");
      setBio(data.bio || "");
      setPublicSlug(data.public_slug || "");
      setIsPublic(data.is_public ?? true);

      setPrimarySport(data.primary_sport || "");
      setPosition(data.position || "");
      setStateRegion(data.state || "");
      setCountry(data.country || "");

      setProfilePhotoUrl(data.profile_photo_url || "");
    };

    loadProfile();
  }, []);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploadingImage(true);
    setMessage("Uploading image...");
    setMessageType("info");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessageType("error");
      setMessage("You must be logged in.");
      setUploadingImage(false);
      return;
    }

    const fileExt = file.name.split(".").pop();

    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

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
  .eq("id", user.id);

if (profileUpdateError) {
  setMessageType("error");
  setMessage(`Image uploaded but profile update failed: ${profileUpdateError.message}`);
  setUploadingImage(false);
  return;
}

setProfilePhotoUrl(publicUrl);

setMessageType("success");
setMessage("Profile photo uploaded and saved.");

setUploadingImage(false);

  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage("Saving profile...");
    setMessageType("info");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessageType("error");
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      headline,
      bio,
      public_slug: publicSlug,
      is_public: isPublic,
      primary_sport: primarySport,
      position,
      state: stateRegion,
      country,
      profile_photo_url: profilePhotoUrl,
    });

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
            Edit your PLAYR profile
          </h1>

          <p className="mt-3 text-white/75">
            Manage your public athlete identity and profile information.
          </p>
        </div>

        <div className="space-y-6 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
          
          {/* PROFILE IMAGE */}
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

          {/* FULL NAME */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Full Name
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
            />
          </div>

          {/* HEADLINE */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Headline
            </label>

            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Basketball Guard | Newcastle Falcons"
              className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
            />
          </div>

          {/* BIO */}
          <div>
            <label className="mb-2 block text-sm font-medium">Bio</label>

            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              rows={5}
              className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
            />
          </div>

          {/* PUBLIC SLUG */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Public Profile URL
            </label>

            <input
              type="text"
              value={publicSlug}
              onChange={(e) => setPublicSlug(e.target.value)}
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

          {/* SPORT + POSITION */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Primary Sport
              </label>

              <input
                type="text"
                value={primarySport}
                onChange={(e) => setPrimarySport(e.target.value)}
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
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Point Guard"
                className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
              />
            </div>
          </div>

          {/* LOCATION */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                State / Region
              </label>

              <input
                type="text"
                value={stateRegion}
                onChange={(e) => setStateRegion(e.target.value)}
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
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Australia"
                className="w-full rounded-xl bg-[#081642] px-4 py-3 outline-none"
              />
            </div>
          </div>

          {/* PUBLIC TOGGLE */}
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />

            Make my PLAYR profile public
          </label>

          {/* SAVE BUTTON */}
          <button
            onClick={handleSaveProfile}
            disabled={loading}
            className="w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>

          {/* MESSAGE */}
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