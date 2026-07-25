"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, CheckCircle2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { toAiError } from "@/lib/ai-errors";

export default function AILogoToolPage() {
  const router = useRouter();
  const { state, setState } = useCreatorProgress();

  const [selectedOption, setSelectedOption] = useState<number>(1);
  const [selectedPalette, setSelectedPalette] = useState<string>("blue");
  const [selectedFont, setSelectedFont] = useState<string>("syne");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const projectName = state.project.name || "AutoInvoice";

  const palettes = [
    { id: "blue", name: "Brand Blue", colors: ["#3C61DD", "#070707", "#F9F9FA", "#965F11"] },
    { id: "charcoal", name: "Dark Charcoal", colors: ["#1A1A1A", "#FFFFFF", "#786C22", "#F1F1F2"] },
    { id: "forest", name: "Forest Green", colors: ["#157A55", "#070707", "#FFFFFF", "#E9FFF2"] },
  ];

  const fonts = [
    { id: "syne", name: "Syne + DM Sans", fontClass: "font-sans", sample: "Aa" },
    { id: "outfit", name: "Outfit + Inter", fontClass: "font-sans", sample: "Bb" },
    { id: "serif", name: "Playfair + Roboto", fontClass: "font-serif", sample: "Cc" },
  ];

  const activePalette = palettes.find((p) => p.id === selectedPalette) || palettes[0];
  const activeFont = fonts.find((f) => f.id === selectedFont) || fonts[0];

  // Rasterize the chosen monogram to a PNG blob so it can be uploaded as a real asset.
  const renderLogoBlob = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.fillStyle = activePalette.colors[0] || "#3C61DD";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${size * 0.5}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((projectName.charAt(0) || "A").toUpperCase(), size / 2, size / 2 + size * 0.03);
      canvas.toBlob((b) => resolve(b), "image/png");
    });

  const handleConfirm = async () => {
    if (saving) return;
    setSaveError(null);
    setSaving(true);
    try {
      const blob = await renderLogoBlob();
      let logoAsset = `/placeholders/logo_${selectedOption}.png`;
      if (blob) {
        // Persists the asset + palette/typography to the backend branding record.
        const res = await creatorJourneyApi.uploadAiLogo(blob, {
          paletteName: activePalette.name,
          typographyPairing: activeFont.name,
          colorPalette: activePalette.colors,
        });
        logoAsset = res.logoAsset || logoAsset;
      }
      setState((prev) => ({
        ...prev,
        project: {
          ...prev.project,
          branding: {
            logoType: "ai",
            logoAsset,
            colorPalette: activePalette.colors,
            paletteName: activePalette.name,
            typographyPairing: activeFont.name,
          },
          exists: true,
        },
      }));
      setIsConfirmed(true);
    } catch (err) {
      setSaveError(toAiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    router.push("/dashboard/creator/phase-2/complete");
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Isolated Onboarding Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xs px-6 py-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/creator/phase-2/branding")}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Options
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          Phase 2 of 6 — AI Logo Tool
        </div>
      </header>

      {/* Progress Bar (86% filled) */}
      <div className="h-[3px] w-full bg-muted">
        <div className="h-full bg-primary" style={{ width: "86%" }} />
      </div>

      <main className="flex-1 max-w-[1140px] mx-auto w-full px-6 py-10 space-y-8">
        
        {/* Title Block */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">Free AI Logo</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Choose your logo style for "{projectName}"
          </h1>
          <p className="text-sm text-muted-foreground">
            Select a base aesthetic, palette, and font pairing to generate your brand identity preview.
          </p>
        </div>

        {isConfirmed ? (
          /* Brand Assets Outputs Ready Card */
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold text-lg">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-green-600" />
              Brand Assets Ready · Saved to Asset Library
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-4 flex flex-col items-center justify-center text-center rounded-xl bg-card border-border">
                {selectedOption === 1 && (
                  <div className="w-16 h-16 rounded-xl text-white flex items-center justify-center font-extrabold text-2xl" style={{ backgroundColor: activePalette.colors[0] }}>
                    {projectName.charAt(0)}
                  </div>
                )}
                {selectedOption === 2 && (
                  <div className="w-20 h-10 border flex items-center justify-center p-2 rounded-lg" style={{ borderColor: activePalette.colors[0] }}>
                    <span className={`font-black text-xs tracking-widest uppercase ${activeFont.fontClass}`} style={{ color: activePalette.colors[0] }}>
                      {projectName}
                    </span>
                  </div>
                )}
                {selectedOption === 3 && (
                  <div className="flex items-center gap-1.5 p-2 border border-dashed rounded-lg">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: activePalette.colors[0] }}>
                      {projectName.charAt(0)}
                    </div>
                    <span className={`font-extrabold text-[9px] uppercase ${activeFont.fontClass}`} style={{ color: activePalette.colors[0] }}>
                      {projectName}
                    </span>
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground font-semibold mt-3">✓ Saved Logo Asset</span>
              </Card>

              <Card className="p-4 flex flex-col items-center justify-center text-center rounded-xl bg-card border-border">
                <div className="flex gap-1.5 mb-2.5">
                  {activePalette.colors.map((c) => (
                    <div key={c} className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">✓ Saved Palette ({activePalette.name})</span>
              </Card>

              <Card className="p-4 flex flex-col items-center justify-center text-center rounded-xl bg-card border-border">
                <span className={`text-2xl font-extrabold mb-1 ${activeFont.fontClass}`}>{activeFont.sample}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">✓ Saved Fonts ({activeFont.name})</span>
              </Card>
            </div>

            <Button onClick={handleContinue} className="w-full py-5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-2">
              Use This Logo — Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          /* Configurations Workspace */
          <div className="space-y-8">
            
            {/* Generated Concepts */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Generated Concepts</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Style 1: Minimal Geometric */}
                <div
                  onClick={() => setSelectedOption(1)}
                  className={`border-2 rounded-2xl p-6 flex flex-col items-center gap-4 cursor-pointer transition-all ${
                    selectedOption === 1
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Minimal · Geometric</span>
                  <div className="w-24 h-24 rounded-2xl text-white flex items-center justify-center font-extrabold text-3xl shadow-sm" style={{ backgroundColor: activePalette.colors[0] }}>
                    {projectName.charAt(0)}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-semibold text-center leading-relaxed">
                    Clean shapes, bold initial letter mark with custom color backgrounds.
                  </p>
                </div>

                {/* Style 2: Wordmark Typo */}
                <div
                  onClick={() => setSelectedOption(2)}
                  className={`border-2 rounded-2xl p-6 flex flex-col items-center gap-4 cursor-pointer transition-all ${
                    selectedOption === 2
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Wordmark · Typo</span>
                  <div className="w-24 h-24 border border-border rounded-2xl bg-muted/20 flex flex-col items-center justify-center p-2 text-center">
                    <span className={`font-black text-xs tracking-widest uppercase ${activeFont.fontClass}`} style={{ color: activePalette.colors[0] }}>
                      {projectName}
                    </span>
                    <div className="w-8 h-0.5 mt-1" style={{ backgroundColor: activePalette.colors[1] || "#070707" }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-semibold text-center leading-relaxed">
                    Name-based wordmark focusing heavily on font structure and accent colors.
                  </p>
                </div>

                {/* Style 3: Icon + Text */}
                <div
                  onClick={() => setSelectedOption(3)}
                  className={`border-2 rounded-2xl p-6 flex flex-col items-center gap-4 cursor-pointer transition-all ${
                    selectedOption === 3
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Icon + Text</span>
                  <div className="w-24 h-24 border border-border rounded-2xl bg-muted/20 flex items-center justify-center gap-1.5 p-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: activePalette.colors[0] }}>
                      {projectName.charAt(0)}
                    </div>
                    <span className={`font-extrabold text-[9px] tracking-wide uppercase truncate max-w-[50px] ${activeFont.fontClass}`} style={{ color: activePalette.colors[0] }}>
                      {projectName}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-semibold text-center leading-relaxed">
                    Circle-inlay monogram paired next to the concept wordmark.
                  </p>
                </div>

              </div>
            </div>

            {/* Colors Section */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Selected Color Palette</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {palettes.map((palette) => (
                  <div
                    key={palette.id}
                    onClick={() => setSelectedPalette(palette.id)}
                    className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                      selectedPalette === palette.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="text-xs font-bold text-foreground">{palette.name}</span>
                    <div className="flex gap-1">
                      {palette.colors.map((color) => (
                        <div key={color} className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Font Pairing Section */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Typography Pair</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {fonts.map((font) => (
                  <div
                    key={font.id}
                    onClick={() => setSelectedFont(font.id)}
                    className={`p-4 border rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                      selectedFont === font.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-extrabold select-none">
                      {font.sample}
                    </div>
                    <span className="text-xs font-bold text-foreground">{font.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="space-y-3 pt-6 border-t border-border">
              {saveError && <p className="text-xs text-destructive text-right">{saveError}</p>}
              <div className="flex justify-end gap-3">
                <Button variant="outline" disabled={saving} className="rounded-xl gap-2 text-xs font-bold py-5">
                  <RefreshCw className="w-4.5 h-4.5" /> Regenerate
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 text-xs py-5 px-6 flex items-center gap-2 disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Saving…" : "Use This Logo"}
                </Button>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
