import axiosInstance from '@/lib/axios'
import { entrepreneurApi } from '@/lib/api-entrepreneur'

jest.mock('@/lib/axios')

describe('Entrepreneur API - Comprehensive Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Phase 1: Company Creation', () => {
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

    it('getPhaseProgress should fetch phase data', async () => {
      const mockProgress = { companyId: '123', currentPhase: 2, completedPhases: [1] }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockProgress })

      const result = await entrepreneurApi.getPhaseProgress('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/progress')
      expect(result.currentPhase).toBe(2)
    })
  })

  describe('Phase 2: Legal Information & Documents', () => {
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
        '/companies/123/legal',
        legalData
      )
    })

    it('uploadDocument should upload file to S3', async () => {
      const formData = new FormData()
      formData.append('file', new File(['content'], 'document.pdf'))

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { documentId: 'doc-123', status: 'pending' },
      })

      const result = await entrepreneurApi.uploadDocument('123', formData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/documents',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      expect(result.documentId).toBe('doc-123')
    })

    it('getDocuments should list uploaded documents', async () => {
      const mockDocs = [
        { documentId: 'doc-1', status: 'approved' },
        { documentId: 'doc-2', status: 'pending' },
      ]

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockDocs })

      const result = await entrepreneurApi.getDocuments('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/documents')
      expect(result).toHaveLength(2)
    })

    it('updateBeneficialOwners should save owner information', async () => {
      const ownerData = {
        owners: [
          { fullName: 'John Doe', role: 'CEO', nationality: 'FR', ownershipPercent: 60 },
        ],
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.updateBeneficialOwners('123', ownerData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/beneficial-owners',
        ownerData
      )
    })
  })

  describe('Phase 3: Financial Information', () => {
    it('saveRevenue should store quarterly revenue', async () => {
      const revenueData = {
        q1Revenue: 10000,
        q2Revenue: 15000,
        q3Revenue: 20000,
        q4Revenue: 25000,
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.saveRevenue('123', revenueData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/revenue',
        revenueData
      )
    })

    it('calculateValuation should compute company valuation', async () => {
      const mockValuation = { arr: 70000, valuation: 350000 }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockValuation })

      const result = await entrepreneurApi.calculateValuation('123')

      expect(axiosInstance.post).toHaveBeenCalledWith('/companies/123/valuation')
      expect(result.valuation).toBe(350000)
    })

    it('saveEquityStructure should store cap table', async () => {
      const equityData = {
        shares: [
          { holder: 'Founder A', shares: 600000, type: 'Common' },
          { holder: 'Founder B', shares: 400000, type: 'Common' },
        ],
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.saveEquityStructure('123', equityData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/equity-structure',
        equityData
      )
    })

    it('saveFundingAsk should store funding requirements', async () => {
      const fundingData = {
        targetAmount: 500000,
        minimumAmount: 250000,
        useOfFunds: { product: 40, marketing: 30, operations: 30 },
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.saveFundingAsk('123', fundingData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/funding-ask',
        fundingData
      )
    })

    it('getFinancialSummary should fetch financial metrics', async () => {
      const mockSummary = {
        arr: 70000,
        mrr: 5833,
        growthPercent: 25,
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockSummary })

      const result = await entrepreneurApi.getFinancialSummary('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/financial-summary')
      expect(result.arr).toBe(70000)
    })
  })

  describe('Phase 4: Cap Table & Dilution', () => {
    it('getCapTable should fetch ownership structure', async () => {
      const mockCapTable = {
        totalShares: 1000000,
        holders: [
          { name: 'Founder A', shares: 600000, percentage: 60 },
        ],
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockCapTable })

      const result = await entrepreneurApi.getCapTable('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/cap-table')
      expect(result.totalShares).toBe(1000000)
    })

    it('simulateDilution should calculate 3 scenarios', async () => {
      const dilutionData = { raiseAmount: 10000000 }
      const mockScenarios = {
        scenarios: [
          { name: 'Series A 10M', postDilution: 90, founderOwnership: 54 },
          { name: 'Series A 20M', postDilution: 80, founderOwnership: 48 },
          { name: 'Series B 50M', postDilution: 65, founderOwnership: 39 },
        ],
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockScenarios })

      const result = await entrepreneurApi.simulateDilution('123', dilutionData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/dilution-simulation',
        dilutionData
      )
      expect(result.scenarios).toHaveLength(3)
    })
  })

  describe('Phase 6: Data Room', () => {
    it('uploadDataRoomDocument should upload to secure storage', async () => {
      const formData = new FormData()
      formData.append('file', new File(['content'], 'dataroom.pdf'))

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { success: true },
      })

      await entrepreneurApi.uploadDataRoomDocument('123', formData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/dataroom/documents',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
    })

    it('getDataRoom should list data room documents', async () => {
      const mockDataRoom = {
        documents: [
          { id: '1', name: 'Agreement', uploadedAt: '2023-01-01' },
        ],
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockDataRoom })

      const result = await entrepreneurApi.getDataRoom('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/dataroom')
      expect(result.documents).toHaveLength(1)
    })

    it('grantDataRoomAccess should grant investor access', async () => {
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.grantDataRoomAccess('123', 'investor@test.com', 'view', 30)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/dataroom/access',
        { investorId: 'investor@test.com', accessLevel: 'view', daysValid: 30 }
      )
    })

    it('revokeDataRoomAccess should remove investor access', async () => {
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.revokeDataRoomAccess('123', 'investor@test.com')

      expect(axiosInstance.delete).toHaveBeenCalledWith(
        '/companies/123/dataroom/access/investor@test.com'
      )
    })

    it('updateNdaRequirement should enforce NDA', async () => {
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.updateNdaRequirement('123', true)

      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/companies/123/dataroom/nda',
        true
      )
    })
  })

  describe('Phase 7: AI Review & Scoring', () => {
    it('runAiReview should trigger AI review', async () => {
      const mockReview = { reviewId: 'review-123', status: 'processing' }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockReview })

      const result = await entrepreneurApi.runAiReview('123')

      expect(axiosInstance.post).toHaveBeenCalledWith('/companies/123/ai-review')
      expect(result.status).toBe('processing')
    })

    it('getAiReview should fetch AI review results', async () => {
      const mockReview = {
        companyScore: 75,
        insights: 'Strong financial position',
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockReview })

      const result = await entrepreneurApi.getAiReview('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/ai-review')
      expect(result.companyScore).toBe(75)
    })

    it('getRecommendations should fetch improvement suggestions', async () => {
      const mockRecs = {
        recommendations: [
          { area: 'Marketing', priority: 'high', suggestion: 'Increase marketing spend' },
        ],
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockRecs })

      const result = await entrepreneurApi.getRecommendations('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/recommendations')
      expect(result.recommendations).toHaveLength(1)
    })

    it('awardInvestorReadyBadge should mark as investor-ready', async () => {
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { isInvestorReady: true },
      })

      const result = await entrepreneurApi.awardInvestorReadyBadge('123')

      expect(axiosInstance.post).toHaveBeenCalledWith('/companies/123/investor-ready')
      expect(result.isInvestorReady).toBe(true)
    })
  })

  describe('Phase 8: Investor Matching', () => {
    it('getInvestorMatches should fetch matched investors', async () => {
      const mockMatches = {
        matches: [
          { investorId: 'inv-1', name: 'VC Fund A', matchScore: 95 },
        ],
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockMatches })

      const result = await entrepreneurApi.getInvestorMatches('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/investor-matches')
      expect(result.matches).toHaveLength(1)
    })

    it('recordInvestorInteraction should track interaction', async () => {
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await entrepreneurApi.recordInvestorInteraction('123', 'match-1', 'intro', 'Initial meeting')

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/investor-interaction',
        { matchId: 'match-1', interactionType: 'intro', details: 'Initial meeting' }
      )
    })

    it('getMatchingInsights should fetch quality metrics', async () => {
      const mockInsights = {
        totalMatches: 5,
        avgScore: 85,
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockInsights })

      const result = await entrepreneurApi.getMatchingInsights('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/matching-insights')
      expect(result.totalMatches).toBe(5)
    })
  })

  describe('Phase 9: Deal Execution', () => {
    it('createDeal should initiate deal with investor', async () => {
      const termSheet = {
        totalRaiseAmount: 500000,
        postMoneyValuation: 2500000,
        equityType: 'Series A',
        investorEquityPercent: 20,
        proRataRights: true,
        status: 'draft',
      }

      const mockDeal = { dealId: 'deal-123', status: 'negotiating' }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockDeal })

      const result = await entrepreneurApi.createDeal('123', 'inv-1', termSheet)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/123/deals',
        { investorId: 'inv-1', termSheet }
      )
      expect(result.status).toBe('negotiating')
    })

    it('getDeal should fetch deal details', async () => {
      const mockDeal = { dealId: 'deal-123', status: 'negotiating' }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockDeal })

      const result = await entrepreneurApi.getDeal('deal-123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/deals/deal-123')
      expect(result.status).toBe('negotiating')
    })

    it('getCompanyDeals should fetch all company deals', async () => {
      const mockDeals = [
        { dealId: 'deal-1', status: 'negotiating' },
        { dealId: 'deal-2', status: 'closed' },
      ]

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockDeals })

      const result = await entrepreneurApi.getCompanyDeals('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123/deals')
      expect(result).toHaveLength(2)
    })

    it('progressChecklist should update closing checklist', async () => {
      const checklistItem = { item: 'docs-signed', completed: true, owner: 'Legal', dueDate: '2023-02-01' }

      const mockDeal = { dealId: 'deal-123', status: 'closing' }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockDeal })

      const result = await entrepreneurApi.progressChecklist('deal-123', checklistItem)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies/deals/deal-123/checklist',
        checklistItem
      )
      expect(result.status).toBe('closing')
    })

    it('closeDeal should finalize deal', async () => {
      const mockDeal = { dealId: 'deal-123', status: 'closed' }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockDeal })

      const result = await entrepreneurApi.closeDeal('deal-123')

      expect(axiosInstance.post).toHaveBeenCalledWith('/companies/deals/deal-123/close')
      expect(result.status).toBe('closed')
    })
  })

  describe('Background Jobs', () => {
    it('enqueueAiReview should queue job and return jobId', async () => {
      const mockJob = { jobId: 'job-123', status: 'queued' }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockJob })

      const result = await entrepreneurApi.enqueueAiReview('123')

      expect(axiosInstance.post).toHaveBeenCalledWith('/jobs/123/ai-review')
      expect(result.jobId).toBe('job-123')
    })

    it('getJobStatus should fetch job progress', async () => {
      const mockStatus = { status: 'processing', progress: 50 }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockStatus })

      const result = await entrepreneurApi.getJobStatus('job-123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/jobs/job-123')
      expect(result.status).toBe('processing')
    })
  })
})
