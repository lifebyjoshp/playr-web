"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  preferred_name: string | null;
  email: string | null;
  public_slug: string | null;
  profile_photo_url: string | null;
};

export default function SettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login?message=login-required");
        return;
      }

      const email = user.email || "";

      setCurrentEmail(email);
      setNewEmail(email);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          preferred_name,
          email,
          public_slug,
          profile_photo_url
        `
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setMessageType("error");
        setMessage("Unable to load your RADR account.");
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data as Profile);
      }

      setLoading(false);
    };

    void loadSettings();
  }, [router]);

  const handleEmailUpdate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const email = newEmail.trim().toLowerCase();

    if (!email) {
      setMessageType("error");
      setMessage("Enter your new email address.");
      return;
    }

    if (email === currentEmail.toLowerCase()) {
      setMessageType("info");
      setMessage("That is already your current login email.");
      return;
    }

    setSavingEmail(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      email,
    });

    if (error) {
      setMessageType("error");
      setMessage(`Unable to update email: ${error.message}`);
      setSavingEmail(false);
      return;
    }

    setMessageType("success");
    setMessage(
      "Email update requested. Check your email if confirmation is required."
    );

    setSavingEmail(false);
  };

  const handlePasswordUpdate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      setMessageType("error");
      setMessage("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessageType("error");
      setMessage("Your passwords do not match.");
      return;
    }

    setSavingPassword(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessageType("error");
      setMessage(`Unable to update password: ${error.message}`);
      setSavingPassword(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");

    setMessageType("success");
    setMessage("Your RADR password has been updated.");

    setSavingPassword(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <AppShell>
        <section className="mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-7 md:px-6 md:py-12">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-white/70">
            Loading account settings...
          </div>
        </section>
      </AppShell>
    );
  }

  const athleteName =
    profile?.preferred_name ||
    profile?.full_name ||
    "RADR Athlete";

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-7 md:px-6 md:py-12">
        <div className="mb-6 md:mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D8F200] sm:text-sm">
            Account
          </p>

          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl md:text-5xl">
            Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
            Manage your RADR login, password and account.
          </p>
        </div>

        {message && (
          <div
            className={`mb-5 rounded-2xl border p-4 text-sm font-medium ${
              messageType === "success"
                ? "border-green-400/20 bg-green-500/10 text-green-100"
                : messageType === "error"
                  ? "border-red-400/20 bg-red-500/10 text-red-100"
                  : "border-white/10 bg-white/10 text-white/75"
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {/* ACCOUNT IDENTITY */}
          <section className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
              RADR Account
            </p>

            <div className="mt-5 flex items-center gap-4">
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={athleteName}
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover sm:h-20 sm:w-20"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#081642] text-2xl font-extrabold sm:h-20 sm:w-20">
                  {athleteName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold sm:text-2xl">
                  {athleteName}
                </h2>

                <p className="mt-1 truncate text-sm text-white/55">
                  {currentEmail || "No login email available"}
                </p>

                {profile?.public_slug && (
                  <p className="mt-1 truncate text-xs text-white/40">
                    radr.au/p/{profile.public_slug}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/dashboard/public-profile"
                className="rounded-xl bg-[#D8F200] px-4 py-2.5 text-sm font-bold text-[#0B1F5C] transition hover:brightness-95"
              >
                Edit Athlete Profile
              </Link>

              {profile?.public_slug && (
                <Link
                  href={`/p/${profile.public_slug}`}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View Public Profile
                </Link>
              )}
            </div>
          </section>

          {/* EMAIL */}
          <section className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
              Login Email
            </p>

            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              Change email address
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/60">
              This is the email you use to sign in to RADR.
            </p>

            <form
              onSubmit={handleEmailUpdate}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  Email address
                </label>

                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) =>
                    setNewEmail(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 text-white outline-none transition focus:border-[#D8F200]/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingEmail}
                className="w-full rounded-xl bg-[#D8F200] px-5 py-3 text-sm font-bold text-[#0B1F5C] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {savingEmail
                  ? "Updating..."
                  : "Update Email"}
              </button>
            </form>
          </section>

          {/* PASSWORD */}
          <section className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
              Security
            </p>

            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              Change password
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/60">
              Choose a new password with at least 8 characters.
            </p>

            <form
              onSubmit={handlePasswordUpdate}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  New password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 text-white outline-none transition focus:border-[#D8F200]/50"
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  Confirm new password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 text-white outline-none transition focus:border-[#D8F200]/50"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full rounded-xl bg-[#D8F200] px-5 py-3 text-sm font-bold text-[#0B1F5C] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {savingPassword
                  ? "Updating..."
                  : "Update Password"}
              </button>
            </form>
          </section>

          {/* LEGAL */}
          <section className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
              Legal & Privacy
            </p>

            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              Your RADR account
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/privacy"
                className="rounded-xl bg-[#081642] p-4 transition hover:bg-white/10"
              >
                <p className="font-bold">Privacy Policy</p>

                <p className="mt-1 text-xs leading-5 text-white/55">
                  How RADR handles information and data.
                </p>

                <p className="mt-3 text-xs font-semibold text-[#D8F200]">
                  View Policy →
                </p>
              </Link>

              <Link
                href="/terms"
                className="rounded-xl bg-[#081642] p-4 transition hover:bg-white/10"
              >
                <p className="font-bold">
                  Terms & Conditions
                </p>

                <p className="mt-1 text-xs leading-5 text-white/55">
                  Terms that apply when using RADR.
                </p>

                <p className="mt-3 text-xs font-semibold text-[#D8F200]">
                  View Terms →
                </p>
              </Link>
            </div>
          </section>

          {/* LOGOUT */}
          <section className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:rounded-3xl sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Session
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Log out of RADR
            </h2>

            <p className="mt-2 text-sm text-white/60">
              Sign out of your RADR account on this device.
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 w-full rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              Log Out
            </button>
          </section>

          {/* DELETE */}
          <section className="rounded-2xl border border-red-400/20 bg-red-500/5 p-4 sm:rounded-3xl sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
              Account Management
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Delete RADR Account
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
              Account deletion may affect athlete profiles, team
              memberships and family-managed athletes connected to
              this account.
            </p>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              Automated account deletion is not currently available.
              Contact RADR to request permanent account deletion.
            </p>

            <button
              type="button"
              disabled
              className="mt-5 cursor-not-allowed rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 opacity-60"
            >
              Request Account Deletion
            </button>
          </section>
        </div>
      </section>
    </AppShell>
  );
}