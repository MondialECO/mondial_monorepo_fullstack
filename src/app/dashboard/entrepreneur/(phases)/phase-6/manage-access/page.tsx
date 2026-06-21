'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Lock, Plus, Trash2 } from 'lucide-react';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import entrepreneurApi, { DataRoomAccessGrant, DataRoomStatusResponse } from '@/lib/api-entrepreneur';

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
  border: 'var(--dr-border)',
  borderLight: 'var(--dr-border-light)',
};
const SHADOW_BLUR = '-2px -1px 17px 0px rgba(0,0,0,0.02), 1px 2px 3px 0px rgba(0,0,0,0.04)';

function ManageAccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');

  const [status, setStatus] = useState<DataRoomStatusResponse | null>(null);
  const [grantInvestorEmail, setGrantInvestorEmail] = useState('');
  const [grantAccessLevel, setGrantAccessLevel] = useState('view_only');
  const [grantDaysValid, setGrantDaysValid] = useState('30');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      if (!companyId) throw new Error('No company ID');
      const s = await entrepreneurApi.getDataRoom(companyId);
      setStatus(s);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load data';
      console.error('loadData error:', e);
      setError(msg);
    }
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void loadData();
  }, [companyId, loadData]);

  const handleGrant = async () => {
    setError('');
    const email = grantInvestorEmail.trim();
    if (!email) { setError('Investor email required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address'); return; }
    if (!companyId) { setError('No company ID'); return; }

    const days = parseInt(grantDaysValid, 10);
    if (!Number.isFinite(days) || days <= 0) { setError('Days valid must be > 0'); return; }

    setIsLoading(true);
    try {
      await entrepreneurApi.grantDataRoomAccess(companyId, email, grantAccessLevel, days);
      setGrantInvestorEmail('');
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Grant failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (investorId: string) => {
    setError('');
    if (!companyId) { setError('No company ID'); return; }

    setIsLoading(true);
    try {
      await entrepreneurApi.revokeDataRoomAccess(companyId, investorId);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revoke failed');
    } finally {
      setIsLoading(false);
    }
  };

  const grants = status?.accessGrants ?? [];
  const ndaActive = status?.ndaRequired ?? false;
  const ndaLocked = !!status?.ndaLockedAt;

  const cardStyle = {
    backgroundColor: C.bgCard,
    border: `2px solid ${C.bgWhite}`,
    boxShadow: SHADOW_BLUR,
  };
  const headerStyle = {
    backgroundColor: C.bgBlue,
    borderBottom: `1px solid ${C.border}`,
    padding: '16px 20px',
  };
  const inputStyle = {
    border: `1px solid ${C.border}`,
    backgroundColor: C.bgWhite,
    padding: '10px 12px',
    fontSize: 14,
    color: C.textPrimary,
  };

  return (
    <div className="flex flex-col gap-6" style={{ backgroundColor: C.bgPage }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, backgroundColor: C.bgWhite, border: `1px solid ${C.border}` }}
        >
          <ArrowLeft size={18} style={{ color: C.textSecondary }} />
        </button>
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold" style={{ fontSize: 28, lineHeight: '36px', color: C.textPrimary }}>
            Manage Data Room Access
          </h1>
          <p style={{ fontSize: 14, color: C.textSecondary }}>
            View and manage all investor access to your data room.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl p-4" style={{ backgroundColor: 'rgba(220,38,38,0.1)', border: '2px solid rgba(220,38,38,0.3)' }}>
          <AlertCircle size={20} style={{ color: '#dc2626', marginTop: 2 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Grant New Access */}
        <div className="flex flex-col overflow-hidden rounded-xl lg:w-[360px] lg:shrink-0" style={cardStyle}>
          <div style={headerStyle}>
            <span className="font-semibold" style={{ fontSize: 16, color: C.textPrimary }}>Grant New Access</span>
          </div>
          <div className="flex flex-col gap-3" style={{ padding: 20 }}>
            <div className="flex flex-col gap-1">
              <label htmlFor="investor-email" style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary }}>Investor Email</label>
              <input
                id="investor-email"
                type="email"
                value={grantInvestorEmail}
                onChange={(e) => setGrantInvestorEmail(e.target.value)}
                placeholder="investor@example.com"
                className="rounded-lg"
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="access-level" style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary }}>Access level</label>
              <select
                id="access-level"
                value={grantAccessLevel}
                onChange={(e) => setGrantAccessLevel(e.target.value)}
                className="rounded-lg"
                style={inputStyle}
              >
                <option value="view_only">View Only</option>
                <option value="download">Download</option>
                <option value="comment">Comment</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="days-valid" style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary }}>Days valid</label>
              <input
                id="days-valid"
                type="number"
                min={1}
                value={grantDaysValid}
                onChange={(e) => setGrantDaysValid(e.target.value)}
                placeholder="30"
                className="rounded-lg"
                style={inputStyle}
              />
            </div>
            <button
              type="button"
              onClick={handleGrant}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg disabled:opacity-60"
              style={{ backgroundColor: C.primary, padding: '10px 16px', fontSize: 14, fontWeight: 600, color: '#f7f7f7' }}
            >
              <Plus size={16} />
              {isLoading ? 'Granting…' : 'Grant Access'}
            </button>

            {/* NDA status */}
            {status && (
              <div className="mt-1 flex items-center gap-2 rounded-lg" style={{ backgroundColor: ndaActive ? C.bgGreen : C.bgYellow, padding: '8px 12px' }}>
                <Lock size={14} style={{ color: ndaActive ? C.green : C.yellow }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: ndaActive ? C.green : C.yellow }}>
                  NDA {ndaActive ? 'required' : 'not required'}
                  {ndaLocked && ' · locked (investor signed)'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Investor Access list */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl" style={cardStyle}>
          <div className="flex items-center justify-between" style={headerStyle}>
            <span className="font-semibold" style={{ fontSize: 16, color: C.textPrimary }}>Investor Access</span>
            <span className="rounded-lg font-semibold" style={{ backgroundColor: C.bgBlue, border: `1px solid ${C.border}`, padding: '4px 12px', fontSize: 13, color: C.primary }}>
              {grants.length} investor{grants.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex flex-col" style={{ padding: 16 }}>
            {grants.length === 0 ? (
              <p className="text-center" style={{ fontSize: 14, color: C.textMuted, paddingTop: 24, paddingBottom: 24 }}>
                No investors have access yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {grants.map((g: DataRoomAccessGrant) => {
                  const name = g.investorName || g.investorId;
                  const initials = name.slice(0, 2).toUpperCase();
                  const isExpired = new Date(g.expiresAt) < new Date();
                  return (
                    <div
                      key={g.investorId}
                      className="flex items-center gap-3 rounded-xl"
                      style={{ backgroundColor: C.bgWhite, border: `1px solid ${C.border}`, padding: 16 }}
                    >
                      <div
                        className="flex shrink-0 items-center justify-center rounded-full font-semibold"
                        style={{ width: 44, height: 44, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryToggle})`, color: '#fff', fontSize: 15 }}
                      >
                        {initials}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-semibold" style={{ fontSize: 15, color: C.textPrimary }}>{name}</span>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5" style={{ fontSize: 12, color: C.textSecondary }}>
                          <span className="capitalize">{g.accessLevel}</span>
                          <span>·</span>
                          <span>Granted {new Date(g.grantedAt).toLocaleDateString()}</span>
                          <span>·</span>
                          <span>Expires {new Date(g.expiresAt).toLocaleDateString()}</span>
                          {isExpired && (
                            <span className="inline-flex items-center gap-1 rounded-full" style={{ backgroundColor: C.bgYellow, padding: '1px 8px', fontWeight: 500, color: C.yellow }}>
                              <Lock size={10} /> Expired
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevoke(g.investorId)}
                        disabled={isLoading}
                        aria-label="Revoke access"
                        className="flex shrink-0 items-center justify-center rounded-lg disabled:opacity-60"
                        style={{ width: 36, height: 36, border: `1px solid ${C.border}`, backgroundColor: C.bgCard }}
                      >
                        <Trash2 size={16} style={{ color: C.textSecondary }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManageAccessPage() {
  return (
    <RouteGuard requiredPhase={6}>
      <ManageAccessContent />
    </RouteGuard>
  );
}
