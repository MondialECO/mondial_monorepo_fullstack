import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SpTagInput } from '@/components/serviceprovider/ui';
import { financialTaxForm } from '@/components/serviceprovider/earnings/FinancialSettingsPanel';
import { ProposalEarningsPreview } from '@/components/serviceprovider/leads/ProposalEditor';
import { isMenuHrefActive } from '@/components/layout/AppSidebar';
import { menu } from '@/lib/menu';
import { UserRole } from '@/lib/roles';
import { hasFormChanged, useSpDirtyFormGuard } from '@/hooks/useSpDirtyFormGuard';
import { runAvailabilityMutation } from '@/hooks/useProviderAvailabilityControl';
import { safeHttpUrl, validateHttpUrlList, validateOptionalHttpUrl } from '@/lib/service-provider/url-security';
import type { ProviderCapacity } from '@/types/service-catalog';

function DirtyHarness() {
  const [value, setValue] = useState('saved');
  const guard = useSpDirtyFormGuard({ value });
  return <div>
    <label htmlFor="dirty-value">Value</label>
    <input id="dirty-value" value={value} onChange={(event) => setValue(event.target.value)} />
    <output>{guard.dirty ? 'dirty' : 'clean'}</output>
    <button type="button" onClick={() => guard.markClean()}>Save</button>
    <a href="/dashboard/serviceprovider/services">Leave</a>
  </div>;
}

function StructuredDirtyHarness({ baseline, changed }: { baseline: Record<string, unknown>; changed: Record<string, unknown> }) {
  const [value, setValue] = useState(baseline);
  const guard = useSpDirtyFormGuard(value);
  return <div>
    <button type="button" onClick={() => setValue(changed)}>Change form</button>
    <output>{guard.dirty ? 'dirty' : 'clean'}</output>
    <a href="/dashboard/serviceprovider">Leave editor</a>
  </div>;
}

describe('Service Provider dirty-form guard', () => {
  it.each([
    ['Profile', { headline: 'Designer', skills: ['UX'] }, { headline: 'Lead designer', skills: ['UX'] }],
    ['Catalog listing', { title: 'Audit', industries: ['SaaS'] }, { title: 'Audit', industries: ['Fintech'] }],
    ['Catalog package', { price: 1200, deliverables: ['Report'] }, { price: 1500, deliverables: ['Report'] }],
    ['Proposal', { title: 'Proposal', attachments: [] }, { title: 'Proposal', attachments: ['https://example.com/file'] }],
    ['Financial settings', { legalName: 'Maya Ltd', vatRegistered: false }, { legalName: 'Maya Ltd', vatRegistered: true }],
  ])('detects actual %s changes', (_name, baseline, changed) => {
    expect(hasFormChanged(baseline, baseline)).toBe(false);
    expect(hasFormChanged(changed, baseline)).toBe(true);
  });

  it.each([
    ['Profile editor', { headline: 'Designer' }, { headline: 'Lead designer' }],
    ['Catalog editor', { title: 'Audit' }, { title: 'Research audit' }],
    ['Proposal editor', { coverMessage: 'Hello' }, { coverMessage: 'Hello client' }],
    ['Financial Settings', { countryCode: 'BD' }, { countryCode: 'FR' }],
  ])('warns before navigation from a changed %s', async (_name, baseline, changed) => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<StructuredDirtyHarness baseline={baseline} changed={changed} />);
    await user.click(screen.getByRole('button', { name: 'Change form' }));
    await user.click(screen.getByRole('link', { name: 'Leave editor' }));
    expect(screen.getByText('dirty')).toBeInTheDocument();
    expect(confirm).toHaveBeenCalledOnce();
    confirm.mockRestore();
  });

  it('initialises Financial Settings from the current API-backed tax values', () => {
    expect(financialTaxForm({ legalName: 'Maya Ltd', countryCode: 'BD', taxIdentifierMasked: null, vatRegistered: true, vatNumberMasked: '•••42' })).toEqual({
      legalName: 'Maya Ltd', countryCode: 'BD', taxIdentifierMasked: '', vatRegistered: true, vatNumberMasked: '•••42',
    });
  });

  it('warns on unload and internal navigation, then becomes clean after save', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<DirtyHarness />);

    expect(screen.getByText('clean')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Value'));
    await user.type(screen.getByLabelText('Value'), 'changed');
    expect(screen.getByText('dirty')).toBeInTheDocument();

    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);

    await user.click(screen.getByRole('link', { name: 'Leave' }));
    expect(confirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('clean')).toBeInTheDocument();
    confirm.mockRestore();
  });
});

