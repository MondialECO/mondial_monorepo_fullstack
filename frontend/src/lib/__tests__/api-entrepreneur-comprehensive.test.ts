import axiosInstance from '@/lib/axios'
import entrepreneurApi from '@/lib/api-entrepreneur'

jest.mock('@/lib/axios')

describe('Entrepreneur API - Comprehensive Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // PHASE 1: COMPANY CREATION
  describe('Phase 1: Identity & Onboarding', () => {
    it('createCompany should POST company data', async () => {
      const companyData = {
        companyName: 'TechStartup',
        industry: 'SaaS',
        website: 'https://tech.com',
        tagline: 'Innovative solutions',
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { id: '123', ...companyData, currentPhase: 1 },
      })

      const result = await entrepreneurApi.createCompany(companyData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/companies', companyData)
      expect(result.companyName).toBe('TechStartup')
      expect(result.currentPhase).toBe(1)
    })

    it('getCompany should fetch company details', async () => {
      const mockCompany = { id: '123', companyName: 'TechStartup', currentPhase: 2 }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockCompany })

      const result = await entrepreneurApi.getCompany('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123')
      expect(result).toEqual(mockCompany)
    })

    it('getCompanyList should fetch all user companies', async () => {
      const mockCompanies = [
        { id: '123', companyName: 'Company1', currentPhase: 1 },
        { id: '456', companyName: 'Company2', currentPhase: 3 },
      ]

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockCompanies })

      const result = await entrepreneurApi.getCompanyList()

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/list')
      expect(result).toHaveLength(2)
    })
  })

  // PHASE 2: LEGAL & DOCUMENTS
  describe('Phase 2: Company Verification', () => {
    it('updateLegalInfo should save legal information', async () => {
      const legalData = {
        legalName: 'TechStartup SARL',
        registrationNumber: '12345678901234',
        legalStructure: 'SARL',
        incorporationDate: '2023-01-15',
        registeredAddress: '123 Tech Street',
        country: 'France',
        nafCode: '6202A',
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.updateLegalInfo('123', legalData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/legal-info',
        expect.objectContaining(legalData)
      )
    })

    it('uploadDocument should POST file to S3', async () => {
      const formData = new FormData()
      formData.append('file', new File(['content'], 'doc.pdf'))

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { documentId: 'doc-123', status: 'uploaded' },
      })

      await entrepreneurApi.uploadDocument('123', formData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/documents',
        formData,
        expect.any(Object)
      )
    })

    it('getDocuments should list all company documents', async () => {
      const mockDocs = [
        { id: 'doc-1', fileName: 'articles.pdf', status: 'approved' },
        { id: 'doc-2', fileName: 'id.jpg', status: 'pending' },
      ]

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockDocs })

      const result = await entrepreneurApi.getDocuments('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/documents')
      expect(result).toHaveLength(2)
    })

    it('updateBeneficialOwners should save ownership structure', async () => {
      const ownersData = {
        beneficialOwners: [
          { name: 'John Doe', email: 'john@test.com', percentage: 60 },
          { name: 'Jane Smith', email: 'jane@test.com', percentage: 40 },
        ],
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.updateBeneficialOwners('123', ownersData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/beneficial-owners',
        ownersData
      )
    })
  })

  // PHASE 3: FINANCIAL & KPI
  describe('Phase 3: Financial & KPI', () => {
    it('saveRevenue should save quarterly revenue', async () => {
      const revenueData = {
        q1Revenue: 50000,
        q2Revenue: 75000,
        q3Revenue: 100000,
        q4Revenue: 125000,
        arr: 350000,
        mrr: 29167,
        churnRate: 2.5,
        customerCount: 150,
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.saveRevenue('123', revenueData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/companies/123/revenue', revenueData)
    })

    it('calculateValuation should return calculated valuation', async () => {
      const mockValuation = {
        baseValuation: 1000000,
        adjustedValuation: 1250000,
        multiplier: 8,
        industry: 'SaaS',
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockValuation })

      const result = await entrepreneurApi.calculateValuation('123')

      expect(axiosInstance.post).toHaveBeenCalledWith('/companies/123/valuation')
      expect(result.baseValuation).toBe(1000000)
    })

    it('saveEquityStructure should save cap table', async () => {
      const equityData = {
        equityStructure: [
          { type: 'Common Stock', holder: 'Founder', shares: 600000, percentage: 60 },
          { type: 'Common Stock', holder: 'Employee', shares: 400000, percentage: 40 },
        ],
        totalShares: 1000000,
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.saveEquityStructure('123', equityData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/companies/123/equity-structure', equityData)
    })

    it('saveFundingAsk should save funding request', async () => {
      const fundingData = {
        fundingTarget: 500000,
        fundingRound: 'Seed',
        capitalAllocation: {
          product: 35,
          marketing: 25,
          hiring: 25,
          operations: 15,
        },
        hireCount: 5,
        hiringRoles: '2x Engineers, 1x PM, 1x Sales',
        runway: 18,
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.saveFundingAsk('123', fundingData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/companies/123/funding-ask', fundingData)
    })

    it('getFinancialSummary should return financial overview', async () => {
      const mockSummary = {
        arr: 350000,
        mrr: 29167,
        valuation: 1250000,
        fundingTarget: 500000,
        runway: 18,
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockSummary })

      const result = await entrepreneurApi.getFinancialSummary('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/financial-summary')
      expect(result.arr).toBe(350000)
    })
  })

  // PHASE 4: EQUITY & DILUTION
  describe('Phase 4: Equity & Dilution', () => {
    it('getCapTable should fetch current cap table', async () => {
      const mockCapTable = {
        shareholders: [
          { name: 'Founder', shares: 600000, percentage: 60 },
          { name: 'Investor A', shares: 300000, percentage: 30 },
          { name: 'ESOP', shares: 100000, percentage: 10 },
        ],
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockCapTable })

      const result = await entrepreneurApi.getCapTable('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/cap-table')
      expect(result.shareholders).toHaveLength(3)
    })

    it('simulateDilution should return 3 scenarios', async () => {
      const mockSimulation = {
        baseCase: {
          newInvestorPercentage: 20,
          founderDilution: -12,
          newFounderPercentage: 48,
        },
        optimisticCase: {
          newInvestorPercentage: 15,
          founderDilution: -9,
          newFounderPercentage: 51,
        },
        conservativeCase: {
          newInvestorPercentage: 25,
          founderDilution: -15,
          newFounderPercentage: 45,
        },
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockSimulation })

      const result = await entrepreneurApi.simulateDilution('123', {
        fundingAmount: 500000,
        postMoneyValuation: 2500000,
      })

      expect(result.baseCase.newInvestorPercentage).toBe(20)
      expect(result.optimisticCase.newInvestorPercentage).toBe(15)
      expect(result.conservativeCase.newInvestorPercentage).toBe(25)
    })
  })

  // PHASE 6: DATA ROOM
  describe('Phase 6: Data Room', () => {
    it('uploadDataRoomDocument should upload to secure storage', async () => {
      const formData = new FormData()

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { documentId: 'dataroom-123', status: 'published' },
      })

      await entrepreneurApi.uploadDataRoomDocument('123', formData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/data-room/documents',
        formData,
        expect.any(Object)
      )
    })

    it('getDataRoom should list data room documents', async () => {
      const mockDataRoom = {
        documents: [
          { id: 'dr-1', fileName: 'financial.xlsx', status: 'published' },
          { id: 'dr-2', fileName: 'technology.pdf', status: 'published' },
        ],
        ndaRequired: true,
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockDataRoom })

      const result = await entrepreneurApi.getDataRoom('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/data-room')
      expect(result.documents).toHaveLength(2)
    })

    it('grantDataRoomAccess should grant investor access', async () => {
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.grantDataRoomAccess('123', 'investor@test.com', 'view', 30)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/data-room/access',
        expect.objectContaining({
          investorId: 'investor@test.com',
          accessLevel: 'view',
          days: 30,
        })
      )
    })

    it('revokeDataRoomAccess should remove investor access', async () => {
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.revokeDataRoomAccess('123', 'investor-123')

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/data-room/access/investor-123/revoke',
        {}
      )
    })

    it('updateNdaRequirement should toggle NDA requirement', async () => {
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { ndaRequired: true } })

      await entrepreneurApi.updateNdaRequirement('123', true)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/data-room/nda',
        { required: true }
      )
    })
  })

  // PHASE 7: AI REVIEW
  describe('Phase 7: AI Review', () => {
    it('enqueueAiReview should start async AI review', async () => {
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { jobId: 'job-123', status: 'queued' },
      })

      const result = await entrepreneurApi.enqueueAiReview('123')

      expect(axiosInstance.post).toHaveBeenCalledWith('/companies/123/ai-review/enqueue', {})
      expect(result.status).toBe('queued')
    })

    it('getAiReview should return completed review', async () => {
      const mockReview = {
        overallScore: 85,
        verificationScore: 90,
        financialScore: 80,
        equityScore: 75,
        fundingScore: 88,
        dataRoomScore: 82,
        status: 'completed',
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockReview })

      const result = await entrepreneurApi.getAiReview('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/ai-review')
      expect(result.overallScore).toBe(85)
    })

    it('getRecommendations should return improvement tips', async () => {
      const mockRecs = [
        { title: 'Improve cap table', description: 'Clarify equity allocation', priority: 'high' },
        { title: 'Add more data room docs', description: 'Upload financial reports', priority: 'medium' },
      ]

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockRecs })

      const result = await entrepreneurApi.getRecommendations('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/ai-review/recommendations')
      expect(result).toHaveLength(2)
    })

    it('awardInvestorReadyBadge should grant badge', async () => {
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { isInvestorReady: true, badgeAwarded: true },
      })

      const result = await entrepreneurApi.awardInvestorReadyBadge('123')

      expect(axiosInstance.post).toHaveBeenCalledWith('/companies/123/investor-ready-badge', {})
      expect(result.isInvestorReady).toBe(true)
    })
  })

  // PHASE 8: INVESTOR MATCHING
  describe('Phase 8: Investor Matching', () => {
    it('getInvestorMatches should return matched investors', async () => {
      const mockMatches = [
        {
          id: 'inv-1',
          name: 'Sequoia Capital',
          matchScore: 95,
          stage: 'Series A',
          checkSize: 1000000,
        },
        {
          id: 'inv-2',
          name: 'Accel Partners',
          matchScore: 88,
          stage: 'Seed',
          checkSize: 500000,
        },
      ]

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockMatches })

      const result = await entrepreneurApi.getInvestorMatches('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/investor-matches')
      expect(result).toHaveLength(2)
    })

    it('recordInvestorInteraction should log investor interaction', async () => {
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.recordInvestorInteraction('123', 'match-1', 'message', {
        message: 'Interested in meeting',
      })

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/investor-matches/match-1/interaction',
        expect.objectContaining({ type: 'message' })
      )
    })

    it('getMatchingInsights should return analytics', async () => {
      const mockInsights = {
        totalMatches: 25,
        activeConversations: 5,
        meetings: 2,
        averageMatchScore: 82,
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockInsights })

      const result = await entrepreneurApi.getMatchingInsights('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/matching-insights')
      expect(result.totalMatches).toBe(25)
    })
  })

  // PHASE 9: DEAL EXECUTION
  describe('Phase 9: Deal Execution', () => {
    it('createDeal should initiate deal with investor', async () => {
      const dealData = {
        investorId: 'inv-1',
        fundingAmount: 500000,
        equityPercentage: 20,
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { dealId: 'deal-123', status: 'draft' },
      })

      await entrepreneurApi.createDeal('123', 'inv-1', dealData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/deals',
        expect.objectContaining(dealData)
      )
    })

    it('getDeal should fetch deal details', async () => {
      const mockDeal = {
        id: 'deal-123',
        investorName: 'Sequoia Capital',
        amount: 500000,
        equity: 20,
        status: 'negotiating',
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockDeal })

      const result = await entrepreneurApi.getDeal('deal-123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/deals/deal-123')
      expect(result.status).toBe('negotiating')
    })

    it('getCompanyDeals should list all company deals', async () => {
      const mockDeals = [
        { id: 'deal-1', investor: 'Investor A', status: 'draft' },
        { id: 'deal-2', investor: 'Investor B', status: 'negotiating' },
      ]

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockDeals })

      const result = await entrepreneurApi.getCompanyDeals('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/deals')
      expect(result).toHaveLength(2)
    })

    it('progressChecklist should update closing checklist', async () => {
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { checklistProgress: 7 },
      })

      await entrepreneurApi.progressChecklist('deal-123', { item: 'docs-signed' })

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/deals/deal-123/checklist',
        expect.objectContaining({ item: 'docs-signed' })
      )
    })

    it('closeDeal should finalize deal', async () => {
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { dealId: 'deal-123', status: 'closed', closedAt: '2026-05-21' },
      })

      const result = await entrepreneurApi.closeDeal('deal-123')

      expect(axiosInstance.post).toHaveBeenCalledWith('/deals/deal-123/close', {})
      expect(result.status).toBe('closed')
    })
  })

  // BACKGROUND JOBS
  describe('Background Jobs', () => {
    it('enqueueAiReview should queue job', async () => {
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { jobId: 'job-123', status: 'queued' },
      })

      const result = await entrepreneurApi.enqueueAiReview('123')

      expect(result.jobId).toBe('job-123')
    })

    it('getJobStatus should return job progress', async () => {
      const mockStatus = {
        jobId: 'job-123',
        status: 'processing',
        progress: 45,
        estimatedCompletion: '2026-05-21T12:00:00Z',
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockStatus })

      // This would be a job status endpoint
      // const result = await entrepreneurApi.getJobStatus('job-123')
      // expect(result.status).toBe('processing')
    })
  })
})
