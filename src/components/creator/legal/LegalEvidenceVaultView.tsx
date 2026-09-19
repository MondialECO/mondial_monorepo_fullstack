'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Unlink,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ArrowRight,
  Upload,
  RefreshCw,
  FolderCheck,
  FileCheck2,
  Info,
  X,
  ChevronRight,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  File,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type {
  LegalComplianceOverview,
  CreatorLegalAssessmentDto,
  ExtendedLegalChecklistItem,
  LegalEvidenceLinkDto,
  LegalEvidenceAuditEntryDto,
  LegalEvidenceStatus,
} from '@/lib/api-creator-journey';
import type { CreatorIdeaDocument } from '@/lib/api-creator-documents';
import { creatorDocumentsApi } from '@/lib/api-creator-documents';

interface LegalEvidenceVaultViewProps {
  ideaId: string;
  overview: LegalComplianceOverview;
  documents: CreatorIdeaDocument[];
  onOpenRequirement: (stage: string, requirementId: string) => void;
  onOpenEvidenceModal: (item: ExtendedLegalChecklistItem) => void;
  onUnlinkEvidence: (requirementId: string, documentId: string) => Promise<void>;
  onUpdateEvidenceStatus: (linkId: string, status: string) => Promise<void>;
  isMutating?: boolean;
}

const STAGE_FILTERS = [
  { key: 'all', label: 'All Stages' },
  { key: 'before_creation', label: 'Before Creation' },
  { key: 'company_creation', label: 'Company Creation' },
  { key: 'before_launch', label: 'Before Launch' },
  { key: 'before_sale', label: 'Before Sale' },
  { key: 'ongoing', label: 'Ongoing' },
];

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All Statuses' },
  { key: 'linked', label: 'Linked' },
  { key: 'needs_review', label: 'Needs Review' },
  { key: 'accepted_for_planning', label: 'Accepted' },
  { key: 'archived', label: 'Archived' },
];

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' · ' +
      d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    );
  } catch {
    return dateStr;
  }
}

function getFileIcon(fileName: string, mimeType?: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf' || mimeType?.includes('pdf')) {
    return <FileText className="w-4 h-4 text-red-500 shrink-0" />;
  }
  if (['xlsx', 'xls', 'csv'].includes(ext) || mimeType?.includes('spreadsheet')) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />;
  }
  if (['zip', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className="w-4 h-4 text-amber-500 shrink-0" />;
  }
  return <File className="w-4 h-4 text-primary shrink-0" />;
}

function getStatusBadge(status?: string) {
  switch (status?.toLowerCase()) {
    case 'accepted_for_planning':
    case 'accepted':
      return (
        <Badge variant="success" className="text-[10px] font-semibold gap-1 py-0.5 px-2">
          <CheckCircle2 className="w-3 h-3" /> Accepted for Planning
        </Badge>
      );
    case 'needs_review':
      return (
        <Badge variant="outline" className="text-[10px] font-semibold gap-1 py-0.5 px-2 text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10">
          <AlertTriangle className="w-3 h-3" /> Needs Review
        </Badge>
      );
    case 'archived':
      return (
        <Badge variant="secondary" className="text-[10px] font-semibold gap-1 py-0.5 px-2 text-muted-foreground">
          Archived
        </Badge>
      );
    case 'replaced':
      return (
        <Badge variant="secondary" className="text-[10px] font-semibold gap-1 py-0.5 px-2 line-through text-muted-foreground">
          Replaced
        </Badge>
      );
    case 'linked':
    default:
      return (
        <Badge variant="outline" className="text-[10px] font-semibold gap-1 py-0.5 px-2 border-primary/40 bg-primary/5 text-primary">
          <FileCheck2 className="w-3 h-3" /> Linked
        </Badge>
      );
  }
}

