"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi } from "@/lib/api-creator-journey";

type Style = "minimal" | "wordmark" | "icontext";

const STYLES: { id: Style; label: string }[] = [
  { id: "minimal", label: "Minimal / Geometric" },
  { id: "wordmark", label: "Wordmark / Typographic" },
  { id: "icontext", label: "Icon + Text" },
];

const PALETTES: { name: string; colors: [string, string] }[] = [
  { name: "Indigo", colors: ["#4f46e5", "#a5b4fc"] },
  { name: "Emerald", colors: ["#059669", "#6ee7b7"] },
  { name: "Sunset", colors: ["#ea580c", "#fdba74"] },
  { name: "Slate", colors: ["#0f172a", "#94a3b8"] },
];

const FONTS: { name: string; family: string }[] = [
  { name: "Inter / Geometric", family: "Inter, system-ui, sans-serif" },
  { name: "Georgia / Serif", family: "Georgia, 'Times New Roman', serif" },
  { name: "Mono / Technical", family: "'Courier New', ui-monospace, monospace" },
];

// Render one style onto a canvas using name + palette + font (client-only, no AI session).
function drawLogo(canvas: HTMLCanvasElement | null, style: Style, name: string, colors: [string, string], font: string) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  const label = (name || "Brand").trim();
  const initial = label.charAt(0).toUpperCase();

  if (style === "minimal") {
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.arc(W / 2, H / 2 - 18, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `bold 34px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initial, W / 2, H / 2 - 18);
    ctx.fillStyle = colors[0];
    ctx.font = `600 22px ${font}`;
    ctx.fillText(label, W / 2, H / 2 + 40);
  } else if (style === "wordmark") {
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;
    ctx.font = `800 40px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, W / 2, H / 2);
  } else {
    ctx.fillStyle = colors[1];
    ctx.fillRect(W / 2 - 90, H / 2 - 30, 60, 60);
    ctx.fillStyle = colors[0];
    ctx.font = `bold 36px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initial, W / 2 - 60, H / 2);
    ctx.fillStyle = "#111827";
    ctx.font = `600 26px ${font}`;
    ctx.textAlign = "left";
    ctx.fillText(label, W / 2 - 16, H / 2);
  }
}

export default function AILogoToolPage() {
  const router = useRouter();
  const { state } = useCreatorProgress();
  const name = state.project.name || "Brand";

  const [paletteIdx, setPaletteIdx] = useState(0);
  const [fontIdx, setFontIdx] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<Style>("minimal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<Record<Style, HTMLCanvasElement | null>>({ minimal: null, wordmark: null, icontext: null });

  const renderAll = useCallback(() => {
    STYLES.forEach((s) => drawLogo(refs.current[s.id], s.id, name, PALETTES[paletteIdx].colors, FONTS[fontIdx].family));
  }, [name, paletteIdx, fontIdx]);

  useEffect(() => { renderAll(); }, [renderAll]);

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      const canvas = refs.current[selectedStyle];
      if (!canvas) throw new Error("Canvas not ready.");
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed."))), "image/png"));
      await creatorJourneyApi.uploadAiLogo(blob, {
        paletteName: PALETTES[paletteIdx].name,
        typographyPairing: FONTS[fontIdx].name,
        colorPalette: PALETTES[paletteIdx].colors,
      });
      router.push("/dashboard/creator/phase-2/complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your logo.");
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/creator/phase-2/branding")} className="gap-2 text-xs font-semibold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> AI Logo Tool
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full p-6 space-y-6">
        {/* Palette + font selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Palette</div>
            <div className="flex gap-3">
              {PALETTES.map((p, i) => (
                <button key={p.name} onClick={() => setPaletteIdx(i)} className={`h-9 w-9 rounded-full border-2 ${paletteIdx === i ? "border-primary" : "border-transparent"}`} style={{ background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})` }} title={p.name} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Font pairing</div>
            <div className="flex flex-wrap gap-2">
              {FONTS.map((f, i) => (
                <button key={f.name} onClick={() => setFontIdx(i)} className={`rounded-lg border px-3 py-1.5 text-xs ${fontIdx === i ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{f.name}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Style canvases */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STYLES.map((s) => (
            <button key={s.id} onClick={() => setSelectedStyle(s.id)} className={`rounded-2xl border-2 bg-card p-3 text-left transition-all ${selectedStyle === s.id ? "border-primary" : "border-border"}`}>
              <canvas ref={(el) => { refs.current[s.id] = el; }} width={280} height={160} className="w-full rounded-lg bg-white" />
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-xs font-medium">{s.label}</span>
                {selectedStyle === s.id && <Check className="h-4 w-4 text-primary" />}
              </div>
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end">
          <Button onClick={handleConfirm} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Use this logo
          </Button>
        </div>
      </main>
    </div>
  );
}
