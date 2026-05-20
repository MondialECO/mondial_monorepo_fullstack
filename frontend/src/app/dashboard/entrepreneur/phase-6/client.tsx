'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Trash2, Lock, Unlock, Users, FileText } from 'lucide-react';
import { entrepreneurApi } from '@/lib/api-entrepreneur';

interface Document {
  id: string;
  fileName: string;
  uploadedAt: string;
  size: number;
  url: string;
}

interface InvestorAccess {
  id: string;
  investorName: string;
  investorEmail: string;
  accessLevel: string;
  grantedAt: string;
  expiresAt?: string;
}

export default function DataRoomClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [investorAccess, setInvestorAccess] = useState<InvestorAccess[]>([]);
  const [ndaRequired, setNdaRequired] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [investorEmail, setInvestorEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('view');
  const [companyId, setCompanyId] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('companyId') || '';
    setCompanyId(id);

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await entrepreneurApi.getDataRoom(id);
        setDocuments(data.documents || []);
        setInvestorAccess(data.investorAccess || []);
        setNdaRequired(data.ndaRequired || false);
      } catch (err) {
        setError('Failed to load data room');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(0);
      const timer = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 200);

      const newDoc = await entrepreneurApi.uploadDataRoomDocument(companyId, formData);
      clearInterval(timer);
      setUploadProgress(100);

      setDocuments([...documents, newDoc]);
      setTimeout(() => setUploadProgress(0), 500);
    } catch (err) {
      setError('Upload failed');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await fetch(`/api/dataroom/documents/${docId}`, { method: 'DELETE' });
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (err) {
      setError('Failed to delete document');
      console.error(err);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investorEmail.trim()) {
      setError('Please enter an investor email');
      return;
    }

    try {
      const access = await entrepreneurApi.grantDataRoomAccess(
        companyId,
        investorEmail,
        accessLevel,
        30
      );
      setInvestorAccess([...investorAccess, access]);
      setInvestorEmail('');
      setAccessLevel('view');
    } catch (err) {
      setError('Failed to grant access');
      console.error(err);
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    try {
      await entrepreneurApi.revokeDataRoomAccess(companyId, accessId);
      setInvestorAccess(investorAccess.filter((a) => a.id !== accessId));
    } catch (err) {
      setError('Failed to revoke access');
      console.error(err);
    }
  };

  const handleNdaToggle = async () => {
    try {
      await entrepreneurApi.updateNdaRequirement(companyId, !ndaRequired);
      setNdaRequired(!ndaRequired);
    } catch (err) {
      setError('Failed to update NDA requirement');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-neutral-1 mb-2">Data Room</h1>
          <p className="text-neutral-5">Manage secure documents and investor access</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-neutral-2 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm text-neutral-5">Documents</span>
            </div>
            <p className="text-3xl font-bold text-neutral-1">{documents.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-2 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm text-neutral-5">Investors</span>
            </div>
            <p className="text-3xl font-bold text-neutral-1">{investorAccess.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-2 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-primary" />
              <span className="text-sm text-neutral-5">NDA Required</span>
            </div>
            <p className="text-3xl font-bold text-neutral-1">{ndaRequired ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg border-2 border-dashed border-neutral-2 p-8 text-center">
          <Upload className="w-12 h-12 text-neutral-5 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-neutral-1 mb-2">Upload Documents</h3>
          <p className="text-sm text-neutral-5 mb-4">Drag and drop files or click to select</p>
          <label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
            />
            <Button disabled={isUploading} asChild className="cursor-pointer">
              <span>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Select Files
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        {/* Documents List */}
        <div className="bg-white rounded-lg border border-neutral-2">
          <div className="p-6 border-b border-neutral-2">
            <h2 className="text-xl font-semibold text-neutral-1">Uploaded Documents</h2>
          </div>
          <div className="divide-y divide-neutral-2">
            {documents.length === 0 ? (
              <div className="p-6 text-center text-neutral-5">
                <p>No documents uploaded yet</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-neutral-50">
                  <div className="flex-1">
                    <p className="font-medium text-neutral-1">{doc.fileName}</p>
                    <p className="text-sm text-neutral-5">
                      {new Date(doc.uploadedAt).toLocaleDateString()} •{' '}
                      {(doc.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-2 text-neutral-5 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Investor Access Management */}
        <div className="bg-white rounded-lg border border-neutral-2">
          <div className="p-6 border-b border-neutral-2">
            <h2 className="text-xl font-semibold text-neutral-1">Investor Access</h2>
          </div>

          {/* Grant Access Form */}
          <form onSubmit={handleGrantAccess} className="p-6 border-b border-neutral-2 space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Investor email"
                value={investorEmail}
                onChange={(e) => setInvestorEmail(e.target.value)}
                className="flex-1"
              />
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="px-4 py-2 border border-neutral-2 rounded-md text-sm"
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit">Grant Access</Button>
            </div>
          </form>

          {/* Access List */}
          <div className="divide-y divide-neutral-2">
            {investorAccess.length === 0 ? (
              <div className="p-6 text-center text-neutral-5">
                <p>No investors have access yet</p>
              </div>
            ) : (
              investorAccess.map((access) => (
                <div key={access.id} className="p-4 flex items-center justify-between hover:bg-neutral-50">
                  <div className="flex-1">
                    <p className="font-medium text-neutral-1">{access.investorName}</p>
                    <p className="text-sm text-neutral-5">
                      {access.investorEmail} • {access.accessLevel}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeAccess(access.id)}
                    className="p-2 text-neutral-5 hover:text-red-600 transition"
                  >
                    <Unlock className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* NDA Settings */}
        <div className="bg-white rounded-lg border border-neutral-2 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-1">Require NDA</h3>
              <p className="text-sm text-neutral-5">Investors must sign NDA before accessing documents</p>
            </div>
            <button
              onClick={handleNdaToggle}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                ndaRequired
                  ? 'bg-primary text-white'
                  : 'bg-neutral-3 text-neutral-1'
              }`}
            >
              {ndaRequired ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 justify-between">
          <Button variant="outline" onClick={() => router.push('/dashboard/entrepreneur')}>
            Back to Dashboard
          </Button>
          <Button onClick={() => router.push('/dashboard/entrepreneur/phase-7')}>
            Continue to Phase 7
          </Button>
        </div>
      </div>
    </div>
  );
}
