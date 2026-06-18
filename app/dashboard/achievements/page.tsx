"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import AppShell from "../../../components/AppShell";

type Achievement = {
  id: string;
  title: string;
  achievement_type: string | null;
  organisation: string | null;
  description: string | null;
  achievement_date: string | null;
};

export default function AchievementsPage() {
  const [title, setTitle] = useState("");
  const [achievementType, setAchievementType] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [description, setDescription] = useState("");
  const [achievementDate, setAchievementDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const [editingAchievementId, setEditingAchievementId] = useState<string | null>(
    null
  );

  const resetForm = () => {
    setTitle("");
    setAchievementType("");
    setOrganisation("");
    setDescription("");
    setAchievementDate("");
    setEditingAchievementId(null);
  };

  const loadAchievements = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .eq("profile_id", user.id)
      .order("achievement_date", { ascending: false });

    if (!error && data) {
      setAchievements(data);
    }
  };

  useEffect(() => {
    loadAchievements();
  }, []);

  const handleEdit = (achievement: Achievement) => {
    setEditingAchievementId(achievement.id);
    setTitle(achievement.title || "");
    setAchievementType(achievement.achievement_type || "");
    setOrganisation(achievement.organisation || "");
    setDescription(achievement.description || "");
    setAchievementDate(achievement.achievement_date || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (achievementId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this achievement?"
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("Deleting achievement...");
    setMessageType("info");

    const { error } = await supabase
      .from("achievements")
      .delete()
      .eq("id", achievementId);

    if (error) {
      setMessageType("error");
      setMessage(`Error deleting achievement: ${error.message}`);
      setLoading(false);
      return;
    }

    if (editingAchievementId === achievementId) {
      resetForm();
    }

    setMessageType("success");
    setMessage("Achievement deleted successfully.");
    await loadAchievements();
    setLoading(false);
  };

  const handleSaveAchievement = async () => {
    setLoading(true);
    setMessage(
      editingAchievementId ? "Updating achievement..." : "Saving achievement..."
    );
    setMessageType("info");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessageType("error");
      setMessage("You must be logged in to manage achievements.");
      setLoading(false);
      return;
    }

    if (!title.trim()) {
      setMessageType("error");
      setMessage("Title is required.");
      setLoading(false);
      return;
    }

    if (editingAchievementId) {
      const { error } = await supabase
        .from("achievements")
        .update({
          title,
          achievement_type: achievementType || null,
          organisation: organisation || null,
          description: description || null,
          achievement_date: achievementDate || null,
        })
        .eq("id", editingAchievementId);

      if (error) {
        setMessageType("error");
        setMessage(`Error updating achievement: ${error.message}`);
        setLoading(false);
        return;
      }

      setMessageType("success");
      setMessage("Achievement updated successfully.");
    } else {
      const { error } = await supabase.from("achievements").insert({
        profile_id: user.id,
        title,
        achievement_type: achievementType || null,
        organisation: organisation || null,
        description: description || null,
        achievement_date: achievementDate || null,
      });

      if (error) {
        setMessageType("error");
        setMessage(`Error saving achievement: ${error.message}`);
        setLoading(false);
        return;
      }

      setMessageType("success");
      setMessage("Achievement added successfully.");
    }

    resetForm();
    await loadAchievements();
    setLoading(false);
  };

  return (
    <AppShell>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
            Achievements
          </p>
          <h1 className="text-4xl font-extrabold md:text-5xl">
            Add achievements
          </h1>
          <p className="mt-3 max-w-3xl text-white/75">
            Showcase awards, selections, captaincy, milestones, and key moments
            that make your profile stand out.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">
                {editingAchievementId ? "Edit Achievement" : "Add Achievement"}
              </h2>

              {editingAchievementId && (
                <button
                  onClick={resetForm}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. MVP Award"
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Achievement Type
              </label>
              <select
                value={achievementType}
                onChange={(e) => setAchievementType(e.target.value)}
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              >
                <option value="">Select type</option>
                <option>Award</option>
                <option>Selection</option>
                <option>Captaincy</option>
                <option>Milestone</option>
                <option>Tournament Honour</option>
                <option>Team Achievement</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Organisation / Team
              </label>
              <input
                type="text"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                placeholder="e.g. Newcastle Falcons"
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Achievement Date
              </label>
              <input
                type="date"
                value={achievementDate}
                onChange={(e) => setAchievementDate(e.target.value)}
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more detail about this achievement..."
                rows={5}
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>

            <button
              onClick={handleSaveAchievement}
              disabled={loading}
              className="w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
            >
              {loading
                ? editingAchievementId
                  ? "Updating..."
                  : "Saving..."
                : editingAchievementId
                ? "Update Achievement"
                : "Add Achievement"}
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

          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
            <h2 className="mb-6 text-2xl font-bold">Your Achievements</h2>

            <div className="space-y-4">
              {achievements.length === 0 && (
                <div className="rounded-2xl bg-[#081642] p-5 text-white/70">
                  No achievements added yet.
                </div>
              )}

              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="rounded-2xl bg-[#081642] p-5"
                >
                  <h3 className="text-xl font-bold">{achievement.title}</h3>

                  <p className="mt-1 text-sm text-white/70">
                    {achievement.achievement_type || "Achievement"}
                  </p>

                  {achievement.organisation && (
                    <p className="mt-2 text-sm text-white/60">
                      {achievement.organisation}
                    </p>
                  )}

                  {achievement.achievement_date && (
                    <p className="mt-2 text-sm text-white/60">
                      {achievement.achievement_date}
                    </p>
                  )}

                  {achievement.description && (
                    <p className="mt-3 text-sm text-white/75">
                      {achievement.description}
                    </p>
                  )}

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleEdit(achievement)}
                      className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(achievement.id)}
                      className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}