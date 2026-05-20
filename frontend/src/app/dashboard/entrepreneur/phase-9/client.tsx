'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Plus,
  Save,
  X,
  ChevronDown,
} from 'lucide-react';
import { entrepreneurApi } from '@/lib/api-entrepreneur';

interface Deal {
  id: string;
  investorName: string;
  amount: number;
  valuation: number;
  equityPercent: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface TermSheet {
  totalRaiseAmount: number;
  postMoneyValuation: number;
  equityType: string;
  investorEquityPercent: number;
  proRataRights: boolean;
}

interface ChecklistItem {
  id: string;
  item: string;
  completed: boolean;
  dueDate: string;
  owner?: string;
}

export default function DealExecutionClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [termSheet, setTermSheet] = useState<TermSheet | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isEditingTermSheet, setIsEditingTermSheet] = useState(false);
  const [termSheetDraft, setTermSheetDraft] = useState<TermSheet | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editTimer, setEditTimer] = useState<NodeJS.Timeout | null>(null);

  // Create deal form state
  const [createForm, setCreateForm] = useState({
    investorId: '',
    totalRaiseAmount: '',
    postMoneyValuation: '',
    equityType: 'Series A',
    investorEquityPercent: '',
  });

  useEffect(() => {
    const id = localStorage.getItem('companyId') || '';
    setCompanyId(id);

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const dealsData = await entrepreneurApi.getCompanyDeals(id);
        setDeals(dealsData || []);
        if (dealsData && dealsData.length > 0) {
          setSelectedDeal(dealsData[0]);
          await fetchDealDetails(dealsData[0].id);
        }
      } catch (err) {
        setError('Failed to load deals');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, []);

  const fetchDealDetails = async (dealId: string) => {
    try {
      const deal = await entrepreneurApi.getDeal(dealId);
      setTermSheet(deal.termSheet);
      setChecklist(deal.checklist || []);
    } catch (err) {
      console.error('Failed to fetch deal details:', err);
    }
  };

  const handleSelectDeal = async (deal: Deal) => {
    setSelectedDeal(deal);
    setActiveTab('overview');
    await fetchDealDetails(deal.id);
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newDeal = await entrepreneurApi.createDeal(companyId, createForm.investorId, {
        totalRaiseAmount: parseFloat(createForm.totalRaiseAmount),
        postMoneyValuation: parseFloat(createForm.postMoneyValuation),
        equityType: createForm.equityType,
        investorEquityPercent: parseFloat(createForm.investorEquityPercent),
        proRataRights: true,
        status: 'draft',
      });
      setDeals([...deals, newDeal]);
      setShowCreateModal(false);
      setCreateForm({
        investorId: '',
        totalRaiseAmount: '',
        postMoneyValuation: '',
        equityType: 'Series A',
        investorEquityPercent: '',
      });
    } catch (err) {
      setError('Failed to create deal');
      console.error(err);
    }
  };

  const handleTermSheetChange = (key: keyof TermSheet, value: any) => {
    const newDraft = { ...termSheetDraft, [key]: value };
    setTermSheetDraft(newDraft);

    // Debounce save
    if (editTimer) clearTimeout(editTimer);
    const timer = setTimeout(async () => {
      if (selectedDeal) {
        setIsSaving(true);
        try {
          await entrepreneurApi.updateTermSheet(selectedDeal.id, newDraft);
          setTermSheet(newDraft);
        } catch (err) {
          setError('Failed to save term sheet');
          console.error(err);
        } finally {
          setIsSaving(false);
        }
      }
    }, 400);
    setEditTimer(timer);
  };

  const handleChecklistToggle = async (itemId: string, completed: boolean) => {
    if (!selectedDeal) return;
    try {
      await entrepreneurApi.progressChecklist(selectedDeal.id, {
        item: itemId,
        completed,
        owner: 'entrepreneur',
      });
      setChecklist(
        checklist.map((item) => (item.id === itemId ? { ...item, completed } : item))
      );
    } catch (err) {
      setError('Failed to update checklist');
      console.error(err);
    }
  };

  const handleCloseDeal = async () => {
    if (!selectedDeal) return;
    try {
      await entrepreneurApi.closeDeal(selectedDeal.id);
      setDeals(
        deals.map((d) =>
          d.id === selectedDeal.id ? { ...d, status: 'closed' } : d
        )
      );
      setSelectedDeal({ ...selectedDeal, status: 'closed' });
    } catch (err) {
      setError('Failed to close deal');
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
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">Deal Execution</h1>
            <p className="text-sm text-neutral-5 mt-0.5">Manage term sheets, negotiations, and closing</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 ml-4 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Deal List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-semibold text-neutral-1">Active Deals</h3>
            {deals.length === 0 ? (
              <div className="bg-white rounded-lg border border-neutral-2 p-4 text-center text-sm text-neutral-5">
                No deals yet
              </div>
            ) : (
              deals.map((deal) => (
                <button
                  key={deal.id}
                  onClick={() => handleSelectDeal(deal)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    selectedDeal?.id === deal.id
                      ? 'bg-primary/5 border-primary'
                      : 'bg-white border-neutral-2 hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium text-neutral-1 text-sm">{deal.investorName}</p>
                  <p className="text-xs text-neutral-5 mt-1">€{deal.amount.toLocaleString()}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                    deal.status === 'closed'
                      ? 'bg-green-100 text-green-700'
                      : deal.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {deal.status}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Deal Details */}
          <div className="lg:col-span-3">
            {selectedDeal ? (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-neutral-2 overflow-x-auto">
                  {['overview', 'terms', 'checklist', 'history'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                        activeTab === tab
                          ? 'border-primary text-primary'
                          : 'border-transparent text-neutral-5 hover:text-neutral-1'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg border border-neutral-2 p-4">
                        <p className="text-xs text-neutral-5 font-semibold uppercase">Amount</p>
                        <p className="text-2xl font-bold text-primary mt-2">€{selectedDeal.amount.toLocaleString()}</p>
                      </div>
                      <div className="bg-white rounded-lg border border-neutral-2 p-4">
                        <p className="text-xs text-neutral-5 font-semibold uppercase">Valuation</p>
                        <p className="text-2xl font-bold text-neutral-1 mt-2">€{selectedDeal.valuation.toLocaleString()}</p>
                      </div>
                      <div className="bg-white rounded-lg border border-neutral-2 p-4">
                        <p className="text-xs text-neutral-5 font-semibold uppercase">Equity %</p>
                        <p className="text-2xl font-bold text-neutral-1 mt-2">{selectedDeal.equityPercent}%</p>
                      </div>
                    </div>
                    {selectedDeal.status !== 'closed' && (
                      <Button onClick={handleCloseDeal} className="w-full">
                        Close Deal
                      </Button>
                    )}
                  </div>
                )}

                {/* Term Sheet Tab */}
                {activeTab === 'terms' && termSheet && (
                  <div className="bg-white rounded-lg border border-neutral-2 p-6 space-y-4">
                    {isEditingTermSheet ? (
                      <>
                        <div>
                          <label className="text-sm font-medium text-neutral-1">Raise Amount</label>
                          <Input
                            type="number"
                            value={termSheetDraft?.totalRaiseAmount || ''}
                            onChange={(e) =>
                              handleTermSheetChange('totalRaiseAmount', parseFloat(e.target.value))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-neutral-1">Post-Money Valuation</label>
                          <Input
                            type="number"
                            value={termSheetDraft?.postMoneyValuation || ''}
                            onChange={(e) =>
                              handleTermSheetChange('postMoneyValuation', parseFloat(e.target.value))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-neutral-1">Investor Equity %</label>
                          <Input
                            type="number"
                            value={termSheetDraft?.investorEquityPercent || ''}
                            onChange={(e) =>
                              handleTermSheetChange('investorEquityPercent', parseFloat(e.target.value))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setIsEditingTermSheet(false);
                              setTermSheetDraft(null);
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => setIsEditingTermSheet(false)}
                            disabled={isSaving}
                            className="flex-1 gap-2"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Done
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-neutral-5 font-semibold uppercase">Raise Amount</p>
                            <p className="text-lg font-bold text-neutral-1 mt-1">€{termSheet.totalRaiseAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-5 font-semibold uppercase">Post-Money Valuation</p>
                            <p className="text-lg font-bold text-neutral-1 mt-1">€{termSheet.postMoneyValuation.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-5 font-semibold uppercase">Investor Equity</p>
                            <p className="text-lg font-bold text-neutral-1 mt-1">{termSheet.investorEquityPercent}%</p>
                          </div>
                        </div>
                        {selectedDeal.status !== 'closed' && (
                          <Button
                            onClick={() => {
                              setIsEditingTermSheet(true);
                              setTermSheetDraft(termSheet);
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            Edit Terms
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Checklist Tab */}
                {activeTab === 'checklist' && (
                  <div className="bg-white rounded-lg border border-neutral-2 p-6 space-y-3">
                    {checklist.length === 0 ? (
                      <p className="text-neutral-5">No checklist items</p>
                    ) : (
                      checklist.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 border border-neutral-2 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={(e) => handleChecklistToggle(item.id, e.target.checked)}
                            disabled={selectedDeal.status === 'closed'}
                            className="w-5 h-5 rounded border-2 border-neutral-2 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p
                              className={`font-medium text-sm ${
                                item.completed
                                  ? 'text-neutral-5 line-through'
                                  : 'text-neutral-1'
                              }`}
                            >
                              {item.item}
                            </p>
                            <p className="text-xs text-neutral-5 mt-1">Due: {item.dueDate}</p>
                          </div>
                          {item.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="bg-white rounded-lg border border-neutral-2 p-6">
                    <p className="text-sm text-neutral-5 mb-4">Deal created on {new Date(selectedDeal.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-neutral-5">Last updated {new Date(selectedDeal.updatedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-neutral-2 p-8 text-center">
                <p className="text-neutral-5 mb-4">No deal selected</p>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Deal
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Create Deal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-neutral-1">Create New Deal</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-neutral-100 rounded"
                >
                  <X className="w-5 h-5 text-neutral-5" />
                </button>
              </div>
              <form onSubmit={handleCreateDeal} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-1">Investor ID</label>
                  <Input
                    value={createForm.investorId}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, investorId: e.target.value })
                    }
                    placeholder="Enter investor ID"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-1">Raise Amount</label>
                  <Input
                    type="number"
                    value={createForm.totalRaiseAmount}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, totalRaiseAmount: e.target.value })
                    }
                    placeholder="500000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-1">Post-Money Valuation</label>
                  <Input
                    type="number"
                    value={createForm.postMoneyValuation}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, postMoneyValuation: e.target.value })
                    }
                    placeholder="2500000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-1">Investor Equity %</label>
                  <Input
                    type="number"
                    value={createForm.investorEquityPercent}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, investorEquityPercent: e.target.value })
                    }
                    placeholder="20"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Deal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 justify-between mt-8">
          <Button variant="outline" onClick={() => router.push('/dashboard/entrepreneur')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
