'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, FileText, Plus, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import entrepreneurApi, {
  DataRoomAccessGrant,
  DataRoomAnalyticsResponse,
  DataRoomDocumentResponse,
  DataRoomStatusResponse,
} from '@/lib/api-entrepreneur';
import { Phase6Data } from '@/types/entrepreneur';

const ALLOWED_CATEGORIES = ['legal', 'financial', 'business', 'ip', 'team'] as const;
const REQUIRED_CATEGORIES = ['legal', 'financial', 'business'] as const;
type Category = (typeof ALLOWED_CATEGORIES)[number];

function Phase6Content() {
  const router = useRouter();
  const { savePhaseData, moveToNextStep, getPhaseData, applyBackendResponse } =
    useEntrepreneurProgress();

  const [status, setStatus] = useState<DataRoomStatusResponse | null>(null);
  const [analytics, setAnalytics] = useState<DataRoomAnalyticsResponse | null>(null);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<Category>('legal');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [grantInvestorId, setGrantInvestorId] = useState('');
  const [grantAccessLevel, setGrantAccessLevel] = useState('view_only');
  const [grantDaysValid, setGrantDaysValid] = useState('30');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase6Data = getPhaseData<Phase6Data>(6) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const reload = async () => {
    try {
      const companyId = await resolveCompanyId();
      const [s, a] = await Promise.all([
        entrepreneurApi.getDataRoom(companyId),
        entrepreneurApi.getDataRoomAnalytics(companyId).catch(() => null),
      ]);
      setStatus(s);
      setAnalytics(a);
      const existing: Phase6Data = getPhaseData<Phase6Data>(6) ?? {};
      savePhaseData(6, {
        ...existing,
        __companyId: companyId,
        documentsUploadedCount: s.documents.length,
        accessGrantsCount: s.accessGrants.length,
      });
    } catch {
      // hydration failure is acceptable; user can still try to act
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async () => {
    setError('');
    if (!uploadFile) { setError('Pick a file to upload'); return; }
    if (!uploadTitle.trim()) { setError('Title is required'); return; }
    setIsUploading(true);
    try {
      const companyId = await resolveCompanyId();
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('title', uploadTitle.trim());
      fd.append('category', uploadCategory);
      fd.append('isRequired', 'false');
      await entrepreneurApi.uploadDataRoomDocument(companyId, fd);
      setUploadFile(null);
      setUploadTitle('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGrant = async () => {
    setError('');
    if (!grantInvestorId.trim()) { setError('Investor id is required'); return; }
    const days = parseInt(grantDaysValid, 10);
    if (!Number.isFinite(days) || days <= 0) { setError('Days valid must be > 0'); return; }
    try {
      const companyId = await resolveCompanyId();
      await entrepreneurApi.grantDataRoomAccess(companyId, grantInvestorId.trim(), grantAccessLevel, days);
      setGrantInvestorId('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Grant failed');
    }
  };

  const handleRevoke = async (investorId: string) => {
    setError('');
    try {
      const companyId = await resolveCompanyId();
      await entrepreneurApi.revokeDataRoomAccess(companyId, investorId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revoke failed');
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

  const handleDownload = async (doc: DataRoomDocumentResponse) => {
    setError('');
    try {
      const companyId = await resolveCompanyId();
      const blob = await entrepreneurApi.downloadDataRoomDocument(companyId, doc.documentId);
      await entrepreneurApi.trackDataRoomDownload(companyId, doc.documentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || doc.title;
      a.click();
      URL.revokeObjectURL(url);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
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
      router.push('/dashboard/entrepreneur/phase-7');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const docs = status?.documents ?? [];
  const grants = status?.accessGrants ?? [];
  const uploadedCategories = new Set(docs.map((d) => d.category?.toLowerCase()));
  const missingRequired = REQUIRED_CATEGORIES.filter((c) => !uploadedCategories.has(c));

  return (
    <div className="space-y-6">
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs uppercase text-neutral-5">Total documents</p>
          <p className="font-bold text-neutral-1">{docs.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-neutral-5">Required categories</p>
          <p className={`font-bold ${missingRequired.length === 0 ? 'text-green-700' : 'text-amber-700'}`}>
            {REQUIRED_CATEGORIES.length - missingRequired.length} / {REQUIRED_CATEGORIES.length}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-neutral-5">Access grants</p>
          <p className="font-bold text-neutral-1">{grants.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-neutral-5">Published</p>
          <p className={`font-bold ${status?.isLive ? 'text-green-700' : 'text-neutral-5'}`}>
            {status?.isLive ? 'yes' : 'no'}
          </p>
        </div>
      </div>

      {missingRequired.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Missing required categories: <strong>{missingRequired.join(', ')}</strong>.
            Each must have at least one document before you can submit.
          </p>
        </div>
      )}

      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-neutral-1">Upload document</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            type="text"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            placeholder="Document title"
            className="h-10 bg-background border-neutral-2"
          />
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value as Category)}
            className="h-10 rounded-md border border-neutral-2 bg-background px-3 text-sm"
          >
            {ALLOWED_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="file"
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            className="h-10 text-sm"
          />
        </div>
        <Button onClick={handleUpload} disabled={isUploading || !uploadFile} className="gap-2">
          <Upload className="w-4 h-4" />
          {isUploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>

      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-3">
        <h3 className="text-lg font-bold text-neutral-1">Documents</h3>
        {docs.length === 0 ? (
          <p className="text-sm text-neutral-5">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <div
                key={d.documentId}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-background border-2 border-neutral-2 rounded-xl p-3"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-neutral-5 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-1 truncate">{d.title}</p>
                    <p className="text-xs text-neutral-5 truncate">
                      {d.category} · {d.fileName} · {(d.fileSize / 1024).toFixed(1)} KB
                    </p>
                    <p className="text-xs text-neutral-5 mt-0.5">
                      Views: {d.viewCount} · Downloads: {d.downloadCount}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload(d)}>
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-1">Access grants</h3>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={status?.ndaRequired ?? false}
              onChange={(e) => handleNdaToggle(e.target.checked)}
            />
            NDA required
          </label>
        </div>

        <div className="grid grid-cols-12 gap-2 items-end">
          <Input
            type="text"
            value={grantInvestorId}
            onChange={(e) => setGrantInvestorId(e.target.value)}
            placeholder="Investor id"
            className="col-span-5 h-9 bg-background border-neutral-2"
          />
          <select
            value={grantAccessLevel}
            onChange={(e) => setGrantAccessLevel(e.target.value)}
            className="col-span-3 h-9 rounded-md border border-neutral-2 bg-background px-2 text-sm"
          >
            <option value="view_only">view_only</option>
            <option value="download">download</option>
            <option value="comment">comment</option>
          </select>
          <Input
            type="number"
            min={1}
            value={grantDaysValid}
            onChange={(e) => setGrantDaysValid(e.target.value)}
            placeholder="Days"
            className="col-span-2 h-9 bg-background border-neutral-2"
          />
          <Button onClick={handleGrant} className="col-span-2 gap-2">
            <Plus className="w-4 h-4" /> Grant
          </Button>
        </div>

        {grants.length === 0 ? (
          <p className="text-sm text-neutral-5">No access grants yet.</p>
        ) : (
          <div className="space-y-2">
            {grants.map((g: DataRoomAccessGrant) => (
              <div
                key={g.investorId}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-background border-2 border-neutral-2 rounded-xl p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-1 truncate">{g.investorId}</p>
                  <p className="text-xs text-neutral-5">
                    {g.accessLevel} · granted {new Date(g.grantedAt).toLocaleString()} · expires{' '}
                    {new Date(g.expiresAt).toLocaleString()}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRevoke(g.investorId)} aria-label="Revoke">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-3">
        <h3 className="text-lg font-bold text-neutral-1">Engagement (backend-derived)</h3>
        {!analytics || analytics.totalViews + analytics.totalDownloads === 0 ? (
          <p className="text-sm text-neutral-5">
            No engagement events recorded yet. Numbers will populate as investors view or download documents.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase text-neutral-5">Total views</p>
              <p className="font-bold text-neutral-1">{analytics.totalViews}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-5">Total downloads</p>
              <p className="font-bold text-neutral-1">{analytics.totalDownloads}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-5">Unique investors</p>
              <p className="font-bold text-neutral-1">{analytics.uniqueInvestorsEngaged}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-5">Documents tracked</p>
              <p className="font-bold text-neutral-1">{analytics.documentEngagement.length}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Submitting Phase 6 publishes your data room and sends it for compliance review.
          Investors with valid grants (and a signed NDA if required) can then access documents.
          Verified data-room status is awarded separately after review.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-900">{error}</p>
        </div>
      )}

      <StepFooter
        backUrl="/dashboard/entrepreneur/phase-5"
        onNextClick={handleSubmit}
        isLoading={isSubmitting}
        nextLabel="Publish &amp; Complete Phase 6"
        nextValidationError={error}
        isNextDisabled={docs.length === 0 || missingRequired.length > 0}
      />
    </div>
  );
}

export default function Phase6Page() {
  return (
    <RouteGuard requiredPhase={6}>
      <EntrepreneurLayout sidebar={<div />}>
        <div className="space-y-6 md:space-y-8">
          <PhaseHeader
            title="Data Room Submission"
            subtitle="Upload required documents, manage investor access, and submit for compliance review."
            progressLabel="PROGRESS"
            progressValue="Phase 6 of 9"
            progressPercentage={67}
          />
          <Phase6Content />
        </div>
      </EntrepreneurLayout>
    </RouteGuard>
  );
}