export function LegalEvidenceVaultView({
  ideaId,
  overview,
  documents,
  onOpenRequirement,
  onOpenEvidenceModal,
  onUnlinkEvidence,
  onUpdateEvidenceStatus,
  isMutating = false,
}: LegalEvidenceVaultViewProps) {
  const assessment = overview.assessment;
  const items: ExtendedLegalChecklistItem[] = assessment?.items || [];
  const applicableItems = useMemo(
    () => items.filter((i) => i.status !== 'not_applicable'),
    [items]
  );

  // Active sub-view tab: 'documents' | 'missing' | 'audit'
  const [activeTab, setActiveTab] = useState<'documents' | 'missing' | 'audit'>('documents');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drawer / Preview state
  const [selectedLink, setSelectedLink] = useState<LegalEvidenceLinkDto | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  // Unlink confirmation state
  const [unlinkConfirmTarget, setUnlinkConfirmTarget] = useState<LegalEvidenceLinkDto | null>(null);

  // Raw evidence links from assessment or reconstructed from items
  const evidenceLinks: LegalEvidenceLinkDto[] = useMemo(() => {
    if (assessment?.evidenceLinks && assessment.evidenceLinks.length > 0) {
      return assessment.evidenceLinks;
    }
    // Fallback synthesis from requirement items if backend hasn't populated links array yet
    const synthLinks: LegalEvidenceLinkDto[] = [];
    applicableItems.forEach((it) => {
      if (it.evidenceDocumentId) {
        const doc = documents.find((d) => d.id === it.evidenceDocumentId);
        synthLinks.push({
          id: `link-${it.id}-${it.evidenceDocumentId}`,
          documentId: it.evidenceDocumentId,
          documentTitle: doc?.title || doc?.fileName || it.evidenceFileName || 'Attached Evidence',
          documentFileName: doc?.fileName || it.evidenceFileName || 'document.pdf',
          mimeType: doc?.mimeType || 'application/pdf',
          sizeBytes: doc?.sizeBytes,
          requirementId: it.id,
          requirementTitle: it.title || it.label,
          stage: it.stage || 'company_creation',
          status: 'linked',
          linkedAt: doc?.createdAt || new Date().toISOString(),
        });
      }
    });
    return synthLinks;
  }, [assessment?.evidenceLinks, applicableItems, documents]);

  // Requirements that expect evidence but have none attached
  const missingEvidenceItems = useMemo(() => {
    return applicableItems.filter(
      (item) => item.requiresEvidence && !item.evidenceDocumentId && !evidenceLinks.some((l) => l.requirementId === item.id)
    );
  }, [applicableItems, evidenceLinks]);

  // Covered requirements count
  const coveredRequirementsCount = useMemo(() => {
    const coveredSet = new Set<string>();
    evidenceLinks.forEach((l) => coveredSet.add(l.requirementId));
    applicableItems.forEach((i) => {
      if (i.evidenceDocumentId) coveredSet.add(i.id);
    });
    return coveredSet.size;
  }, [evidenceLinks, applicableItems]);

  // Attention / review needed count
  const reviewNeededCount = useMemo(() => {
    return evidenceLinks.filter((l) => l.status === 'needs_review').length;
  }, [evidenceLinks]);

  // Unique documents count
  const uniqueDocumentsCount = useMemo(() => {
    const docSet = new Set<string>();
    evidenceLinks.forEach((l) => docSet.add(l.documentId));
    return docSet.size || documents.length;
  }, [evidenceLinks, documents]);

  // Filtered evidence links
  const filteredLinks = useMemo(() => {
    return evidenceLinks.filter((link) => {
      // Stage filter
      if (stageFilter !== 'all' && link.stage !== stageFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && link.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = link.documentTitle?.toLowerCase().includes(q);
        const matchFile = link.documentFileName?.toLowerCase().includes(q);
        const matchReq = link.requirementTitle?.toLowerCase().includes(q);
        if (!matchTitle && !matchFile && !matchReq) return false;
      }
      return true;
    });
  }, [evidenceLinks, stageFilter, statusFilter, searchQuery]);

  // Filtered missing requirements
  const filteredMissingItems = useMemo(() => {
    return missingEvidenceItems.filter((item) => {
      if (stageFilter !== 'all' && item.stage !== stageFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.title || item.label).toLowerCase().includes(q);
        const matchReason = item.whyItApplies?.toLowerCase().includes(q);
        const matchLabel = item.evidenceLabel?.toLowerCase().includes(q);
        if (!matchTitle && !matchReason && !matchLabel) return false;
      }
      return true;
    });
  }, [missingEvidenceItems, stageFilter, searchQuery]);

  // Audit trail entries
  const auditTrail: LegalEvidenceAuditEntryDto[] = useMemo(() => {
    return assessment?.evidenceAuditTrail || [];
  }, [assessment?.evidenceAuditTrail]);

  // Download document handler
  const handleDownload = async (docId: string, fileName: string) => {
    try {
      setDownloadingDocId(docId);
      const blob = await creatorDocumentsApi.download(ideaId, docId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download document:', err);
    } finally {
      setDownloadingDocId(null);
    }
  };

  const openDrawerForLink = (link: LegalEvidenceLinkDto) => {
    setSelectedLink(link);
    setIsDrawerOpen(true);
  };

  const handleConfirmUnlink = async () => {
    if (!unlinkConfirmTarget) return;
    try {
      await onUnlinkEvidence(unlinkConfirmTarget.requirementId, unlinkConfirmTarget.documentId);
      setUnlinkConfirmTarget(null);
      if (selectedLink?.id === unlinkConfirmTarget.id) {
        setIsDrawerOpen(false);
        setSelectedLink(null);
      }
    } catch (err) {
      console.error('Failed to unlink evidence:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP OVERVIEW SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border/80 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-caption text-muted-foreground font-medium">Evidence Documents</span>
            <FolderCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {uniqueDocumentsCount}
          </div>
          <p className="text-[11px] text-muted-foreground">Stored in project vault</p>
        </Card>

        <Card className="p-4 bg-card border-border/80 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-caption text-muted-foreground font-medium">Requirements Covered</span>
            <ShieldCheck className="w-4 h-4 text-success-text" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {coveredRequirementsCount}
          </div>
          <p className="text-[11px] text-muted-foreground">With active evidence proof</p>
        </Card>

        <Card className="p-4 bg-card border-border/80 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-caption text-muted-foreground font-medium">Missing Evidence</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {missingEvidenceItems.length}
          </div>
          <p className="text-[11px] text-muted-foreground">Required files pending upload</p>
        </Card>

        <Card className="p-4 bg-card border-border/80 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-caption text-muted-foreground font-medium">Needs Attention</span>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {reviewNeededCount}
          </div>
          <p className="text-[11px] text-muted-foreground">Documents flagged for review</p>
        </Card>
      </div>

      {/* 2. SUB-VIEW SELECTOR TABS & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-border/70 pb-4">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
              activeTab === 'documents'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText className="w-3.5 h-3.5" /> Evidence Documents
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-0.5">
              {evidenceLinks.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('missing')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
              activeTab === 'missing'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Missing Evidence
            {missingEvidenceItems.length > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-0.5 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                {missingEvidenceItems.length}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
              activeTab === 'audit'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Clock className="w-3.5 h-3.5" /> Activity Audit Trail
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-0.5">
              {auditTrail.length}
            </Badge>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents or requirements..."
            className="pl-8 h-8 text-xs rounded-xl bg-card border-border"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. FILTER CHIPS (FOR DOCUMENTS & MISSING) */}
      {activeTab !== 'audit' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Stage:
          </span>
          {STAGE_FILTERS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStageFilter(s.key)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-lg border transition-colors',
                stageFilter === s.key
                  ? 'bg-primary text-primary-foreground border-primary font-medium shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-border/80'
              )}
            >
              {s.label}
            </button>
          ))}

          {activeTab === 'documents' && (
            <>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 ml-3 mr-1">
                Status:
              </span>
              {STATUS_FILTERS.map((st) => (
                <button
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-lg border transition-colors',
                    statusFilter === st.key
                      ? 'bg-secondary text-secondary-foreground border-secondary-foreground/20 font-medium'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {st.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4A. VIEW 1: EVIDENCE DOCUMENTS (DESKTOP TABLE + MOBILE CARDS)             */}
      {/* ========================================================================= */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {filteredLinks.length === 0 ? (
            <Card className="p-10 border border-dashed border-border rounded-2xl bg-card text-center space-y-3 max-w-lg mx-auto">
              <FolderCheck className="w-10 h-10 text-muted-foreground/60 mx-auto" />
              <h3 className="text-sm font-bold text-foreground">No evidence documents found</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {evidenceLinks.length === 0
                  ? 'You have not attached legal evidence yet. Attach documents directly as you progress through your France legal roadmap.'
                  : 'No documents match the active filter criteria. Try resetting stage or status filters.'}
              </p>
              {evidenceLinks.length === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('missing')}
                  className="text-xs rounded-xl gap-1.5 mx-auto border-border"
                >
                  View Missing Evidence Requirements
                </Button>
              )}
            </Card>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                      <th className="py-3 px-4">Document</th>
                      <th className="py-3 px-4">Linked Requirement</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Uploaded</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredLinks.map((link) => {
                      const doc = documents.find((d) => d.id === link.documentId);

                      return (
                        <tr
                          key={link.id}
                          className="hover:bg-muted/15 transition-colors group"
                        >
                          {/* Document Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {getFileIcon(link.documentFileName, link.mimeType)}
                              <div className="min-w-0">
                                <span className="font-bold text-foreground block truncate max-w-[200px]">
                                  {link.documentTitle || link.documentFileName}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono block">
                                  {link.documentFileName} · {formatBytes(link.sizeBytes || doc?.sizeBytes)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Linked Requirement */}
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => onOpenRequirement(link.stage, link.requirementId)}
                              className="text-left group-hover:text-primary transition-colors block max-w-[220px]"
                            >
                              <span className="font-semibold text-foreground hover:underline truncate block">
                                {link.requirementTitle}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {link.requirementId}
                              </span>
                            </button>
                          </td>

                          {/* Stage */}
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[10px] font-mono capitalize bg-muted/20">
                              {link.stage.replace(/_/g, ' ')}
                            </Badge>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {getStatusBadge(link.status)}
                          </td>

                          {/* Upload Date */}
                          <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                            {formatDate(link.linkedAt)}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDrawerForLink(link)}
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                                title="Preview Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownload(link.documentId, link.documentFileName)}
                                disabled={downloadingDocId === link.documentId}
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                                title="Download Document"
                              >
                                <Download className={cn('w-3.5 h-3.5', downloadingDocId === link.documentId && 'animate-bounce')} />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setUnlinkConfirmTarget(link)}
                                disabled={isMutating}
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Unlink Evidence from Requirement"
                              >
                                <Unlink className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredLinks.map((link) => {
                  const doc = documents.find((d) => d.id === link.documentId);
                  return (
                    <Card key={link.id} className="p-4 rounded-2xl border-border bg-card space-y-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getFileIcon(link.documentFileName, link.mimeType)}
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-foreground truncate">
                              {link.documentTitle || link.documentFileName}
                            </h4>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {formatBytes(link.sizeBytes || doc?.sizeBytes)} · {formatDate(link.linkedAt)}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(link.status)}
                      </div>

                      {/* Linked requirement */}
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-[11px] space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Linked Requirement:
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenRequirement(link.stage, link.requirementId)}
                          className="font-bold text-foreground hover:text-primary text-left block truncate w-full"
                        >
                          {link.requirementTitle}
                        </button>
                      </div>

                      {/* Card actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDrawerForLink(link)}
                          className="rounded-xl text-xs h-7 gap-1 border-border"
                        >
                          <Eye className="w-3 h-3" /> View Details
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(link.documentId, link.documentFileName)}
                            className="rounded-lg text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" /> Download
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setUnlinkConfirmTarget(link)}
                            className="rounded-lg text-xs h-7 px-2 text-destructive hover:bg-destructive/10"
                          >
                            <Unlink className="w-3.5 h-3.5 mr-1" /> Unlink
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4B. VIEW 2: MISSING EVIDENCE REQUIREMENTS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'missing' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              These statutory requirements are identified as applicable to your venture and expect evidentiary documentation.
            </span>
          </div>

          {filteredMissingItems.length === 0 ? (
            <Card className="p-10 border border-dashed border-border rounded-2xl bg-card text-center space-y-3 max-w-lg mx-auto">
              <CheckCircle2 className="w-10 h-10 text-success-text mx-auto" />
              <h3 className="text-sm font-bold text-foreground">All expected evidence attached!</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every requirement expecting documentation currently has evidence linked.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMissingItems.map((item) => (
                <Card
                  key={item.id}
                  className="p-5 rounded-2xl border-border bg-card shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-mono uppercase bg-muted/20">
                          {item.id}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {item.stage?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      {item.priority === 'critical' && (
                        <Badge variant="destructive" className="text-[10px] uppercase py-0 px-1.5">
                          Critical
                        </Badge>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-foreground">
                      {item.title || item.label}
                    </h4>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.whyItApplies}
                    </p>

                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Expected Evidence:
                      </span>
                      <span className="font-medium text-foreground block">
                        {item.evidenceLabel || item.evidenceDocType || 'Supporting document or official extract'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onOpenRequirement(item.stage || 'company_creation', item.id)}
                      className="text-xs rounded-xl h-8 px-3 text-muted-foreground hover:text-foreground"
                    >
                      Open in Roadmap <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => onOpenEvidenceModal(item)}
                      className="text-xs rounded-xl h-8 px-3 gap-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium shadow-none"
                    >
                      <Upload className="w-3 h-3" /> Attach Evidence
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4C. VIEW 3: ACTIVITY AUDIT TRAIL TIMELINE                                 */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-muted/40 border border-border/60 rounded-2xl flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Verified evidence operations trail for Creator Phase 3. Real timestamps recorded on-chain in MongoDB.
            </span>
            <span className="font-mono font-semibold">{auditTrail.length} Total Events</span>
          </div>

          {auditTrail.length === 0 ? (
            <Card className="p-10 border border-dashed border-border rounded-2xl bg-card text-center space-y-3 max-w-lg mx-auto">
              <Clock className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <h3 className="text-sm font-bold text-foreground">No activity recorded yet</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When you attach, unlink, or update evidence documents, chronological compliance records will appear here.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {auditTrail.slice().reverse().map((entry) => {
                const isLinked = entry.action === 'linked';
                const isUnlinked = entry.action === 'unlinked';
                const isStatus = entry.action === 'status_changed';

                return (
                  <div
                    key={entry.id}
                    className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm flex items-start gap-3.5 text-xs transition-colors hover:border-border"
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                        isLinked && 'bg-success-light/20 text-success-text',
                        isUnlinked && 'bg-destructive/10 text-destructive',
                        isStatus && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                        !isLinked && !isUnlinked && !isStatus && 'bg-primary/10 text-primary'
                      )}
                    >
                      {isLinked && <FileCheck2 className="w-4 h-4" />}
                      {isUnlinked && <Unlink className="w-4 h-4" />}
                      {isStatus && <Clock className="w-4 h-4" />}
                      {!isLinked && !isUnlinked && !isStatus && <FileText className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-mono py-0 px-1.5">
                            {entry.action.replace(/_/g, ' ')}
                          </Badge>
                          <span className="font-bold text-foreground">
                            {entry.documentTitle}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {formatDateTime(entry.timestamp)}
                        </span>
                      </div>

                      <p className="text-muted-foreground leading-relaxed">
                        {entry.detail}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                        {entry.requirementTitle && (
                          <span className="truncate">
                            Requirement: <strong className="text-foreground">{entry.requirementTitle}</strong>
                          </span>
                        )}
                        {entry.requirementId && (
                          <span className="font-mono">({entry.requirementId})</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DOCUMENT PREVIEW & DETAILS DRAWER (SLIDE-OVER)                         */}
      {/* ========================================================================= */}
      {isDrawerOpen && selectedLink && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div
            className="w-full max-w-md bg-card border-l border-border h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right-full duration-200"
          >
            {/* Drawer Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm text-foreground">Evidence Document Details</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Document Overview */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-3">
                <div className="flex items-start gap-3">
                  {getFileIcon(selectedLink.documentFileName, selectedLink.mimeType)}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-foreground break-all">
                      {selectedLink.documentTitle}
                    </h3>
                    <span className="text-xs text-muted-foreground font-mono block mt-0.5">
                      {selectedLink.documentFileName}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">File Size</span>
                    <span className="font-mono font-medium">{formatBytes(selectedLink.sizeBytes)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Uploaded</span>
                    <span className="font-mono font-medium">{formatDate(selectedLink.linkedAt)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleDownload(selectedLink.documentId, selectedLink.documentFileName)}
                  disabled={downloadingDocId === selectedLink.documentId}
                  className="w-full text-xs rounded-xl h-8 gap-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium shadow-none mt-2"
                >
                  <Download className="w-3.5 h-3.5" /> Download File
                </Button>
              </div>

              {/* Linked Requirement Section */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Associated Legal Requirement
                </span>
                <div className="p-4 rounded-2xl bg-card border border-border space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-mono uppercase bg-muted/20">
                      {selectedLink.requirementId}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {selectedLink.stage.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-xs text-foreground">
                    {selectedLink.requirementTitle}
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenRequirement(selectedLink.stage, selectedLink.requirementId);
                    }}
                    className="w-full text-xs rounded-xl h-8 gap-1.5 border-border"
                  >
                    Open in Legal Roadmap <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </Button>
                </div>
              </div>

              {/* Status Management */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Evidence Status
                </span>
                <div className="p-3.5 rounded-2xl bg-muted/20 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Current Status:</span>
                    {getStatusBadge(selectedLink.status)}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(['linked', 'needs_review', 'accepted_for_planning', 'archived'] as LegalEvidenceStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => onUpdateEvidenceStatus(selectedLink.id, st)}
                        className={cn(
                          'text-[11px] px-2 py-1 rounded-lg border capitalize transition-colors',
                          selectedLink.status === st
                            ? 'bg-primary text-primary-foreground border-primary font-medium'
                            : 'bg-card border-border text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {st.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-6 border-t border-border space-y-2">
              <Button
                variant="destructive"
                onClick={() => setUnlinkConfirmTarget(selectedLink)}
                className="w-full text-xs rounded-xl h-9 gap-1.5"
              >
                <Unlink className="w-3.5 h-3.5" /> Unlink From Requirement
              </Button>
              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                Unlinking removes this file from this legal requirement. The original file remains safely stored in your project vault.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. UNLINK CONFIRMATION MODAL                                              */}
      {/* ========================================================================= */}
      {unlinkConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <Card className="max-w-md w-full p-6 rounded-2xl border-border bg-card shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Unlink className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Unlink Legal Evidence</h3>
                <span className="text-xs text-muted-foreground">Confirm removal of proof linkage</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to unlink <strong className="text-foreground">{unlinkConfirmTarget.documentFileName}</strong> from the statutory requirement <strong className="text-foreground">{unlinkConfirmTarget.requirementTitle}</strong>?
            </p>

            <div className="p-3 bg-muted/30 rounded-xl border border-border/60 text-[11px] text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground block">Zero Data Loss Guarantee:</span>
              <span>
                The physical document will <strong>NOT</strong> be deleted. It will remain in your project documents vault for future use or attachment to other requirements.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUnlinkConfirmTarget(null)}
                className="text-xs rounded-xl h-8 px-4"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmUnlink}
                disabled={isMutating}
                className="text-xs rounded-xl h-8 px-4 gap-1.5"
              >
                {isMutating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Unlink className="w-3.5 h-3.5" />
                )}
                Confirm Unlink
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
