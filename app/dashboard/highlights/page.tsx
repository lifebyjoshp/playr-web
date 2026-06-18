"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import AppShell from "../../../components/AppShell";

type Highlight = {
  id: string;
  title: string;
  video_url: string;
  platform: string | null;
  description: string | null;
  created_at: string;
};

function getEmbedUrl(url: string, platform: string | null) {
  if (!url) return null;

  if (platform === "YouTube") {
    const youtubeMatch =
      url.match(/v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    const videoId = youtubeMatch?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (platform === "Vimeo") {
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    const videoId = vimeoMatch?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  return null;
}

export default function HighlightsPage() {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [platform, setPlatform] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(
    null
  );

  const resetForm = () => {
    setTitle("");
    setVideoUrl("");
    setPlatform("");
    setDescription("");
    setEditingHighlightId(null);
  };

  const loadHighlights = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("highlights")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setHighlights(data);
    }
  };

  useEffect(() => {
    loadHighlights();
  }, []);

  const handleEdit = (highlight: Highlight) => {
    setEditingHighlightId(highlight.id);
    setTitle(highlight.title || "");
    setVideoUrl(highlight.video_url || "");
    setPlatform(highlight.platform || "");
    setDescription(highlight.description || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (highlightId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this highlight?"
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("Deleting highlight...");
    setMessageType("info");

    const { error } = await supabase
      .from("highlights")
      .delete()
      .eq("id", highlightId);

    if (error) {
      setMessageType("error");
      setMessage(`Error deleting highlight: ${error.message}`);
      setLoading(false);
      return;
    }

    if (editingHighlightId === highlightId) {
      resetForm();
    }

    setMessageType("success");
    setMessage("Highlight deleted successfully.");
    await loadHighlights();
    setLoading(false);
  };

  const handleSaveHighlight = async () => {
    setLoading(true);
    setMessage(
      editingHighlightId ? "Updating highlight..." : "Saving highlight..."
    );
    setMessageType("info");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessageType("error");
      setMessage("You must be logged in to manage highlights.");
      setLoading(false);
      return;
    }

    if (!title.trim()) {
      setMessageType("error");
      setMessage("Title is required.");
      setLoading(false);
      return;
    }

    if (!videoUrl.trim()) {
      setMessageType("error");
      setMessage("Video URL is required.");
      setLoading(false);
      return;
    }

    if (editingHighlightId) {
      const { error } = await supabase
        .from("highlights")
        .update({
          title,
          video_url: videoUrl,
          platform: platform || null,
          description: description || null,
        })
        .eq("id", editingHighlightId);

      if (error) {
        setMessageType("error");
        setMessage(`Error updating highlight: ${error.message}`);
        setLoading(false);
        return;
      }

      setMessageType("success");
      setMessage("Highlight updated successfully.");
    } else {
      const { error } = await supabase.from("highlights").insert({
        profile_id: user.id,
        title,
        video_url: videoUrl,
        platform: platform || null,
        description: description || null,
      });

      if (error) {
        setMessageType("error");
        setMessage(`Error saving highlight: ${error.message}`);
        setLoading(false);
        return;
      }

      setMessageType("success");
      setMessage("Highlight added successfully.");
    }

    resetForm();
    await loadHighlights();
    setLoading(false);
  };

  return (
    <AppShell>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
            Highlights
          </p>
          <h1 className="text-4xl font-extrabold md:text-5xl">
            Add highlights
          </h1>
          <p className="mt-3 max-w-3xl text-white/75">
            Add your best video highlights so coaches, scouts, and recruiters
            can quickly see your game.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">
                {editingHighlightId ? "Edit Highlight" : "Add Highlight"}
              </h2>

              {editingHighlightId && (
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
                placeholder="e.g. 2025 season highlights"
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Video URL</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              >
                <option value="">Select platform</option>
                <option>YouTube</option>
                <option>Vimeo</option>
                <option>Hudl</option>
                <option>Instagram</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What should people know about this highlight?"
                rows={5}
                className="w-full rounded-xl bg-[#081642] px-4 py-3"
              />
            </div>

            <button
              onClick={handleSaveHighlight}
              disabled={loading}
              className="w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] disabled:opacity-60"
            >
              {loading
                ? editingHighlightId
                  ? "Updating..."
                  : "Saving..."
                : editingHighlightId
                ? "Update Highlight"
                : "Add Highlight"}
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
            <h2 className="mb-6 text-2xl font-bold">Your Highlights</h2>

            <div className="space-y-6">
              {highlights.length === 0 && (
                <div className="rounded-2xl bg-[#081642] p-5 text-white/70">
                  No highlights added yet.
                </div>
              )}

              {highlights.map((highlight) => {
                const embedUrl = getEmbedUrl(
                  highlight.video_url,
                  highlight.platform
                );

                return (
                  <div
                    key={highlight.id}
                    className="rounded-2xl bg-[#081642] p-5"
                  >
                    <h3 className="text-xl font-bold">{highlight.title}</h3>

                    {highlight.platform && (
                      <p className="mt-1 text-sm text-white/70">
                        {highlight.platform}
                      </p>
                    )}

                    <div className="mt-4 overflow-hidden rounded-xl bg-black">
                      {embedUrl ? (
                        <iframe
                          src={embedUrl}
                          title={highlight.title}
                          className="h-56 w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center p-4 text-center text-sm text-white/70">
                          Preview not available for this platform.
                        </div>
                      )}
                    </div>

                    <a
                      href={highlight.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-block text-sm font-semibold text-[#D8F200] underline"
                    >
                      Open video
                    </a>

                    {highlight.description && (
                      <p className="mt-3 text-sm text-white/75">
                        {highlight.description}
                      </p>
                    )}

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleEdit(highlight)}
                        className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(highlight.id)}
                        className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}