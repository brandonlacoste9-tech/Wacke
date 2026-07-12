/**
 * Render a vertical (9:16) Resonance Overload share card as a PNG blob.
 * Pure canvas — no stream video required (works with Kick embeds + CORS).
 */

export interface OverloadClipOptions {
  caption: string;
  streamerName: string;
  streamPath: string; // e.g. /stream/odablock
  level?: number;
  seed?: number;
}

const W = 1080;
const H = 1920;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 6);
}

export async function renderOverloadClipCard(
  opts: OverloadClipOptions
): Promise<Blob> {
  const {
    caption,
    streamerName,
    streamPath,
    level = 100,
    seed = Date.now(),
  } = opts;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a0514");
  bg.addColorStop(0.45, "#1a0530");
  bg.addColorStop(1, "#050510");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Scanline texture
  ctx.fillStyle = "rgba(0,255,255,0.03)";
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 1);
  }

  // Neon frame
  ctx.strokeStyle = "rgba(255,20,147,0.7)";
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = "rgba(0,255,255,0.45)";
  ctx.lineWidth = 3;
  ctx.strokeRect(56, 56, W - 112, H - 112);

  // Brand
  ctx.fillStyle = "#00FFFF";
  ctx.font = "bold 42px Space Grotesk, Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("WACKÉ.LIVE", W / 2, 140);

  ctx.fillStyle = "#FF1493";
  ctx.font = "900 72px Space Grotesk, Outfit, sans-serif";
  ctx.shadowColor = "rgba(255,20,147,0.8)";
  ctx.shadowBlur = 24;
  ctx.fillText("RESONANCE", W / 2, 280);
  ctx.fillText("OVERLOAD", W / 2, 360);
  ctx.shadowBlur = 0;

  // Streamer
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 48px Space Grotesk, Outfit, sans-serif";
  ctx.fillText(`@${streamerName}`, W / 2, 460);

  // Meter track
  const barX = 120;
  const barY = 560;
  const barW = W - 240;
  const barH = 56;
  ctx.fillStyle = "#0a0a12";
  ctx.strokeStyle = "rgba(0,255,255,0.5)";
  ctx.lineWidth = 3;
  roundRect(ctx, barX, barY, barW, barH, 12);
  ctx.fill();
  ctx.stroke();

  const fillW = (barW * Math.min(100, level)) / 100;
  const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  fillGrad.addColorStop(0, "#00FFFF");
  fillGrad.addColorStop(0.55, "#FF1493");
  fillGrad.addColorStop(1, "#FFFFFF");
  ctx.fillStyle = fillGrad;
  // glitch offsets from seed
  const off = (seed % 7) - 3;
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#FF1493";
  roundRect(ctx, barX + off, barY, fillW, barH, 12);
  ctx.fill();
  ctx.fillStyle = "#00FFFF";
  roundRect(ctx, barX - off, barY, fillW, barH, 12);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = fillGrad;
  roundRect(ctx, barX, barY, fillW, barH, 12);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 36px Space Grotesk, sans-serif";
  ctx.fillText(`${Math.round(level)}%`, W / 2, barY + barH + 56);

  // Caption box
  const cap = caption || "THE CHAMBER JUST DETONATED";
  ctx.font = "bold 44px Space Grotesk, Outfit, sans-serif";
  const lines = wrapText(ctx, cap, W - 200);
  const textStartY = 820;
  ctx.fillStyle = "rgba(255,20,147,0.12)";
  roundRect(ctx, 100, textStartY - 60, W - 200, lines.length * 58 + 100, 24);
  ctx.fill();

  ctx.fillStyle = "#FFB6E0";
  ctx.textAlign = "center";
  lines.forEach((ln, i) => {
    ctx.fillText(ln, W / 2, textStartY + i * 58);
  });

  // CTA
  ctx.fillStyle = "#00FFFF";
  ctx.font = "bold 34px Space Grotesk, sans-serif";
  ctx.fillText("Charge the chamber. Break the stream.", W / 2, H - 280);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "28px Space Grotesk, sans-serif";
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://wacke.live";
  ctx.fillText(`${origin}${streamPath}`, W / 2, H - 200);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "22px monospace";
  ctx.fillText("AI xAI POWERED · MODE CHAOS", W / 2, H - 120);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG encode failed"))),
      "image/png",
      0.95
    );
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function shareClipBlob(
  blob: Blob,
  title: string,
  text: string
): Promise<"shared" | "downloaded" | "failed"> {
  const file = new File([blob], "wacke-resonance-overload.png", {
    type: "image/png",
  });

  try {
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, text, files: [file] });
      return "shared";
    }
  } catch {
    /* user cancelled or share failed */
  }

  try {
    downloadBlob(blob, "wacke-resonance-overload.png");
    return "downloaded";
  } catch {
    return "failed";
  }
}
