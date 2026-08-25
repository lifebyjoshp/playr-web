"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";
import { BRAND } from "../../lib/branding";

type AccountType = "athlete" | "family";

type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  signup_source: string;
};

const EMPTY_ATTRIBUTION: Attribution = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  signup_source: "direct",
};

export default function SignupPage() {
  const router = useRouter();

  const [accountType, setAccountType] =
    useState<AccountType>("athlete");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [attribution, setAttribution] =
    useState<Attribution>(EMPTY_ATTRIBUTION);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const utmSource =
      params.get("utm_source");

    const utmMedium =
      params.get("utm_medium");

    const utmCampaign =
      params.get("utm_campaign");

    const utmContent =
      params.get("utm_content");

    let signupSource = "direct";

    if (utmSource) {
      signupSource = utmSource;
    } else if (
      document.referrer &&
      document.referrer.includes(
        window.location.host
      )
    ) {
      signupSource = "landing_page";
    } else if (document.referrer) {
      signupSource = "referral";
    }

    const captured: Attribution = {
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      signup_source: signupSource,
    };

    setAttribution(captured);

    try {
      sessionStorage.setItem(
        "radr_signup_attribution",
        JSON.stringify(captured)
      );
    } catch {
      // Signup still works if browser storage is unavailable.
    }
  }, []);

  async function handleSignup(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanName = fullName.trim();
    const cleanEmail = email
      .trim()
      .toLowerCase();

    if (!cleanName) {
      setMessageType("error");
      setMessage(
        "Please enter your full name."
      );
      return;
    }

    if (!cleanEmail) {
      setMessageType("error");
      setMessage(
        "Please enter your email."
      );
      return;
    }

    if (password.length < 6) {
      setMessageType("error");
      setMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);
    setMessageType("info");
    setMessage(
      accountType === "athlete"
        ? "Creating your RADR..."
        : "Creating your Family account..."
    );

    /*
      Attribution is included in Auth metadata as well
      as the profile record.

      This means the original acquisition source remains
      attached to the signup even if profile creation logic
      changes later.
    */
    const { data, error } =
      await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            account_type: accountType,

            utm_source:
              attribution.utm_source,

            utm_medium:
              attribution.utm_medium,

            utm_campaign:
              attribution.utm_campaign,

            utm_content:
              attribution.utm_content,

            signup_source:
              attribution.signup_source,
          },
        },
      });

    if (error) {
      setMessageType("error");
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setMessageType("error");
      setMessage(
        "Unable to create your account."
      );
      setLoading(false);
      return;
    }

    /*
      Upsert the RADR profile.

      IMPORTANT:
      We do NOT manually set:
        is_founding_athlete
        founding_athlete_number

      Supabase assigns those automatically via
      our database trigger.
    */
    const { data: profileData, error: profileError } =
      await supabase
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            auth_user_id: data.user.id,

            full_name: cleanName,
            email: cleanEmail,

            account_type: accountType,

            utm_source:
              attribution.utm_source,

            utm_medium:
              attribution.utm_medium,

            utm_campaign:
              attribution.utm_campaign,

            utm_content:
              attribution.utm_content,

            signup_source:
              attribution.signup_source,
          },
          {
            onConflict: "id",
          }
        )
        .select(
          `
          id,
          account_type,
          is_founding_athlete,
          founding_athlete_number
        `
        )
        .single();

    if (profileError) {
      setMessageType("error");
      setMessage(
        `Account created, but RADR setup could not be completed: ${profileError.message}`
      );
      setLoading(false);
      return;
    }

    try {
      sessionStorage.removeItem(
        "radr_signup_attribution"
      );
    } catch {
      // No action required.
    }

    if (
      accountType === "athlete" &&
      profileData?.is_founding_athlete
    ) {
      setMessageType("success");

      setMessage(
        profileData.founding_athlete_number
          ? `Welcome to RADR — you're Founding Athlete #${String(
              profileData.founding_athlete_number
            ).padStart(3, "0")}.`
          : "Welcome to RADR — you're a Founding Athlete."
      );
    } else {
      setMessageType("success");

      setMessage(
        accountType === "athlete"
          ? "Your RADR is ready. Let's build your athlete profile."
          : "Your Family account is ready. Let's create your first athlete."
      );
    }

    window.setTimeout(() => {
      if (accountType === "athlete") {
        router.push("/onboarding");
      } else {
        router.push(
          "/dashboard/family/new-athlete"
        );
      }

      router.refresh();
    }, 900);
  }

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-4 py-12 md:px-6 md:py-16">
        <div className="grid w-full gap-12 lg:grid-cols-2">
          {/* LEFT */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit rounded-full border border-[#D8F200]/30 bg-[#D8F200]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#D8F200]">
              Join {BRAND.name} Beta
            </div>

            <h1 className="mt-6 max-w-2xl text-5xl font-extrabold leading-tight md:text-6xl">
              Build your sporting journey.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-white/70">
              Create your athlete profile,
              track Athlete Development,
              showcase your highlights and
              make your progress visible.
            </p>

            <div className="mt-8 space-y-3 text-sm text-white/60">
              <p>
                ✓ Build one shareable athlete
                profile
              </p>

              <p>
                ✓ Track AD — Athlete Development
              </p>

              <p>
                ✓ Add teams, achievements and
                highlights
              </p>

              <p>
                ✓ Built for athletes and
                families
              </p>
            </div>

            <div className="mt-8 max-w-lg rounded-2xl border border-[#D8F200]/20 bg-[#D8F200]/10 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
                RADR Founding Athletes
              </p>

              <p className="mt-2 text-sm leading-6 text-white/70">
                The first 100 eligible athlete
                accounts will be recognised as
                RADR Founding Athletes.
              </p>
            </div>
          </div>

          {/* SIGNUP CARD */}
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
              Get Started
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Who is this account for?
            </h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setAccountType("athlete")
                }
                className={`rounded-2xl border p-5 text-left transition ${
                  accountType === "athlete"
                    ? "border-[#D8F200] bg-[#D8F200]/10"
                    : "border-white/10 bg-[#081642] hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">
                      Myself
                    </p>

                    <p className="mt-2 text-sm leading-6 text-white/60">
                      I&apos;m creating and
                      managing my own athlete
                      profile.
                    </p>
                  </div>

                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                      accountType === "athlete"
                        ? "border-[#D8F200] bg-[#D8F200] text-[#0B1F5C]"
                        : "border-white/20 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setAccountType("family")
                }
                className={`rounded-2xl border p-5 text-left transition ${
                  accountType === "family"
                    ? "border-[#D8F200] bg-[#D8F200]/10"
                    : "border-white/10 bg-[#081642] hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">
                      An Athlete I Manage
                    </p>

                    <p className="mt-2 text-sm leading-6 text-white/60">
                      I&apos;m a parent or family
                      member managing an athlete.
                    </p>
                  </div>

                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                      accountType === "family"
                        ? "border-[#D8F200] bg-[#D8F200] text-[#0B1F5C]"
                        : "border-white/20 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </div>
              </button>
            </div>

            {accountType === "family" && (
              <div className="mt-4 rounded-xl bg-[#081642] p-4">
                <p className="text-sm text-white/65">
                  You&apos;ll create your Family
                  account first, then add the
                  athlete or athletes you manage.
                </p>
              </div>
            )}

            <form
              onSubmit={handleSignup}
              className="mt-7 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {accountType === "family"
                    ? "Your Full Name"
                    : "Full Name"}
                </label>

                <input
                  className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none placeholder:text-white/35 focus:border-[#D8F200]/50"
                  placeholder={
                    accountType === "family"
                      ? "Enter your full name"
                      : "Enter your full name"
                  }
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none placeholder:text-white/35 focus:border-[#D8F200]/50"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Password
                </label>

                <input
                  type="password"
                  className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 outline-none placeholder:text-white/35 focus:border-[#D8F200]/50"
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  minLength={6}
                  required
                />

                <p className="mt-2 text-xs text-white/40">
                  Minimum 6 characters.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#D8F200] px-6 py-4 font-bold text-[#0B1F5C] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating your RADR..."
                  : accountType === "athlete"
                    ? "Build My RADR"
                    : "Create Family Account"}
              </button>
            </form>

            {message && (
              <div
                className={`mt-5 rounded-xl p-4 text-sm font-medium ${
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

            <p className="mt-6 text-center text-sm text-white/50">
              Already on RADR?{" "}
              <a
                href="/login"
                className="font-semibold text-[#D8F200]"
              >
                Log in
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}