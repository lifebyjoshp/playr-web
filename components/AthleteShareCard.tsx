"use client";

import { useEffect, useRef, useState } from "react";

type AthleteShareCardProps = {
  athleteName: string;
  profilePhotoUrl: string | null;
  sport: string | null;
  teamName: string | null;
  isFoundingAthlete: boolean;
  foundingAthleteNumber: number | null;
  profileUrl: string;
  onClose: () => void;
};

function foundingNumber(value: number | null) {
  if (!value) return null;
  return String(value).padStart(3, "0");
}

function safeFileName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "athlete"
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load athlete photo."));
    image.src = src;
  });
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  if (imageRatio > boxRatio) {
    sourceWidth = image.height * boxRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / boxRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height
  );
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export default function AthleteShareCard({
  athleteName,
  profilePhotoUrl,
  sport,
  teamName,
  isFoundingAthlete,
  foundingAthleteNumber,
  profileUrl,
  onClose,
}: AthleteShareCardProps) {
  const storyRef = useRef<HTMLDivElement>(null);

  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const number = foundingNumber(foundingAthleteNumber);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const createStoryFile = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("RADR could not create the story canvas.");
    }

    const width = canvas.width;
    const height = canvas.height;

    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#0B1F5C");
    background.addColorStop(0.58, "#081642");
    background.addColorStop(1, "#050D27");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(870, 250, 20, 870, 250, 520);
    glow.addColorStop(0, "rgba(17,77,255,0.85)");
    glow.addColorStop(1, "rgba(17,77,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, 850);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 58px Arial, sans-serif";
    ctx.fillText("RADR", 76, 105);

    roundedRect(ctx, 815, 57, 190, 62, 31);
    ctx.fillStyle = "rgba(216,242,0,0.10)";
    ctx.fill();
    ctx.strokeStyle = "rgba(216,242,0,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#D8F200";
    ctx.font = "700 22px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ATHLETE", 910, 97);
    ctx.textAlign = "left";

    ctx.fillStyle = "#D8F200";
    ctx.font = "700 30px Arial, sans-serif";
    ctx.fillText("I'M ON THE", 76, 225);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 100px Arial, sans-serif";
    ctx.fillText("RADR.", 76, 325);

    const photoX = 76;
    const photoY = 390;
    const photoW = 928;
    const photoH = 1040;
    const photoRadius = 54;

    ctx.save();
    roundedRect(ctx, photoX, photoY, photoW, photoH, photoRadius);
    ctx.clip();

    ctx.fillStyle = "#081642";
    ctx.fillRect(photoX, photoY, photoW, photoH);

    if (profilePhotoUrl) {
      const athleteImage = await loadImage(profilePhotoUrl);
      drawCoverImage(ctx, athleteImage, photoX, photoY, photoW, photoH);
    } else {
      const fallback = ctx.createLinearGradient(
        photoX,
        photoY,
        photoX + photoW,
        photoY + photoH
      );
      fallback.addColorStop(0, "#114DFF");
      fallback.addColorStop(1, "#081642");
      ctx.fillStyle = fallback;
      ctx.fillRect(photoX, photoY, photoW, photoH);

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "900 280px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        athleteName.charAt(0).toUpperCase(),
        photoX + photoW / 2,
        photoY + photoH / 2
      );
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }

    const photoOverlay = ctx.createLinearGradient(
      0,
      photoY + photoH * 0.55,
      0,
      photoY + photoH
    );
    photoOverlay.addColorStop(0, "rgba(5,13,39,0)");
    photoOverlay.addColorStop(0.45, "rgba(5,13,39,0.58)");
    photoOverlay.addColorStop(1, "rgba(5,13,39,0.96)");
    ctx.fillStyle = photoOverlay;
    ctx.fillRect(photoX, photoY, photoW, photoH);

    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    roundedRect(ctx, photoX, photoY, photoW, photoH, photoRadius);
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 68px Arial, sans-serif";
    const displayName = athleteName.toUpperCase();
    ctx.fillText(displayName, 125, 1305, 830);

    const sportTeam = [sport, teamName].filter(Boolean).join(" • ").toUpperCase();
    if (sportTeam) {
      ctx.fillStyle = "rgba(255,255,255,0.76)";
      ctx.font = "600 28px Arial, sans-serif";
      ctx.fillText(sportTeam, 125, 1365, 830);
    }

    let footerStart = 1505;

    if (isFoundingAthlete && number) {
      roundedRect(ctx, 76, 1490, 928, 185, 34);
      ctx.fillStyle = "rgba(216,242,0,0.10)";
      ctx.fill();
      ctx.strokeStyle = "rgba(216,242,0,0.38)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#D8F200";
      ctx.font = "700 25px Arial, sans-serif";
      ctx.fillText("RADR FOUNDING ATHLETE", 120, 1550);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 62px Arial, sans-serif";
      ctx.fillText(`#${number}`, 120, 1630);

      footerStart = 1740;
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 35px Arial, sans-serif";
    ctx.fillText("ARE YOU ON THE RADR?", 76, footerStart);

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "600 22px Arial, sans-serif";
    ctx.fillText("Build your sporting journey.", 76, footerStart + 42);

    ctx.fillStyle = "#D8F200";
    ctx.font = "900 34px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("radr.au", 1004, footerStart + 12);
    ctx.textAlign = "left";

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("RADR could not create the story image."));
          }
        },
        "image/png",
        1
      );
    });

    return new File(
      [blob],
      `radr-${safeFileName(athleteName)}-story.png`,
      { type: "image/png" }
    );
  };

  const handleShare = async () => {
    setGenerating(true);
    setError("");

    try {
      const file = await createStoryFile();

      if (
        navigator.share &&
        (!navigator.canShare ||
          navigator.canShare({ files: [file] }))
      ) {
        await navigator.share({
          title: `${athleteName} on RADR`,
          text: `I'm on RADR. Check out my athlete profile: ${profileUrl}`,
          files: [file],
        });

        return;
      }

      const downloadUrl = URL.createObjectURL(file);
      const anchor = document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 1000);
    } catch (shareError: unknown) {
      if (
        shareError instanceof DOMException &&
        shareError.name === "AbortError"
      ) {
        return;
      }

      console.error("Unable to share RADR story:", shareError);
      setError(
        "RADR couldn't create the share image. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setGenerating(true);
    setError("");

    try {
      const file = await createStoryFile();
      const downloadUrl = URL.createObjectURL(file);
      const anchor = document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 1000);
    } catch (saveError) {
      console.error("Unable to save RADR story:", saveError);
      setError(
        "RADR couldn't create the share image. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    setError("");

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (copyError) {
      console.error("Unable to copy RADR profile link:", copyError);
      setError("RADR couldn't copy the profile link.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#050D27]/90 px-3 py-5 backdrop-blur-md sm:px-5 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Share athlete profile"
    >
      <button
        type="button"
        onClick={onClose}
        className="fixed right-4 top-4 z-[110] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#0B1F5C] text-xl font-bold text-white shadow-xl"
        aria-label="Close share preview"
      >
        ×
      </button>

      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,420px)_minmax(300px,1fr)] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D8F200]">
            Share to Social
          </p>

          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            I&apos;m on the RADR.
          </h2>

          <p className="mt-2 max-w-lg text-sm leading-6 text-white/60">
            Share your RADR athlete card to your Story, messages or
            social apps.
          </p>

          <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
            <div
              ref={storyRef}
              className="relative aspect-[9/16] w-full overflow-hidden bg-[#0B1F5C] text-white"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(17,77,255,0.85),transparent_34%),linear-gradient(160deg,#0B1F5C_0%,#081642_58%,#050D27_100%)]" />

              <div className="absolute -right-[18%] top-[9%] h-[34%] w-[78%] rotate-[-18deg] rounded-[999px] border-[2px] border-[#D8F200]/20" />
              <div className="absolute -right-[28%] top-[15%] h-[34%] w-[78%] rotate-[-18deg] rounded-[999px] border-[2px] border-white/10" />

              <div className="relative flex h-full flex-col p-[7%]">
                <div className="flex items-center justify-between">
                  <div className="text-[clamp(18px,5vw,32px)] font-black tracking-[0.08em]">
                    RADR
                  </div>

                  <div className="rounded-full border border-[#D8F200]/30 bg-[#D8F200]/10 px-[3%] py-[1.4%] text-[clamp(7px,1.8vw,11px)] font-bold uppercase tracking-[0.18em] text-[#D8F200]">
                    Athlete
                  </div>
                </div>

                <div className="mt-[10%]">
                  <p className="text-[clamp(10px,2.6vw,16px)] font-bold uppercase tracking-[0.22em] text-[#D8F200]">
                    I&apos;m on the
                  </p>

                  <h3 className="mt-[1%] text-[clamp(32px,10vw,66px)] font-black leading-[0.9] tracking-[-0.04em]">
                    RADR.
                  </h3>
                </div>

                <div className="relative mt-[7%] aspect-[4/5] overflow-hidden rounded-[6%] border border-white/15 bg-[#081642] shadow-2xl">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,#114DFF,#081642)] text-[clamp(70px,24vw,150px)] font-black text-white/90">
                      {athleteName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#050D27] via-[#050D27]/65 to-transparent" />

                  <div className="absolute inset-x-[6%] bottom-[5%]">
                    <h4 className="text-[clamp(24px,7vw,44px)] font-black uppercase leading-[0.95] tracking-[-0.025em]">
                      {athleteName}
                    </h4>

                    <p className="mt-[2%] text-[clamp(9px,2.4vw,15px)] font-semibold uppercase tracking-[0.14em] text-white/75">
                      {[sport, teamName].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                </div>

                {isFoundingAthlete && number && (
                  <div className="mt-[5%] rounded-[18px] border border-[#D8F200]/35 bg-[#D8F200]/10 px-[5%] py-[3.5%]">
                    <p className="text-[clamp(8px,2vw,12px)] font-bold uppercase tracking-[0.18em] text-[#D8F200]">
                      RADR Founding Athlete
                    </p>

                    <p className="mt-[1%] text-[clamp(21px,6vw,38px)] font-black">
                      #{number}
                    </p>
                  </div>
                )}

                <div className="mt-auto flex items-end justify-between gap-[5%] pt-[5%]">
                  <div>
                    <p className="text-[clamp(11px,3vw,18px)] font-black uppercase leading-tight">
                      Are you on the RADR?
                    </p>

                    <p className="mt-[1%] text-[clamp(8px,2vw,12px)] font-semibold text-white/55">
                      Build your sporting journey.
                    </p>
                  </div>

                  <p className="shrink-0 text-[clamp(10px,2.7vw,17px)] font-black text-[#D8F200]">
                    radr.au
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0B1F5C] p-5 shadow-2xl sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8F200]">
            Ready to share
          </p>

          <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
            Share your RADR Story
          </h3>

          <p className="mt-2 text-sm leading-6 text-white/60">
            RADR will generate a Story-format image using this athlete
            profile. On supported phones, Share Story opens your native
            share menu so you can choose Instagram or another app.
          </p>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-100">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={handleShare}
              disabled={generating}
              className="rounded-2xl bg-[#D8F200] px-5 py-4 text-sm font-black text-[#0B1F5C] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? "Creating Story..." : "Share Story"}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={generating}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Story Image
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white"
            >
              {copied ? "Profile link copied!" : "Copy Profile Link"}
            </button>
          </div>

          <p className="mt-5 text-xs leading-5 text-white/40">
            Tip: if you post this image to Instagram Stories, add the
            copied RADR profile link using Instagram&apos;s Link sticker.
          </p>
        </div>
      </div>
    </div>
  );
}
