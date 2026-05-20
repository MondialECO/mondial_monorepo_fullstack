import { renderHook, act } from '@testing-library/react'
import { useDraftPersistence } from '@/hooks/useDraftPersistence'

describe('useDraftPersistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with provided initial value', () => {
    const initialData = { name: '', email: '' }
    const { result } = renderHook(() => useDraftPersistence('test-draft', initialData))

    expect(result.current.data).toEqual(initialData)
    expect(result.current.isHydrated).toBe(true)
  })

  it('should save data to localStorage on update', () => {
    const { result } = renderHook(() => useDraftPersistence('test-draft', { name: '' }))

    act(() => {
      result.current.setData({ name: 'John Doe' })
    })

    expect(localStorage.getItem('test-draft')).toBe(JSON.stringify({ name: 'John Doe' }))
  })

  it('should load data from localStorage on mount', () => {
    const savedData = { name: 'Jane Doe', email: 'jane@test.com' }
    localStorage.setItem('test-draft', JSON.stringify(savedData))

    const { result } = renderHook(() => useDraftPersistence('test-draft', { name: '', email: '' }))

    expect(result.current.data).toEqual(savedData)
  })

  it('should clear draft data', () => {
    const { result } = renderHook(() => useDraftPersistence('test-draft', { name: '' }))

    act(() => {
      result.current.setData({ name: 'Test' })
    })

    expect(localStorage.getItem('test-draft')).toBeTruthy()

    act(() => {
      result.current.clearDraft()
    })

    expect(localStorage.getItem('test-draft')).toBeNull()
    expect(result.current.data).toEqual({ name: '' })
  })

  it('should handle update function as parameter', () => {
    const { result } = renderHook(() => useDraftPersistence('test-draft', { count: 0 }))

    act(() => {
      result.current.setData((prev) => ({ count: prev.count + 1 }))
    })

    expect(result.current.data.count).toBe(1)
  })
})
