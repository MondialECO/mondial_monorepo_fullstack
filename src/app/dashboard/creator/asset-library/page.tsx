'use client';

import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

export default function AssetLibraryPage() {
  const router = useRouter();
  const { state } = useCreatorProgress();
  const { project } = state;
  const branding = project.branding;

  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8 font-sans">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-tight text-foreground">
          Asset Library
        </h1>
        <p className="text-sm font-normal text-muted-foreground">
          Review the saved brand identity data for this idea.
        </p>
      </div>

      {branding.logoType ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Logo card */}
          <Card className="rounded-2xl border-border bg-card shadow-sm p-6 flex flex-col justify-between items-center text-center">
            <div className="w-full text-left border-b border-border/80 pb-3 mb-4">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Asset Type</span>
              <h4 className="font-bold text-sm text-foreground">Brand Logo Mark</h4>
            </div>
            {branding.logoType === 'ai' ? (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-primary to-warning text-white flex items-center justify-center font-extrabold text-4xl shadow-sm mb-4">
                {project.name?.charAt(0) || 'A'}
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-primary/70 to-primary text-white flex items-center justify-center font-extrabold text-4xl shadow-sm mb-4">
                {project.name?.charAt(0) || 'D'}
              </div>
            )}
            <div className="space-y-1.5 w-full">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-bold text-[10px] px-2.5 py-0.5">
                {branding.logoType === 'ai' ? 'AI Logo Generator' : 'Verified M50 designer'}
              </Badge>
            </div>
          </Card>

          {/* Color palette card */}
          <Card className="rounded-2xl border-border bg-card shadow-sm p-6 flex flex-col justify-between">
            <div className="w-full text-left border-b border-border/80 pb-3 mb-4">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Asset Type</span>
              <h4 className="font-bold text-sm text-foreground">Saved Color Palette</h4>
            </div>
            <div className="flex flex-col items-center justify-center flex-1 my-4 space-y-4">
              <div className="flex gap-2">
                {branding.colorPalette?.map((color) => (
                  <div key={color} className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full border border-border shadow-sm" style={{ backgroundColor: color }} />
                    <span className="text-[9px] text-muted-foreground font-mono font-semibold">{color}</span>
                  </div>
                ))}
              </div>
              <span className="text-xs text-foreground font-bold">{branding.paletteName || 'Concept Palette'}</span>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl text-xs font-semibold h-9 w-full">
              Copy CSS Variables
            </Button>
          </Card>

          {/* Typography card */}
          <Card className="rounded-2xl border-border bg-card shadow-sm p-6 flex flex-col justify-between">
            <div className="w-full text-left border-b border-border/80 pb-3 mb-4">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Asset Type</span>
              <h4 className="font-bold text-sm text-foreground">Typography Pairings</h4>
            </div>
            <div className="flex flex-col justify-center flex-1 my-4 space-y-4 px-2">
              <div className="space-y-1">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Title Display font</span>
                <p className="text-lg font-bold text-foreground font-sans">{branding.typographyPairing?.split('+')[0] || 'Syne'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Body font</span>
                <p className="text-sm font-medium text-muted-foreground font-sans">{branding.typographyPairing?.split('+')[1] || 'DM Sans'}</p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="rounded-2xl border-border bg-card p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-12 space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold">No saved brand assets</CardTitle>
            <CardDescription className="text-sm max-w-sm">
              Your project identity and visual assets will appear here once you complete the branding step in Phase 2.
            </CardDescription>
          </div>
          <Button onClick={() => router.push('/dashboard/creator/phase-2/branding')} className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl px-6">
            <Sparkles className="w-4 h-4 mr-1.5" /> Start Branding Setup
          </Button>
        </Card>
      )}
    </div>
  );
}
