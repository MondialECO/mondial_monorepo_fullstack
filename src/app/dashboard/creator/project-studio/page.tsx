'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Rocket,
  FolderOpen,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  History,
  LayoutGrid,
  FileText,
  Clock,
  ExternalLink,
  PlusCircle,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { getNextCreatorAction } from '@/lib/creator-state-resolver';

export default function ProjectStudioPage() {
  const router = useRouter();
  const { state, updateProject } = useCreatorProgress();
  const { project, journeyState } = state;
  const branding = project.branding;
  const action = getNextCreatorAction(journeyState);

  const [versions, setVersions] = useState<Array<{ version: number; date: string; note: string; active: boolean }>>([
    { version: project.currentVersion || 1, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), note: 'Current active workspace', active: true },
    { version: (project.currentVersion || 1) - 0.5, date: 'June 10, 2026', note: 'Initial concept draft generated', active: false }
  ]);

  const handleCreateVersion = () => {
    const nextVer = (project.currentVersion || 1) + 1;
    updateProject({ currentVersion: nextVer });
    setVersions([
      { version: nextVer, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), note: `Version ${nextVer} snapshot`, active: true },
      ...versions.map(v => ({ ...v, active: false }))
    ]);
  };

  const handleRestoreVersion = (verNum: number) => {
    updateProject({ currentVersion: verNum });
    setVersions(versions.map(v => ({
      ...v,
      active: v.version === verNum
    })));
  };

  if (!project.exists) {
    return (
      <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8 font-sans">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold leading-tight text-foreground">
            Project Studio
          </h1>
          <p className="text-sm font-normal text-muted-foreground">
            Manage your project assets and creation workflow.
          </p>
        </div>

        <Card className="rounded-2xl border-border bg-card p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-12 space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <LayoutGrid className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold">No Active Project Draft</CardTitle>
            <CardDescription className="text-sm max-w-sm">
              You haven't initialized your project concept yet. Build your identity and business structure first.
            </CardDescription>
          </div>
          <Button onClick={() => router.push('/dashboard/creator/phase-2')} className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl px-6">
            <Sparkles className="w-4 h-4 mr-1.5" /> Initialize Project Concept
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8 font-sans">
      
      {/* Header with Title and Resume action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Project Workspace</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">Project Studio</span>
          </div>
          <h1 className="text-[28px] font-extrabold leading-tight text-foreground tracking-tight sm:text-3xl">
            Project Studio
          </h1>
          <p className="text-sm text-muted-foreground">
            Customize and manage your active project's version control, assets, and step checkpoints.
          </p>
        </div>

        <Button onClick={() => router.push(action.route)} className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl px-5 py-5 text-sm flex items-center gap-1.5 self-start sm:self-center">
          <Rocket className="w-4 h-4" />
          {action.buttonLabel}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Info & Brand Library */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Project Details Panel */}
          <Card className="rounded-2xl border-border bg-card overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">{project.name || 'Untitled Concept'}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{project.category || 'B2B SaaS / FinTech'}</CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 px-2.5 py-0.5 text-[10px] font-bold">
                  Version {project.currentVersion || 1}.0 Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {project.tagline && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Tagline</span>
                  <p className="text-sm font-medium text-foreground">{project.tagline}</p>
                </div>
              )}
              {project.concept && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Elevator Concept</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{project.concept}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {project.problem && (
                  <div className="bg-muted/30 border border-border/80 rounded-xl p-4 space-y-1">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Problem Statement</span>
                    <p className="text-xs text-foreground font-medium line-clamp-3">{project.problem}</p>
                  </div>
                )}
                {project.solution && (
                  <div className="bg-muted/30 border border-border/80 rounded-xl p-4 space-y-1">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Proposed Solution</span>
                    <p className="text-xs text-foreground font-medium line-clamp-3">{project.solution}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Brand Assets Panel */}
          <Card className="rounded-2xl border-border bg-card overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                Creative Brand Assets
              </CardTitle>
              <CardDescription className="text-xs">Saved brand visuals and logos configured in Phase 2.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {branding.logoType ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Logo Preview */}
                  <div className="flex flex-col items-center justify-center p-5 border border-border/80 bg-muted/20 rounded-xl text-center">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mb-3 block">Logo Mark</span>
                    {branding.logoType === 'ai' ? (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-amber-600 text-white flex items-center justify-center font-extrabold text-4xl shadow-sm">
                        {project.name?.charAt(0) || 'A'}
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-primary text-white flex items-center justify-center font-extrabold text-4xl shadow-sm">
                        {project.name?.charAt(0) || 'D'}
                      </div>
                    )}
                    <span className="text-[10px] text-primary font-bold mt-3 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {branding.logoType === 'ai' ? 'AI Auto Logo' : 'Verified M50 designer'}
                    </span>
                  </div>

                  {/* Color Palette */}
                  <div className="flex flex-col justify-between p-4 border border-border/80 bg-muted/20 rounded-xl">
                    <div>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mb-2 block">Color Palette</span>
                      <h4 className="font-bold text-xs text-foreground mb-3">{branding.paletteName || 'Default Palette'}</h4>
                    </div>
                    <div className="flex gap-2">
                      {branding.colorPalette?.map((color) => (
                        <div key={color} className="flex flex-col items-center gap-1">
                          <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: color }} />
                          <span className="text-[8px] text-muted-foreground font-mono">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typography Pairings */}
                  <div className="flex flex-col justify-between p-4 border border-border/80 bg-muted/20 rounded-xl">
                    <div>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mb-2 block">Typography Pairings</span>
                      <h4 className="font-bold text-sm text-foreground">{branding.typographyPairing || 'Syne + DM Sans'}</h4>
                    </div>
                    <div className="space-y-1.5 border-t border-border/80 pt-3">
                      <p className="text-xs text-foreground font-bold font-sans">Syne (Display Titles)</p>
                      <p className="text-xs text-muted-foreground font-sans">DM Sans (General Body)</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground">Branding assets have not been set up yet. Go to Phase 2 branding step to configure.</p>
                  <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/creator/phase-2/branding')} className="mt-3 text-xs font-semibold rounded-lg">
                    Build brand identity
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Col: Version Control & Roadmap progress */}
        <div className="space-y-6">
          
          {/* Version Control Panel */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <History className="w-4 h-4 text-primary" /> Version Control
                </CardTitle>
                <Button size="icon" variant="ghost" onClick={handleCreateVersion} title="Create snapshot snapshot">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription className="text-xs">Version backups & restore point control.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {versions.map((ver, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                      ver.active
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-foreground">v{ver.version.toFixed(1)}</span>
                        {ver.active && (
                          <Badge className="bg-green-500/10 text-green-600 border-0 hover:bg-green-500/25 text-[8px] font-bold py-0 px-1">
                            active
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{ver.note}</p>
                      <span className="text-[8px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {ver.date}
                      </span>
                    </div>

                    {!ver.active && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRestoreVersion(ver.version)}
                        className="text-[10px] font-bold text-primary hover:text-primary-foreground hover:bg-primary h-7 py-1 px-2 rounded-lg"
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Creation Workflow Checkpoint */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-sm font-bold">Step Checkpoint</CardTitle>
              <CardDescription className="text-xs">Your current active phase progress.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Active Step</span>
                  <span className="text-foreground">{action.targetPhase}.{action.targetStep}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, (action.targetPhase / 6) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-muted/30 border border-border/80 rounded-xl p-3 text-xs space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Next action route</span>
                <span className="text-foreground font-semibold font-mono break-all">{action.route}</span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
