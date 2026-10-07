"use client";

import { useEffect, useState } from "react";
import AppShell from "../../../components/AppShell";
import {
  ActiveAthleteContext,
  getActiveAthleteContext,
} from "../../../lib/activeAthlete";

export default function AthleteContextTestPage() {
  const [context, setContext] =
    useState<ActiveAthleteContext | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadContext = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getActiveAthleteContext();

        setContext(result);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to resolve athlete context."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadContext();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <section className="mx-auto max-w-4xl px-4 py-8 md:px-6">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8">
            Loading RADR athlete context...
          </div>
        </section>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <section className="mx-auto max-w-4xl px-4 py-8 md:px-6">
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-200">
              Context Error
            </p>

            <p className="mt-3 text-white">
              {error}
            </p>
          </div>
        </section>
      </AppShell>
    );
  }

  if (!context) {
    return (
      <AppShell>
        <section className="mx-auto max-w-4xl px-4 py-8 md:px-6">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8">
            No authenticated RADR account found.
          </div>
        </section>
      </AppShell>
    );
  }

  const {
    authUserId,
    activeAthlete,
    availableAthletes,
    managedAthletes,
    isSelfManaged,
    isGuardianManaged,
    requiresAthleteSelection,
    activeGuardianPermissions,
  } = context;

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
            RADR Diagnostic
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            Athlete Context Test
          </h1>

          <p className="mt-3 max-w-2xl text-white/70">
            Temporary diagnostic page for testing how RADR
            resolves the authenticated account and active athlete.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <DiagnosticCard
            label="Authenticated Account ID"
            value={authUserId}
          />

          <DiagnosticCard
            label="Active Athlete"
            value={
              activeAthlete?.full_name ||
              "No active athlete"
            }
          />

          <DiagnosticCard
            label="Active Athlete ID"
            value={
              activeAthlete?.id ||
              "No active athlete"
            }
          />

          <DiagnosticCard
            label="Management Mode"
            value={
              isSelfManaged
                ? "Self-managed athlete"
                : isGuardianManaged
                ? "Parent / Guardian managed"
                : "No athlete relationship"
            }
          />

          <DiagnosticCard
            label="Available Athletes"
            value={String(
              availableAthletes.length
            )}
          />

          <DiagnosticCard
            label="Athlete Selection Required"
            value={
              requiresAthleteSelection
                ? "Yes"
                : "No"
            }
          />
        </div>

        {activeGuardianPermissions && (
          <div className="mt-6 rounded-3xl border border-[#D8F200]/20 bg-[#D8F200]/10 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
              Guardian Permissions
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <PermissionRow
                label="Relationship"
                value={
                  activeGuardianPermissions.relationship
                }
              />

              <PermissionRow
                label="Edit Profile"
                value={
                  activeGuardianPermissions.canEditProfile
                    ? "Yes"
                    : "No"
                }
              />

              <PermissionRow
                label="Manage Privacy"
                value={
                  activeGuardianPermissions.canManagePrivacy
                    ? "Yes"
                    : "No"
                }
              />

              <PermissionRow
                label="Manage Teams"
                value={
                  activeGuardianPermissions.canManageTeams
                    ? "Yes"
                    : "No"
                }
              />

              <PermissionRow
                label="Manage Metrics"
                value={
                  activeGuardianPermissions.canManageMetrics
                    ? "Yes"
                    : "No"
                }
              />
            </div>
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
            Available Athlete Profiles
          </p>

          {availableAthletes.length === 0 ? (
            <p className="mt-4 text-white/60">
              No athlete profiles available.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {availableAthletes.map(
                (athlete) => (
                  <div
                    key={athlete.id}
                    className="rounded-2xl bg-[#081642] p-4"
                  >
                    <p className="font-bold">
                      {athlete.full_name ||
                        "Unnamed Athlete"}
                    </p>

                    <p className="mt-1 text-xs text-white/50">
                      {athlete.id}
                    </p>

                    <p className="mt-2 text-sm text-white/65">
                      {[
                        athlete.primary_sport,
                        athlete.position,
                      ]
                        .filter(Boolean)
                        .join(" • ") ||
                        "No sport details"}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {managedAthletes.length > 1 && (
          <div className="mt-6 rounded-3xl border border-yellow-300/20 bg-yellow-400/10 p-6">
            <p className="font-bold text-yellow-100">
              Multiple athletes detected
            </p>

            <p className="mt-2 text-sm text-yellow-100/75">
              RADR correctly requires an athlete
              selection rather than automatically
              choosing one.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function DiagnosticCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
        {label}
      </p>

      <p className="mt-3 break-all font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function PermissionRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#081642] p-4">
      <p className="text-xs uppercase text-white/45">
        {label}
      </p>

      <p className="mt-2 font-bold text-white">
        {value}
      </p>
    </div>
  );
}