describe('HTTP(S)-only external references', () => {
  it('accepts complete HTTP(S) URLs and rejects malformed or unsafe schemes', () => {
    expect(safeHttpUrl('https://example.com/work')).toBe('https://example.com/work');
    expect(safeHttpUrl('http://localhost:3000/file')).toBe('http://localhost:3000/file');
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html,bad')).toBeNull();
    expect(safeHttpUrl('//example.com/file')).toBeNull();
    expect(validateOptionalHttpUrl('not a url')).toMatch(/http/);
    expect(validateHttpUrlList(['https://example.com', 'ftp://example.com'])).toMatch(/not a safe/);
  });

  it('keeps an unsafe tag out of the controlled value and exposes an inline error', async () => {
    const user = userEvent.setup();
    function UrlTags() {
      const [values, setValues] = useState<string[]>([]);
      return <SpTagInput id="urls" label="External links" value={values} onChange={setValues} validateItem={(value) => safeHttpUrl(value) ? null : 'Use HTTP or HTTPS.'} />;
    }
    render(<UrlTags />);
    await user.type(screen.getByLabelText('External links'), 'javascript:alert(1)');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Use HTTP or HTTPS.');
    expect(screen.queryByText('javascript:alert(1)', { selector: 'li span' })).not.toBeInTheDocument();
  });
});

describe('availability mutation feedback', () => {
  const capacity: ProviderCapacity = {
    maximumConcurrentOrders: 3,
    currentActiveOrders: 1,
    newOrderAvailability: false,
    manualApprovalWhenCapacityLow: true,
    capacityStatus: 'Unavailable',
    instantOrderAvailable: false,
  };

  it('reports success only after the API resolves', async () => {
    const mutate = vi.fn(async () => ({ ...capacity, newOrderAvailability: true, capacityStatus: 'Available' as const }));
    const pending = runAvailabilityMutation(capacity, mutate);
    expect(mutate).toHaveBeenCalledWith({ maximumConcurrentOrders: 3, newOrderAvailability: true, manualApprovalWhenCapacityLow: true });
    await expect(pending).resolves.toMatchObject({ available: true, feedback: { status: 'success' } });
  });

  it('preserves the visible prior value and reports an API failure', async () => {
    const result = await runAvailabilityMutation(capacity, async () => { throw new Error('offline'); });
    expect(result.available).toBe(false);
    expect(result.feedback.status).toBe('error');
    expect(result.feedback.message).toMatch(/previous setting was preserved/);
  });
});

describe('navigation and compliance regressions', () => {
  it('selects exactly one Earnings child while leaving the parent as the workspace context', () => {
    const earnings = menu[UserRole.SERVICE_PROVIDER][0].items.find((item) => item.label === 'Earnings & Payouts')!;
    const params = new URLSearchParams('tab=payouts');
    expect(isMenuHrefActive(earnings.href, '/dashboard/serviceprovider/earnings', params)).toBe(false);
    expect(earnings.children!.filter((child) => isMenuHrefActive(child.href, '/dashboard/serviceprovider/earnings', params)).map((child) => child.label)).toEqual(['Payouts']);

    const sidebar = source('../../components/layout/AppSidebar.tsx');
    expect(sidebar).toContain('isActive={active && !hasChildren}');
  });

  it('uses Client Brief terminology throughout provider-facing lead copy', () => {
    const files = ['LeadsWorkspace.tsx', 'leads/BriefDetail.tsx', 'leads/ProposalEditor.tsx'];
    for (const file of files) expect(source(`../../components/serviceprovider/${file}`)).not.toMatch(/>[^<]*opportunit|['"`]\s*[^'"`]*opportunit/i);
  });

  it('retains STUB disclosures and consumes the server earnings-preview rate without a frontend commission calculation', () => {
    const proposal = source('../../components/serviceprovider/leads/ProposalEditor.tsx');
    const earnings = source('../../components/serviceprovider/EarningsWorkspace.tsx');
    const contract = source('../../components/serviceprovider/workroom/ContractPanel.tsx');
    const dashboardLayout = source('../../app/dashboard/layout.tsx');
    const sandboxNotice = source('../../components/serviceprovider/SpSandboxNotice.tsx');
    expect(proposal).toMatch(/IFileSecurityScanner.*STUB/);
    expect(earnings).toMatch(/Payment Sandbox.*STUB/s);

    // Contract consent. This used to assert /STUB mechanism.*not a legal e-signature/, but
    // c31b574 consolidated ten per-panel STUB disclaimers into one environment-level
    // notice, so the "STUB mechanism" wording no longer lives here. The substantive
    // disclosure does — the consent dialog still tells the provider what they are NOT
    // signing — so this narrows to that rather than dropping the check.
    expect(contract).toMatch(/not a legal e-signature/);
    // ...and the STUB framing it lost is now centralised: mounted once for the whole SP
    // surface, and still naming contract signing specifically rather than only payments.
    expect(dashboardLayout).toMatch(/<SpSandboxNotice \/>/);
    expect(sandboxNotice).toMatch(/contract signing are simulated/);
    expect(proposal).toContain('percent(preview.rate)');
    expect(proposal).not.toMatch(/0\.12|12\s*\/\s*100|proposedPrice\s*\*\s*/);
  });

  it('displays the fixed 12% commission rate and amounts supplied by the API preview', () => {
    render(<ProposalEarningsPreview preview={{ price: 2150, rate: 0.12, commission: 258, net: 1892, currency: 'USD' }} />);
    expect(screen.getByText('Fixed platform commission (12%)')).toBeInTheDocument();
    expect(screen.getByText(/258\.00/)).toBeInTheDocument();
    expect(screen.getByText(/1,892\.00/)).toBeInTheDocument();
  });
});

function source(relativeUrl: string) {
  return readFileSync(new URL(relativeUrl, import.meta.url), 'utf8');
}
