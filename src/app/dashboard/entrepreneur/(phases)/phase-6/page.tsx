'use client';

// Figma Design Implementation: Phase 6 Data Room
// Design: https://figma.com/design/5oHxoppTAyS4zb2DfUdYwy?node-id=23357:54662

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
} from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import entrepreneurApi, {
  DataRoomAccessGrant,
  DataRoomStatusResponse,
} from '@/lib/api-entrepreneur';
import { Phase6Data } from '@/types/entrepreneur';

const REQUIRED_CATEGORIES = ['legal', 'financial', 'business'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  legal: 'Legal & Compliance',
  financial: 'Financial',
  business: 'Business',
  ip: 'IP & Technology',
  team: 'Team',
};
const CATEGORY_EMOJIS: Record<string, string> = {
  legal: '📁',
  financial: '📁',
  business: '💼',
  ip: '🔬',
  team: '👥',
};
type Category = 'legal' | 'financial' | 'business' | 'ip' | 'team';

const MAX_FILE_SIZE = 52_428_800;
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

// Figma design tokens — defined in globals.css (:root + .dark) as --dr-* vars.
const C = {
  bgPage: 'var(--dr-bg-page)',
  bgCard: 'var(--dr-bg-card)',
  bgWhite: 'var(--dr-bg-white)',
  bgBlue: 'var(--dr-bg-blue)',
  bgGreen: 'var(--dr-bg-green)',
  bgYellow: 'var(--dr-bg-yellow)',
  bgIcon: 'var(--dr-bg-icon)',
  primary: 'var(--dr-primary)',
  primaryToggle: 'var(--dr-primary-toggle)',
  textPrimary: 'var(--dr-text-primary)',
  textSecondary: 'var(--dr-text-secondary)',
  textMuted: 'var(--dr-text-muted)',
  green: 'var(--dr-green)',
  yellow: 'var(--dr-yellow)',
  yellowAlt: 'var(--dr-yellow-alt)',
  border: 'var(--dr-border)',
  borderLight: 'var(--dr-border-light)',
};
const SHADOW_CARD = '0px 0px 44px 0px rgba(0,0,0,0.06)';
const SHADOW_BLUR = '-2px -1px 17px 0px rgba(0,0,0,0.02), 1px 2px 3px 0px rgba(0,0,0,0.04)';

function Toggle({ on, disabled, onChange }: { on: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="relative inline-flex shrink-0 items-center rounded-full transition-colors disabled:opacity-60"
      style={{ width: 36, height: 20, padding: '1px 2px', backgroundColor: on ? C.primaryToggle : 'rgba(0,0,0,0.15)' }}
    >
      <span
        className="rounded-full bg-white transition-transform"
        style={{ width: 16, height: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.2)', transform: on ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  );
}

function Donut({ percent }: { percent: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const filled = (circ * Math.min(100, Math.max(0, percent))) / 100;
  return (
    <div className="relative" style={{ width: 100, height: 100 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={8} />
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={C.primary}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-semibold"
        style={{ fontSize: 16, color: C.textPrimary }}
      >
        {percent}%
      </span>
    </div>
  );
}

const REQUIRED_CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'legal', label: '📁 Legal & Compliance' },
  { value: 'financial', label: '📁 Financial' },
  { value: 'business', label: '💼 Business' },
];

function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.08)', ...style }}
    />
  );
}

function Phase6LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton style={{ height: 56 }} />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="flex-1" style={{ height: 130 }} />
            ))}
          </div>
          <Skeleton style={{ height: 320 }} />
        </div>
        <div className="flex flex-col gap-6 lg:w-[360px] lg:shrink-0">
          <Skeleton style={{ height: 220 }} />
          <Skeleton style={{ height: 320 }} />
          <Skeleton style={{ height: 200 }} />
        </div>
      </div>
    </div>
  );
}

