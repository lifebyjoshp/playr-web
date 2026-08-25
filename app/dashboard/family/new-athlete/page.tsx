"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppShell from "../../../../components/AppShell";
import { supabase } from "../../../../lib/supabase";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewManagedAthletePage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [primarySport, setPrimarySport] = useState("");
  const [gender, setGender] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  const handleCreateAthlete = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!fullName.trim()) {
      setMessageType("error");
      setMessage("Athlete full name is required.");
      return;
    }

    if (!dateOfBirth) {
      setMessageType("error");
      setMessage("Date of birth is required.");
      return;
    }

    if (!primarySport.trim()) {
      setMessageType("error");
      setMessage("Primary sport is required.");
      return;
    }

    setLoading(true);
    setMessageType("info");
    setMessage("Creating athlete...");

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

    const athleteId = crypto.randomUUID();

    const slugBase = createSlug(
      preferredName.trim() || fullName.trim()
    );

    const publicSlug = `${slugBase}-${athleteId.slice(0, 6)}`;

    const { error: athleteError } = await supabase
      .from("profiles")
      .insert({
        id: athleteId,

        auth_user_id: null,

        created_by_user_id: user.id,

        full_name: fullName.trim(),
        preferred_name: preferredName.trim() || null,

        date_of_birth: dateOfBirth,

        primary_sport: primarySport.trim(),

        gender: gender || null,

        public_slug: publicSlug,

        account_type: "athlete",

        guardian_required: true,

        is_public: false,

        recruiter_visible: false,

        contact_visible: false,

        eligible_countries: [],

        nationalities: [],

        languages: [],
      });

    if (athleteError) {
      setMessageType("error");
      setMessage(
        `Unable to create athlete: ${athleteError.message}`
      );
      setLoading(false);
      return;
    }

    const { error: guardianError } = await supabase
      .from("guardian_links")
      .insert({
        athlete_profile_id: athleteId,

        guardian_profile_id: user.id,

        relationship: "parent_guardian",

        status: "active",

        requested_by: user.id,

        can_edit_profile: true,

        can_manage_privacy: true,

        can_manage_teams: true,

        can_manage_metrics: true,

        accepted_at: new Date().toISOString(),
      });

    if (guardianError) {
      setMessageType("error");
      setMessage(
        `Athlete was created, but family access could not be added: ${guardianError.message}`
      );
      setLoading(false);
      return;
    }

    setMessageType("success");
    setMessage("Athlete created successfully.");

    router.push(
      `/dashboard/family/${athleteId}/profile`
    );
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
            Family
          </p>

          <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
            Create Athlete
          </h1>

          <p className="mt-3 max-w-2xl text-white/70">
            Create an athlete you manage. You can add more athlete
            information after they are created.
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

        <form
          onSubmit={handleCreateAthlete}
          className="space-y-6 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Athlete Full Name
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              placeholder="Enter athlete full name"
              className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 text-white placeholder:text-white/40 outline-none"
              required
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
              placeholder="Optional"
              className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 text-white placeholder:text-white/40 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Date of Birth
            </label>

            <input
              type="date"
              value={dateOfBirth}
              onChange={(event) =>
                setDateOfBirth(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 text-white outline-none"
              required
            />
          </div>

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
              className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 text-white placeholder:text-white/40 outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Gender
            </label>

            <select
              value={gender}
              onChange={(event) =>
                setGender(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 text-white outline-none"
            >
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">
                Prefer not to say
              </option>
            </select>
          </div>

          <div className="rounded-2xl bg-[#081642] p-5">
            <p className="text-sm font-semibold">
              Family-managed athlete
            </p>

            <p className="mt-2 text-sm text-white/60">
              This athlete will not have a separate RADR login yet.
              You will be connected automatically with full family
              management permissions.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
          >
            {loading
              ? "Creating Athlete..."
              : "Create Athlete"}
          </button>
        </form>
      </section>
    </AppShell>
  );
}