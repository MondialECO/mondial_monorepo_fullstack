'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/_providers/AuthProvider';
import {
  submitUserPrivacyRequest,
  getMyPrivacyRequests,
} from '@/lib/api-admin-security';
import { PrivacyRequest } from '@/types/admin-security-compliance';
import {
  Shield,
  FileText,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Plus,
  Lock,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function UserPrivacyCenterPage() {
  const { user } = useAuth();

  const [myRequests, setMyRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Submit Modal
  const [isSubmitOpen, setIsSubmitOpen] = useState<boolean>(false);
  const [requestType, setRequestType] = useState<string>('DataExport');
  const [requestDetails, setRequestDetails] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyPrivacyRequests();
      setMyRequests(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load your privacy requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSubmitError(null);
      await submitUserPrivacyRequest({
        requestType,
        details: requestDetails.trim(),
      });

      setIsSubmitOpen(false);
      setRequestDetails('');
      setSubmitSuccess('Your privacy request has been submitted to the data protection team.');
      fetchMyRequests();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setSubmitError('You already have an active request of this type in progress.');
      } else {
        setSubmitError(err?.response?.data?.message || 'Failed to submit request.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Open</Badge>;
      case 'UnderReview':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Under Review</Badge>;
      case 'Completed':
        return <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Completed</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Privacy & Data Center</h1>
              <p className="text-sm text-muted-foreground">
                Exercise your data subject rights: request personal data exports, account deletion, or corrections
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMyRequests}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsSubmitOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Submit Privacy Request
          </Button>
        </div>
      </div>

      {submitSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{submitSuccess}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSubmitSuccess(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg w-fit mb-2">
              <Download className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-semibold">Data Export (GDPR Art. 20)</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Request a portable machine-readable export of your profile, projects, proposals, transactions, and reviews.
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg w-fit mb-2">
              <Trash2 className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-semibold">Account Deletion / Anonymization</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Request removal of personal identifying data. Note: Active contracts, open disputes, or pending payouts must be completed first.
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg w-fit mb-2">
              <Lock className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-semibold">Data Protection Policy</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Mondial ECO strictly restricts administrative access and enforces audit logs on all data interactions.
          </CardContent>
        </Card>
      </div>

      {/* My Requests Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="py-4 border-b border-border/40">
          <CardTitle className="text-base font-semibold">My Privacy Requests</CardTitle>
          <CardDescription className="text-xs">
            Track the real-time status and download fulfilled data exports
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading your requests...
            </div>
          ) : myRequests.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              You have not submitted any privacy requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20 text-muted-foreground">
                    <th className="py-3.5 px-4 font-medium">Request Type</th>
                    <th className="py-3.5 px-4 font-medium">Status</th>
                    <th className="py-3.5 px-4 font-medium">Submitted Date</th>
                    <th className="py-3.5 px-4 font-medium">Completed Date</th>
                    <th className="py-3.5 px-4 font-medium">Details / Outcome</th>
                    <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {myRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {req.requestType}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        {req.completedAt ? new Date(req.completedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-muted-foreground">
                        {req.rejectionReason ? (
                          <span className="text-destructive font-medium">Rejected: {req.rejectionReason}</span>
                        ) : req.details || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {req.status === 'Completed' && req.exportDownloadUrl && (
                          <a
                            href={req.exportDownloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline bg-primary/10 px-2.5 py-1 rounded-md"
                          >
                            <Download className="w-3.5 h-3.5" /> Download Export
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Request Modal */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Submit Privacy Request
              </DialogTitle>
              <DialogDescription>
                Select your request type. The data protection team will review and fulfill within standard compliance timelines.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {submitError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Request Type</label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DataExport">Data Export (JSON Archive)</SelectItem>
                    <SelectItem value="DataAccess">Data Access Review</SelectItem>
                    <SelectItem value="Correction">Information Correction</SelectItem>
                    <SelectItem value="AccountDeletion">Account Deletion / Anonymization</SelectItem>
                    <SelectItem value="OtherPrivacyRequest">Other Privacy Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Specific Details or Instructions</label>
                <Textarea
                  placeholder="Provide any context, specific fields to correct, or reasons for your request..."
                  value={requestDetails}
                  onChange={(e) => setRequestDetails(e.target.value)}
                  rows={3}
                />
              </div>

              {requestType === 'AccountDeletion' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Account Deletion Notice:</strong> Active workroom contracts, open dispute tickets, or pending payout balances must be settled before deletion can be processed.
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsSubmitOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex items-center gap-2">
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