function Phase6Content() {
  const router = useRouter();
  const { savePhaseData, moveToNextStep, getPhaseData, applyBackendResponse } =
    useEntrepreneurProgress();

  const [status, setStatus] = useState<DataRoomStatusResponse | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ legal: true });
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [uploadCategory, setUploadCategory] = useState<Category>('legal');
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingCategory = useRef<Category>('legal');

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase6Data = getPhaseData<Phase6Data>(6) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const reload = async () => {
    try {
      setError('');
      setIsLoading(true);
      const companyId = await resolveCompanyId();
      const s = await entrepreneurApi.getDataRoom(companyId);
      setStatus(s);
      const existing: Phase6Data = getPhaseData<Phase6Data>(6) ?? {};
      savePhaseData(6, {
        ...existing,
        __companyId: companyId,
        documentsUploadedCount: s.documents.length,
        accessGrantsCount: s.accessGrants.length,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load data room';
      console.error('reload error:', e);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateFile = (file: File): string => {
    if (file.size > MAX_FILE_SIZE) {
      return `File too large: ${(file.size / 1048576).toFixed(1)}MB. Maximum is 50MB.`;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Unsupported file type. Accepted: PDF, PPTX, DOCX, XLSX.';
    }
    return '';
  };

  const triggerUpload = (category: Category) => {
    pendingCategory.current = category;
    setUploadCategory(category);
    setUploadError('');
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    setUploadError('');
    const msg = validateFile(file);
    if (msg) { setUploadError(msg); return; }
    try {
      const companyId = await resolveCompanyId();
      const title = file.name.replace(/\.[^.]+$/, '');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title);
      fd.append('category', pendingCategory.current);
      fd.append('isRequired', 'false');
      await entrepreneurApi.uploadDataRoomDocument(companyId, fd);
      await reload();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleNdaToggle = async (required: boolean) => {
    setError('');
    try {
      const companyId = await resolveCompanyId();
      await entrepreneurApi.updateNdaRequirement(companyId, required);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'NDA toggle failed');
    }
  };

  const goManageAccess = async () => {
    try {
      const companyId = await resolveCompanyId();
      router.push(`/dashboard/entrepreneur/phase-6/manage-access?companyId=${companyId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Navigation failed');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();
      const published = await entrepreneurApi.publishDataRoom(companyId);
      setStatus(published);

      const advanceResponse = await entrepreneurApi.advancePhase(companyId, 6, {});
      if (advanceResponse?.currentPhase !== 7) {
        throw new Error(`Phase advancement failed - expected currentPhase=7, got ${advanceResponse?.currentPhase}`);
      }
      if (!advanceResponse?.completedPhases?.includes(6)) {
        throw new Error('Phase 6 not marked as completed in backend response');
      }
      applyBackendResponse(advanceResponse);

      const existing: Phase6Data = getPhaseData<Phase6Data>(6) ?? {};
      savePhaseData(6, {
        ...existing,
        __companyId: companyId,
        dataRoomPublishedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      });
      moveToNextStep(6, 1);

      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur/phase-6/complete');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const docs = status?.documents ?? [];
  const grants = status?.accessGrants ?? [];
  const uploadedCategories = new Set(docs.map((d) => d.category?.toLowerCase()));
  const completedCategories = REQUIRED_CATEGORIES.filter((c) => uploadedCategories.has(c));
  const missingRequired = REQUIRED_CATEGORIES.filter((c) => !uploadedCategories.has(c));
  const missingCount = REQUIRED_CATEGORIES.length - completedCategories.length;
  const readinessPercent = Math.round((completedCategories.length / REQUIRED_CATEGORIES.length) * 100);
  const isLive = status?.isLive ?? false;
  const ndaActive = status?.ndaRequired ?? false;
  const ndaLocked = !!status?.ndaLockedAt;
  const totalBytes = docs.reduce((sum, d) => sum + (d.fileSize ?? 0), 0);
  const totalSizeMb = (totalBytes / 1048576).toFixed(1);
  // Always surface the three required folders so users can upload into each.
  const folderCategories = REQUIRED_CATEGORIES;
  const defaultExpiryDays = 30;

  function getDocs(category: string) {
    return docs.filter((d) => d.category?.toLowerCase() === category.toLowerCase());
  }
  const toggleFolder = (c: string) => setExpanded((p) => ({ ...p, [c]: !p[c] }));

  if (isLoading && !status) {
    return <Phase6LoadingState />;
  }

  return (
    <div className="flex flex-col gap-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.pptx,.docx,.xlsx,.xls"
        onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* SECTION 1 — PAGE HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold" style={{ fontSize: 32, lineHeight: '40px', color: C.textPrimary }}>
              Data Room—Secure Repository
            </h1>
            <span
              className="inline-flex items-center gap-2 rounded-full"
              style={{ backgroundColor: isLive ? C.bgGreen : C.bgYellow, border: `1px solid ${C.border}`, padding: '4px 12px' }}
            >
              <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: isLive ? C.green : C.yellow }} />
              <span className="font-semibold" style={{ fontSize: 14, color: isLive ? C.green : C.yellow }}>
                {isLive ? (ndaActive ? '● Live · NDA Active' : '● Live') : '○ Draft'}
              </span>
            </span>
          </div>
          <p style={{ fontSize: 14, lineHeight: '20px', color: C.textSecondary }}>
            Define your cap table, record stakeholders, setup ESOP, and simulate future funding rounds
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* TODO: wire to export endpoint when available */}
          <button
            type="button"
            disabled
            title="Export report coming soon"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg opacity-50"
            style={{ backgroundColor: C.bgWhite, border: `1px solid ${C.border}`, padding: '10px 16px' }}
          >
            <Download size={16} style={{ color: C.textSecondary }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: C.textSecondary }}>Export Report</span>
          </button>
          <button
            type="button"
            onClick={goManageAccess}
            className="inline-flex items-center rounded-lg"
            style={{ backgroundColor: C.primary, padding: '10px 16px' }}
          >
            <span className="font-semibold" style={{ fontSize: 13, color: '#f7f7f7' }}>Manage Access</span>
          </button>
        </div>
      </div>

      {/* SECTION 2 — STATUS BAR */}
      <div
        className="flex items-center justify-between rounded-lg"
        style={{ backgroundColor: C.bgCard, border: `2px solid ${C.bgWhite}`, boxShadow: SHADOW_BLUR, padding: '8px 12px' }}
      >
        <div className="flex items-center gap-2">
          <span className="rounded-full" style={{ width: 12, height: 12, backgroundColor: isLive ? C.green : C.yellow }} />
          <span className="font-semibold" style={{ fontSize: 12, color: isLive ? C.green : C.yellow }}>
            {isLive ? 'Data Room Live' : 'Data Room Draft'}
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: isLive ? C.green : C.yellow }}>
            {isLive
              ? ndaActive
                ? '— investors can request access · NDA required'
                : '— investors can request access'
              : '— not visible to investors'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {[
            `📄 ${docs.length} docs`,
            '📁 3 folders',
            ndaActive ? '🔐 NDA active' : '🔓 No NDA',
            `👁 ${grants.length} investors`,
          ].map((label) => (
            <span
              key={label}
              className="rounded-md"
              style={{ backgroundColor: C.bgWhite, border: `1px solid ${C.borderLight}`, boxShadow: SHADOW_BLUR, padding: '4px 12px', fontSize: 12, fontWeight: 500, color: C.textSecondary }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* SECTION 3 — TWO-COLUMN LAYOUT */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* LEFT COLUMN */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {/* 3A — STAT CARDS ROW */}
          <div className="flex gap-3">
            {([
              {
                icon: '📄',
                label: 'Documents',
                value: `${docs.length}`,
                sub: `${completedCategories.length} / ${REQUIRED_CATEGORIES.length}`,
                badge: missingCount > 0 ? `${missingCount} categor${missingCount === 1 ? 'y' : 'ies'} missing` : 'All complete',
                badgeBg: missingCount > 0 ? C.bgYellow : C.bgGreen,
                badgeColor: missingCount > 0 ? C.yellow : C.green,
              },
              { icon: '📁', label: 'Folders', value: '3', sub: 'legal · financial · business' },
              { icon: '💾', label: 'Total File Size', value: totalSizeMb, suffix: 'MB', sub: `${docs.length} files` },
              {
                icon: '👁',
                label: 'Data Room Access',
                value: `${grants.length}`,
                badge: ndaActive ? 'NDA active' : 'No NDA',
                badgeBg: ndaActive ? C.bgGreen : C.bgYellow,
                badgeColor: ndaActive ? C.green : C.yellow,
              },
            ] as const).map((card) => (
              <div
                key={card.label}
                className="flex flex-1 flex-col items-center gap-4 rounded-xl"
                style={{ backgroundColor: C.bgCard, border: `2px solid ${C.bgWhite}`, boxShadow: SHADOW_BLUR, padding: '16px 12px' }}
              >
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 40, height: 40, backgroundColor: C.bgWhite, border: `1px solid ${C.border}`, fontSize: 20 }}
                >
                  {card.icon}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{card.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold" style={{ fontSize: 24, lineHeight: '32px', color: C.textPrimary }}>{card.value}</span>
                    {'suffix' in card && card.suffix && (
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.textMuted }}>{card.suffix}</span>
                    )}
                  </div>
                  {'sub' in card && card.sub && (
                    <span className="text-center" style={{ fontSize: 11, color: C.textMuted }}>{card.sub}</span>
                  )}
                  {'badge' in card && card.badge && (
                    <span className="rounded-full" style={{ backgroundColor: card.badgeBg, padding: '2px 8px', fontSize: 11, color: card.badgeColor }}>
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 3B — DOCUMENTS MAIN CONTAINER */}
          <div
            className="flex flex-col gap-5 rounded-2xl"
            style={{ backgroundColor: C.bgCard, border: `2px solid ${C.bgWhite}`, boxShadow: SHADOW_BLUR, padding: 20 }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 18, color: C.textPrimary }}>
                <span className="font-bold">📄</span> ALL DOCUMENTS
              </span>
              <span
                className="rounded-lg font-semibold"
                style={{ backgroundColor: C.bgBlue, border: `1px solid ${C.border}`, padding: '4px 12px', fontSize: 14, color: C.primary }}
              >
                {docs.length} items
              </span>
            </div>

            {uploadError && (
              <div className="flex items-start gap-2 rounded-lg" style={{ backgroundColor: C.bgYellow, padding: 12 }}>
                <AlertTriangle size={16} style={{ color: C.yellow, marginTop: 2 }} />
                <p style={{ fontSize: 13, fontWeight: 500, color: C.yellow }}>{uploadError}</p>
              </div>
            )}

            {/* Category picker + upload — lets users add docs to any required category */}
            <div className="flex items-center gap-2 rounded-lg" style={{ backgroundColor: C.bgWhite, border: `1px solid ${C.border}`, padding: 12 }}>
              <label htmlFor="upload-category" className="sr-only">Upload category</label>
              <select
                id="upload-category"
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as Category)}
                className="flex-1 rounded-lg"
                style={{ border: `1px solid ${C.border}`, backgroundColor: C.bgCard, padding: '8px 12px', fontSize: 14, color: C.textPrimary }}
              >
                {REQUIRED_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => triggerUpload(uploadCategory)}
                className="inline-flex items-center justify-center gap-2 rounded-lg"
                style={{ backgroundColor: C.bgIcon, border: `1px dashed ${C.border}`, padding: '8px 20px' }}
              >
                <span style={{ fontSize: 14, fontWeight: 500, color: C.textSecondary }}>Upload New</span>
                <Upload size={18} style={{ color: C.textSecondary }} />
              </button>
            </div>

            {(
              <div className="flex flex-col gap-4">
                {folderCategories.map((category) => {
                  const catDocs = getDocs(category);
                  const isOpen = !!expanded[category];
                  const emoji = CATEGORY_EMOJIS[category] ?? '📁';
                  const label = CATEGORY_LABELS[category] ?? category;

                  if (!isOpen) {
                    return (
                      <div
                        key={category}
                        className="flex items-center justify-between rounded-xl"
                        style={{ backgroundColor: C.bgWhite, border: `1px solid ${C.border}`, boxShadow: SHADOW_CARD, padding: 16 }}
                      >
                        <span className="font-semibold" style={{ fontSize: 16, color: C.textPrimary }}>
                          {emoji} {label} ({catDocs.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleFolder(category)}
                          aria-label={`Expand ${label}`}
                          className="flex items-center justify-center rounded-full"
                          style={{ width: 28, height: 28, backgroundColor: C.bgPage, border: `1px solid ${C.border}` }}
                        >
                          <ChevronDown size={20} style={{ color: C.textSecondary }} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={category}
                      className="flex flex-col gap-5 overflow-hidden rounded-2xl"
                      style={{ backgroundColor: C.bgWhite, border: `1px solid ${C.border}`, boxShadow: SHADOW_CARD }}
                    >
                      <div
                        className="flex items-center justify-between"
                        style={{ backgroundColor: C.bgBlue, borderBottom: `1px solid ${C.border}`, padding: 16 }}
                      >
                        <span className="font-semibold" style={{ fontSize: 16, color: C.textPrimary }}>
                          {emoji} {label}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleFolder(category)}
                          aria-label={`Collapse ${label}`}
                          className="flex items-center justify-center rounded-full"
                          style={{ width: 28, height: 28, backgroundColor: C.bgPage, border: `1px solid ${C.border}` }}
                        >
                          <ChevronUp size={20} style={{ color: C.textSecondary }} />
                        </button>
                      </div>

                      <div className="flex gap-3" style={{ paddingLeft: 20, paddingRight: 16, paddingBottom: 4 }}>
                        <div className="rounded" style={{ width: 1, backgroundColor: C.borderLight }} />
                        <div className="flex flex-1 flex-col gap-3">
                          {catDocs.map((d) => {
                            const isPublished = d.status === 'published';
                            return (
                              <div
                                key={d.documentId}
                                className="flex items-center justify-between rounded-xl"
                                style={{ backgroundColor: isPublished ? C.bgWhite : C.bgYellow, border: `1px solid ${C.border}`, padding: 20 }}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div
                                    className="flex shrink-0 items-center justify-center rounded-lg"
                                    style={{ width: 32, height: 32, backgroundColor: C.bgIcon, fontSize: 20 }}
                                  >
                                    📄
                                  </div>
                                  <div className="flex min-w-0 flex-col gap-0.5">
                                    <span className="truncate font-semibold" style={{ fontSize: 14, color: C.textPrimary }}>
                                      {d.fileName}
                                    </span>
                                    <span style={{ fontSize: 12, color: C.textSecondary }}>
                                      {d.title} · {label} · {(d.fileSize / 1048576).toFixed(1)} MB
                                    </span>
                                    <span style={{ fontSize: 11, color: C.textMuted }}>
                                      👁 {d.viewCount ?? 0}  ⬇ {d.downloadCount ?? 0}
                                    </span>
                                  </div>
                                </div>
                                {isPublished ? (
                                  <span
                                    className="shrink-0 rounded"
                                    style={{ backgroundColor: C.bgGreen, border: `1px solid ${C.border}`, padding: '4px 12px', fontSize: 11, fontWeight: 500, color: C.green }}
                                  >
                                    PUBLISHED
                                  </span>
                                ) : (
                                  <div className="flex shrink-0 items-center gap-2">
                                    <span
                                      className="inline-flex items-center gap-1 rounded-full"
                                      style={{ backgroundColor: C.yellow, padding: '4px 12px', fontSize: 11, fontWeight: 500, color: '#f7f7f7' }}
                                    >
                                      <AlertTriangle size={12} /> DRAFT
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => triggerUpload(category)}
                                      className="rounded-full"
                                      style={{ backgroundColor: C.primary, padding: '4px 12px', fontSize: 11, fontWeight: 500, color: '#f7f7f7' }}
                                    >
                                      Re-upload
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <button
                            type="button"
                            onClick={() => triggerUpload(category)}
                            className="flex items-center justify-center gap-2 rounded-lg"
                            style={{ backgroundColor: C.bgIcon, border: `1px dashed ${C.border}`, padding: '12px 24px' }}
                          >
                            <span style={{ fontSize: 16, fontWeight: 500, color: C.textSecondary }}>Upload New</span>
                            <Upload size={20} style={{ color: C.textSecondary }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6 lg:w-[360px] lg:shrink-0">
          {/* 3C — ACCESS CONTROL */}
          <div
            className="flex flex-col gap-4 overflow-hidden rounded-xl pb-4"
            style={{ backgroundColor: C.bgCard, border: `2px solid ${C.bgWhite}`, boxShadow: SHADOW_BLUR }}
          >
            <div style={{ backgroundColor: C.bgBlue, borderBottom: `1px solid ${C.border}`, padding: '16px 20px' }}>
              <span className="font-semibold" style={{ fontSize: 16, color: C.textPrimary }}>🔒 Access Control</span>
            </div>

            <div className="flex flex-col gap-3" style={{ paddingLeft: 20, paddingRight: 20 }}>
              {/* NDA row */}
              <div className="flex items-center justify-between" style={{ borderBottom: `1px solid ${C.borderLight}`, paddingBottom: 12 }}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, backgroundColor: C.borderLight, fontSize: 16 }}>🔐</div>
                  <div className="flex flex-col">
                    <span style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary }}>NDA required</span>
                    <span style={{ fontSize: 12, color: C.textSecondary }}>
                      {ndaLocked ? 'Locked — investor signed' : 'Digital signature before access'}
                    </span>
                  </div>
                </div>
                <Toggle on={ndaActive} disabled={ndaLocked} onChange={handleNdaToggle} />
              </div>

              {/* Email alerts row */}
              {/* TODO: persist to Companies.EmailAlertsEnabled when backend field is added */}
              <div className="flex items-center justify-between" style={{ borderBottom: `1px solid ${C.borderLight}`, paddingBottom: 12 }}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, backgroundColor: C.borderLight, fontSize: 16 }}>📩</div>
                  <div className="flex flex-col">
                    <span style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary }}>Email alerts</span>
                    <span style={{ fontSize: 12, color: C.textSecondary }}>Notify on every access</span>
                    {!emailAlerts && (
                      <span style={{ fontSize: 10, color: C.yellow }}>(not saved)</span>
                    )}
                  </div>
                </div>
                <Toggle on={emailAlerts} onChange={setEmailAlerts} />
              </div>

              {/* Access expiry row — expiry is configured per-grant on manage-access page */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, backgroundColor: C.borderLight, fontSize: 16 }}>🕓</div>
                  <div className="flex flex-col">
                    <span style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary }}>Access expiry</span>
                    <span style={{ fontSize: 12, color: C.textSecondary }}>
                      Auto-revoke after <span style={{ fontWeight: 500, color: C.textPrimary }}>{defaultExpiryDays}</span> days
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={goManageAccess}
                  className="rounded-full font-semibold"
                  style={{ backgroundColor: C.bgYellow, border: `1px solid ${C.border}`, padding: '4px 12px', fontSize: 11, color: C.yellowAlt }}
                >
                  Set
                </button>
              </div>
            </div>

            {/* Footer — node status */}
            <div className="flex items-center justify-between" style={{ paddingLeft: 20, paddingRight: 20 }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>Node Status: Stable</span>
              <div className="flex items-end" style={{ gap: 7 }}>
                {[1, 0.8, 0.5, 0].map((op, i) => (
                  <span key={i} className="rounded-sm" style={{ width: 4, height: 10, backgroundColor: op === 0 ? C.borderLight : C.primary, opacity: op === 0 ? 1 : op }} />
                ))}
              </div>
            </div>
          </div>

          {/* 3D — DATA ROOM READINESS */}
          <div
            className="flex flex-col gap-4 overflow-hidden rounded-xl pb-2"
            style={{ backgroundColor: C.bgCard, border: `2px solid ${C.bgWhite}`, boxShadow: SHADOW_BLUR }}
          >
            <div className="flex items-center justify-between" style={{ backgroundColor: C.bgBlue, borderBottom: `1px solid ${C.border}`, padding: '16px 20px' }}>
              <span className="font-semibold" style={{ fontSize: 16, color: C.textPrimary }}>Data Room Readiness</span>
              <span className="font-semibold" style={{ fontSize: 16, color: C.primary }}>{readinessPercent}%</span>
            </div>

            <div className="flex flex-col items-center gap-4" style={{ borderBottom: `1px solid ${C.border}`, paddingTop: 16, paddingBottom: 16 }}>
              <Donut percent={readinessPercent} />
              <p className="px-5 text-center">
                <span className="font-semibold" style={{ fontSize: 14, color: C.textPrimary }}>
                  {completedCategories.length} of {REQUIRED_CATEGORIES.length}
                </span>
                <span style={{ fontSize: 14, color: C.textMuted }}>
                  {' '}required categories uploaded.{' '}
                  {missingCount > 0
                    ? `Upload ${missingCount} more categor${missingCount === 1 ? 'y' : 'ies'} to unlock Phase 7 AI Review.`
                    : 'All required documents uploaded. Ready for Phase 7.'}
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-3" style={{ paddingLeft: 20, paddingRight: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: C.textSecondary }}>Required Documents</span>
              <div className="flex flex-col gap-2">
                {REQUIRED_CATEGORY_OPTIONS.map((item) => {
                  const done = uploadedCategories.has(item.value);
                  return (
                    <div key={item.value} className="flex items-center gap-2" style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                      {done ? (
                        <span className="flex items-center justify-center rounded-full" style={{ width: 16, height: 16, backgroundColor: C.primary }}>
                          <Check size={11} color="#fff" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="rounded-full" style={{ width: 16, height: 16, border: `1.5px solid ${C.textMuted}`, opacity: 0.6 }} />
                      )}
                      <span style={{ fontSize: 13, color: C.textSecondary, textDecoration: done ? 'line-through' : 'none' }}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3E — MANAGE ACCESS */}
          <div
            className="flex flex-col gap-4 overflow-hidden rounded-xl"
            style={{ backgroundColor: C.bgCard, border: `2px solid ${C.bgWhite}`, boxShadow: SHADOW_BLUR }}
          >
            <div className="flex items-center justify-between" style={{ backgroundColor: C.bgBlue, borderBottom: `1px solid ${C.border}`, padding: '16px 20px' }}>
              <span className="font-semibold" style={{ fontSize: 16, color: C.textPrimary }}>Manage Access</span>
              <button
                type="button"
                onClick={goManageAccess}
                className="rounded font-semibold"
                style={{ backgroundColor: C.bgWhite, border: `1px solid ${C.border}`, padding: '6px 16px', fontSize: 12, color: C.textSecondary }}
              >
                Manage
              </button>
            </div>

            <div className="flex flex-col gap-4" style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 16 }}>
              {grants.length === 0 ? (
                <p className="text-center" style={{ fontSize: 13, color: C.textMuted, paddingTop: 8, paddingBottom: 8 }}>
                  No investors have access yet.
                </p>
              ) : (
                grants.map((g: DataRoomAccessGrant, i) => {
                  const name = g.investorName || g.investorId;
                  const initials = name.slice(0, 2).toUpperCase();
                  const isLast = i === grants.length - 1;
                  return (
                    <div
                      key={g.investorId}
                      className="flex items-center gap-3"
                      style={isLast ? undefined : { borderBottom: `1px solid ${C.borderLight}`, paddingBottom: 8 }}
                    >
                      <div
                        className="flex shrink-0 items-center justify-center rounded-full font-semibold"
                        style={{ width: 48, height: 48, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryToggle})`, color: '#fff', fontSize: 16 }}
                      >
                        {initials}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate" style={{ fontSize: 16, fontWeight: 500, color: C.textPrimary }}>{name}</span>
                        <span className="truncate" style={{ fontSize: 11, color: C.textSecondary }}>
                          Expires {new Date(g.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                      {/* TODO: show "NDA Signed" badge when grant.ndaSigned === true */}
                      {/* Backend DataRoomAccessGrant does not yet carry this field. */}
                      <div className="flex shrink-0 items-center">
                        <span className="rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.06)', padding: '2px 8px', fontSize: 11, fontWeight: 500, color: C.textSecondary }}>
                          {g.accessLevel}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl p-4" style={{ backgroundColor: 'rgba(220,38,38,0.1)', border: '2px solid rgba(220,38,38,0.3)' }}>
          <AlertCircle size={20} style={{ color: '#dc2626', marginTop: 2 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>{error}</p>
        </div>
      )}

      <StepFooter
        backUrl="/dashboard/entrepreneur/phase-5"
        onNextClick={handleSubmit}
        isLoading={isSubmitting}
        nextLabel="Publish &amp; Complete Phase 6"
        nextValidationError={error}
        isNextDisabled={isLoading || docs.length === 0 || missingRequired.length > 0}
      />
    </div>
  );
}

export default function Phase6Page() {
  return (
    <RouteGuard requiredPhase={6}>
      <div className="space-y-6 md:space-y-8" style={{ backgroundColor: C.bgPage }}>
        <Phase6Content />
      </div>
    </RouteGuard>
  );
}


