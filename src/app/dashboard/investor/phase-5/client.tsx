'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Deal {
  companyId: string;
  companyName: string;
  stage: string;
  fundingAsk: number;
  sector: string;
  founderName: string;
  createdAt: string;
}

export default function Phase5Client() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState('');

  useEffect(() => {
    fetchDeals();
  }, [sectorFilter]);

  const fetchDeals = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = sectorFilter ? `?sector=${sectorFilter}` : '';
      const res = await axios.get(`/api/investor/deals${params}`);
      setDeals(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load deals');
    } finally {
      setIsLoading(false);
    }
  };

  const sectors = ['SaaS', 'FinTech', 'HealthTech', 'ClimaTech', 'AI/ML', 'Biotech'];

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-1 mb-2">Phase 5: Deal Discovery</h1>
        <p className="text-neutral-5 mb-6">
          Explore investment opportunities from vetted entrepreneurs.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 bg-white rounded-lg border border-neutral-2 p-4">
          <h3 className="text-sm font-semibold text-neutral-1 mb-3">Filter by Sector</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSectorFilter('')}
              variant={sectorFilter === '' ? 'default' : 'outline'}
              className="text-sm"
            >
              All Sectors
            </Button>
            {sectors.map((sector) => (
              <Button
                key={sector}
                onClick={() => setSectorFilter(sector)}
                variant={sectorFilter === sector ? 'default' : 'outline'}
                className="text-sm"
              >
                {sector}
              </Button>
            ))}
          </div>
        </div>

        {/* Deal Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-neutral-5">Loading deals...</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-2 p-8 text-center">
            <p className="text-neutral-5">No deals found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <div
                key={deal.companyId}
                className="bg-white rounded-lg border border-neutral-2 p-6 hover:shadow-lg transition"
              >
                <h3 className="text-lg font-bold text-neutral-1 mb-2">{deal.companyName}</h3>
                <div className="space-y-2 text-sm text-neutral-5 mb-4">
                  <p>
                    <strong>Sector:</strong> {deal.sector}
                  </p>
                  <p>
                    <strong>Stage:</strong> {deal.stage}
                  </p>
                  <p>
                    <strong>Funding Ask:</strong> €{deal.fundingAsk?.toLocaleString() || '0'}
                  </p>
                  <p>
                    <strong>Founder:</strong> {deal.founderName}
                  </p>
                </div>
                <Button onClick={() => router.push(`/dashboard/investor/deals/${deal.companyId}`)} className="w-full">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
