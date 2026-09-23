import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ForecastPrintView from '@/components/creator/ForecastPrintView';

describe('ForecastPrintView (Step 3.3 Dedicated PDF Print View)', () => {
  const sampleInputs = {
    budget: 45000,
    launchSubs: 80,
    growth: 16,
    churn: 4,
    arpu: 35,
    varCost: 5,
    opex: 8500,
    tam: 1_200_000_000,
  };

  const sampleOutput = {
    revenueForecast: {
      currency: 'EUR',
      year1Total: 65000,
      year2Total: 180000,
      year3Total: 420000,
      monthly: [],
    },
    costForecast: {
      currency: 'EUR',
      year1Total: 110000,
      year2Total: 135000,
      year3Total: 170000,
      monthly: [],
    },
    cashFlowProjection: {
      currency: 'EUR',
      monthly: [],
    },
    breakEvenAnalysis: {
      isAchievedWithinHorizon: true,
      breakEvenMonth: 15,
      breakEvenRevenue: 9800,
      breakEvenSubscribers: 280,
      runwayMonths: 18,
    },
  };

  it('renders dedicated Step 3.3 Financial Forecast header and zero Business Plan sections', () => {
    render(
      <ForecastPrintView
        open={true}
        onClose={vi.fn()}
        projectName="EcoTrack SaaS"
        project={{ sector: 'CleanTech', geography: 'France' }}
        inputs={sampleInputs}
        output={sampleOutput}
      />
    );

    // Verify 3.3 Eyebrow & Title
    expect(screen.getByText('STEP 3.3 · FINANCIAL FORECAST')).toBeInTheDocument();
    expect(screen.getByText(/Your 3-year financial forecast : EcoTrack SaaS/)).toBeInTheDocument();
    expect(screen.getByText(/36 months · Months 1–12 modelled, 13–36 projected · EUR/)).toBeInTheDocument();

    // Verify Verdict Hero Card
    expect(screen.getByText(/You break even in/)).toBeInTheDocument();
    expect(screen.getByText('month 15')).toBeInTheDocument();

    // Verify 3 Summary Cards
    expect(screen.getByText('REVENUE')).toBeInTheDocument();
    expect(screen.getByText('COST VS REVENUE')).toBeInTheDocument();
    expect(screen.getByText('CASH POSITION')).toBeInTheDocument();

    // Verify 36-Month Projections Table
    expect(screen.getByText('36-MONTH CONSOLIDATED FINANCIAL PROJECTIONS (EUR)')).toBeInTheDocument();
    expect(screen.getByText('Year 1 · Modelled')).toBeInTheDocument();
    expect(screen.getByText('Year 2 · Projected')).toBeInTheDocument();
    expect(screen.getByText('Year 3 · Projected')).toBeInTheDocument();
    expect(screen.getByText('Y1 SUBTOTAL')).toBeInTheDocument();
    expect(screen.getByText('Y2 SUBTOTAL')).toBeInTheDocument();
    expect(screen.getByText('Y3 SUBTOTAL')).toBeInTheDocument();

    // Verify Break-Even & Unit Economics
    expect(screen.getByText('BREAK-EVEN ANALYSIS')).toBeInTheDocument();
    expect(screen.getByText('UNIT ECONOMICS')).toBeInTheDocument();

    // CRITICAL REQUIREMENT: Business Plan sections MUST NOT be present
    expect(screen.queryByText('1. Executive Summary')).not.toBeInTheDocument();
    expect(screen.queryByText('2. Problem & Solution')).not.toBeInTheDocument();
    expect(screen.queryByText('3. Target Market')).not.toBeInTheDocument();
    expect(screen.queryByText('4. Competitor Analysis')).not.toBeInTheDocument();
    expect(screen.queryByText('6. Go-to-Market')).not.toBeInTheDocument();
    expect(screen.queryByText('7. Operations')).not.toBeInTheDocument();
    expect(screen.queryByText('10. Legal Framework')).not.toBeInTheDocument();
  });

  it('tolerates missing inputs and renders closed state gracefully', () => {
    const { container } = render(
      <ForecastPrintView
        open={false}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
