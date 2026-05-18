"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

type PublicProfileForm = {
  full_name: string;
  public_slug: string;
  headline: string;
  bio: string;
  primary_sport: string;
  position: string;
  country: string;
  state: string;
  gender: string;
  age_group: string;
  height_cm: string;
  weight_kg: string;
  dominant_side: string;
  profile_photo_url: string;
  contact_email: string;
  is_public: boolean;
};

export default function PublicProfilePage() {
  const [form, setForm] = useState<PublicProfileForm>({
    full_name: "",
    public_slug: "",
    headline: "",
    bio: "",
    primary_sport: "",
    position: "",
    country: "",
    state: "",
    gender: "",
    age_group: "",
    height_cm: "",
    weight_kg: "",
    dominant_side: "",
    profile_photo_url: "",
    contact_email: "",
    is_public: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);

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

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "full_name, public_slug, headline, bio, primary_sport, position, country, state, gender, age_group, height_cm, weight_kg, dominant_side, profile_photo_url, contact_email, is_public"
        )
        .eq("id", user.id)
        .single();

      if (error) {
        setMessageType("error");
        setMessage("Could not load profile.");
        setLoading(false);
        return;
      }

      setForm({
        full_name: data.full_name || "",
        public_slug: data.public_slug || "",
        headline: data.headline || "",
        bio: data.bio || "",
        primary_sport: data.primary_sport || "",
        position: data.position || "",
        country: data.country || "",
        state: data.state || "",
        gender: data.gender || "",
        age_group: data.age_group || "",
        height_cm: data.height_cm ? String(data.height_cm) : "",
        weight_kg: data.weight_kg ? String(data.weight_kg) : "",
        dominant_side: data.dominant_side || "",
        profile_photo_url: data.profile_photo_url || "",
        contact_email: data.contact_email || "",
        is_public: data.is_public ?? true,
      });

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleChange = (
    field: keyof PublicProfileForm,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]:
        field === "public_slug" && typeof value === "string"
          ? value
              .toLowerCase()
              .trim()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "")
          : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("Saving...");
    setMessageType("info");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessageType("error");
      setMessage("Not logged in.");
      setSaving(false);
      return;
    }

    if (!form.public_slug) {
      setMessageType("error");
      setMessage("Public slug is required.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        public_slug: form.public_slug,
        headline: form.headline || null,
        bio: form.bio || null,
        primary_sport: form.primary_sport || null,
        position: form.position || null,
        country: form.country || null,
        state: form.state || null,
        gender: form.gender || null,
        age_group: form.age_group || null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        dominant_side: form.dominant_side || null,
        profile_photo_url: form.profile_photo_url || null,
        contact_email: form.contact_email || null,
        is_public: form.is_public,
      })
      .eq("id", user.id);

    if (error) {
      setMessageType("error");
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessageType("success");
    setMessage("Profile updated successfully.");
    setSaving(false);
  };

  const publicUrl = form.public_slug ? `/p/${form.public_slug}` : "";

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold">Edit Public Profile</h1>
          <p className="mt-3 text-white/70">
            Control what recruiters and coaches see.
          </p>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6 rounded-3xl bg-white/10 p-8">
              <div>
                <label>Name</label>
                <input
                  value={form.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                />
              </div>

              <div>
                <label>Public Slug</label>
                <input
                  value={form.public_slug}
                  onChange={(e) => handleChange("public_slug", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                />
                <p className="mt-2 text-sm text-white/60">
                  URL: {publicUrl || "/p/your-slug"}
                </p>
              </div>

              <div>
                <label>Headline</label>
                <input
                  value={form.headline}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                />
              </div>

              <div>
                <label>Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label>Primary Sport</label>
                  <select
                    value={form.primary_sport}
                    onChange={(e) =>
                      handleChange("primary_sport", e.target.value)
                    }
                    className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                  >
                    <option value="">Select sport</option>
                    <option>Basketball</option>
                    <option>Football</option>
                  </select>
                </div>

                <div>
                  <label>Primary Position</label>
                  <input
                    value={form.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                    placeholder="e.g. Point Guard"
                    className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label>Profile Photo URL</label>
                <input
                  value={form.profile_photo_url}
                  onChange={(e) =>
                    handleChange("profile_photo_url", e.target.value)
                  }
                  placeholder="https://..."
                  className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label>Country</label>
                  <input
                    value={form.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    placeholder="e.g. Australia"
                    className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                  />
                </div>

                <div>
                  <label>State / Region</label>
                  <input
                    value={form.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    placeholder="e.g. NSW"
                    className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label>Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                  >
                    <option value="">Select gender</option>
                    <option>Boys</option>
                    <option>Girls</option>
                    <option>Men</option>
                    <option>Women</option>
                    <option>Mixed</option>
                  </select>
                </div>

                <div>
                  <label>Age Group</label>
                  <input
                    value={form.age_group}
                    onChange={(e) => handleChange("age_group", e.target.value)}
                    placeholder="e.g. U14"
                    className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label>Height (cm)</label>
                  <input
                    value={form.height_cm}
                    onChange={(e) => handleChange("height_cm", e.target.value)}
                    placeholder="e.g. 184"
                    className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                  />
                </div>

                <div>
                  <label>Weight (kg)</label>
                  <input
                    value={form.weight_kg}
                    onChange={(e) => handleChange("weight_kg", e.target.value)}
                    placeholder="e.g. 78"
                    className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                  />
                </div>

                <div>
                  <label>Dominant Side</label>
                  <input
                    value={form.dominant_side}
                    onChange={(e) =>
                      handleChange("dominant_side", e.target.value)
                    }
                    placeholder="e.g. Right"
                    className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label>Contact Email</label>
                <input
                  value={form.contact_email}
                  onChange={(e) =>
                    handleChange("contact_email", e.target.value)
                  }
                  placeholder="Public contact email"
                  className="mt-2 w-full rounded-xl bg-[#081642] px-4 py-3"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(e) => handleChange("is_public", e.target.checked)}
                />
                Make profile public
              </label>

              <button
                onClick={handleSave}
                className="w-full rounded-xl bg-[#D8F200] py-3 font-bold text-[#0B1F5C]"
              >
                {saving ? "Saving..." : "Save"}
              </button>

              {message && (
                <div
                  className={`rounded-xl p-3 text-sm ${
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

            <div className="rounded-3xl bg-white/10 p-8">
              <h2 className="mb-4 text-2xl font-bold">Preview</h2>

              <div className="rounded-2xl bg-[#081642] p-6">
                {form.profile_photo_url ? (
                  <img
                    src={form.profile_photo_url}
                    alt={form.full_name || "Profile"}
                    className="mb-4 h-28 w-28 rounded-2xl object-cover"
                  />
                ) : null}

                <h3 className="text-2xl font-bold">
                  {form.full_name || "Your Name"}
                </h3>

                <p className="mt-2 text-white/70">
                  {form.headline || "Your headline"}
                </p>

                <p className="mt-4 text-white/70">
                  {form.bio || "Your bio"}
                </p>

                <div className="mt-4 space-y-2 text-white/70">
                  <p>{form.primary_sport || "Sport not set"}</p>
                  <p>{form.position || "Position not set"}</p>
                  <p>
                    {[form.state, form.country].filter(Boolean).join(", ") ||
                      "Location not set"}
                  </p>
                  <p>{form.gender || "Gender not set"}</p>
                  <p>{form.age_group || "Age group not set"}</p>
                  <p>
                    {form.height_cm ? `${form.height_cm} cm` : "Height not set"}
                  </p>
                  <p>
                    {form.weight_kg ? `${form.weight_kg} kg` : "Weight not set"}
                  </p>
                  <p>{form.dominant_side || "Dominant side not set"}</p>
                  <p>{form.contact_email || "Contact email not set"}</p>
                </div>

                <p className="mt-4 text-sm text-white/60">
                  {form.is_public ? "Public" : "Private"}
                </p>

                {form.public_slug && (
                  <Link
                    href={publicUrl}
                    className="mt-4 inline-block text-[#D8F200]"
                  >
                    View Profile →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}