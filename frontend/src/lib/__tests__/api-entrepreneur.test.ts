import axiosInstance from '@/lib/axios'
import { entrepreneurApi } from '@/lib/api-entrepreneur'

jest.mock('@/lib/axios')

describe('Entrepreneur API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createCompany', () => {
    it('should call POST /companies with company data', async () => {
      const mockCompany = {
        id: '123',
        companyName: 'Test Co',
        industry: 'SaaS',
        website: 'https://test.com',
        tagline: 'Test tagline',
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: mockCompany,
      })

      const result = await entrepreneurApi.createCompany({
        companyName: 'Test Co',
        industry: 'SaaS',
        website: 'https://test.com',
        tagline: 'Test tagline',
      })

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/companies',
        expect.objectContaining({
          companyName: 'Test Co',
        })
      )
      expect(result).toEqual(mockCompany)
    })
  })

  describe('getCompany', () => {
    it('should call GET /companies/{id}', async () => {
      const mockCompany = {
        id: '123',
        companyName: 'Test Co',
        currentPhase: 1,
        trustScore: 50,
      }

      ;(axiosInstance.get as jest.Mock).mockResolvedValue({
        data: mockCompany,
      })

      const result = await entrepreneurApi.getCompany('123')

      expect(axiosInstance.get).toHaveBeenCalledWith('/companies/123')
      expect(result).toEqual(mockCompany)
    })
  })

  describe('updateLegalInfo', () => {
    it('should call POST /companies/{id}/legal with legal data', async () => {
      const companyId = '123'
      const legalData = {
        legalName: 'Test SARL',
        registrationNumber: '12345678901234',
        legalStructure: 'SARL',
        incorporationDate: '2023-01-01',
        registeredAddress: '123 Main St',
        country: 'France',
        nafCode: '6202A',
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { success: true },
      })

      await entrepreneurApi.updateLegalInfo(companyId, legalData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        `/companies/${companyId}/legal`,
        legalData
      )
    })
  })

  describe('saveRevenue', () => {
    it('should call POST /companies/{id}/revenue with revenue data', async () => {
      const companyId = '123'
      const revenueData = {
        q1Revenue: 10000,
        q2Revenue: 15000,
        q3Revenue: 20000,
        q4Revenue: 25000,
      }

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { success: true },
      })

      await entrepreneurApi.saveRevenue(companyId, revenueData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        `/companies/${companyId}/revenue`,
        revenueData
      )
    })
  })

  describe('uploadDocument', () => {
    it('should call POST /companies/{id}/documents with FormData', async () => {
      const companyId = '123'
      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.pdf'))

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { documentId: 'doc-123' },
      })

      await entrepreneurApi.uploadDocument(companyId, formData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        `/companies/${companyId}/documents`,
        formData,
        expect.any(Object)
      )
    })
  })

  describe('enqueueAiReview', () => {
    it('should call POST /jobs/{id}/ai-review', async () => {
      const companyId = '123'

      ;(axiosInstance.post as jest.Mock).mockResolvedValue({
        data: { jobId: 'job-123', status: 'queued' },
      })

      const result = await entrepreneurApi.enqueueAiReview(companyId)

      expect(axiosInstance.post).toHaveBeenCalledWith(`/jobs/${companyId}/ai-review`)
      expect(result.jobId).toBe('job-123')
    })
  })
})
