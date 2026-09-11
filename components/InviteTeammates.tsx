"use client";

import { useState } from "react";

type InviteTeammatesProps = {
  teamId: string;
  teamName: string;
};

export default function InviteTeammates({
  teamId,
  teamName,
}: InviteTeammatesProps) {
  const [copied, setCopied] = useState(false);

  const getInviteUrl = () => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/join/team/${teamId}`;
  };

  const handleCopy = async () => {
    const inviteUrl = getInviteUrl();

    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Unable to copy invite link:", error);
    }
  };

  const handleShare = async () => {
    const inviteUrl = getInviteUrl();

    if (!inviteUrl) return;

    const shareData = {
      title: `Join ${teamName} on RADR`,
      text: `I'm on RADR with ${teamName}. Join the team and create your athlete profile.`,
      url: inviteUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await handleCopy();
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("Unable to share invite:", error);
      }
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8F200]">
            Grow your team
          </p>

          <h2 className="mt-1 text-xl font-bold text-white">
            Invite teammates
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
            Share your RADR team link with teammates. They can create their
            athlete profile and connect with {teamName}.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="rounded-xl bg-[#D8F200] px-5 py-3 text-sm font-bold text-[#0B1F5C] transition hover:brightness-95"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}