import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useProfile } from '../useProfile'
import { mockProfile } from '../../test/mockData'

// Mock AuthContext with profile
const mockUseAuth = {
  profile: mockProfile,
  profileLoading: false,
  refreshProfile: () => Promise.resolve()
}

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth
}))

describe('useProfile', () => {
  beforeEach(() => {
    // Reset mock state if needed
  })

  it('should return profile from AuthContext', () => {
    const { result } = renderHook(() => useProfile())

    expect(result.current.profile).toEqual(mockProfile)
    expect(result.current.loading).toBe(false)
  })

  it('should provide updateProfile function', () => {
    const { result } = renderHook(() => useProfile())

    expect(typeof result.current.updateProfile).toBe('function')
  })
})
