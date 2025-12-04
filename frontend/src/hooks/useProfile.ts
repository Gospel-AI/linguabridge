import { useState } from 'react'
import { workersApi, WorkerProfile } from '../services'
import { useAuth } from '../contexts/AuthContext'

export function useProfile() {
  const { profile, profileLoading, refreshProfile } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const updateProfile = async (updates: Partial<WorkerProfile>) => {
    try {
      setError(null)

      // Update profile via API
      const data = await workersApi.updateMyProfile(updates)
      
      // Refresh the profile in AuthContext
      await refreshProfile()

      return { success: true, data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
      setError(errorMessage)
      return { success: false, data: null, error: errorMessage }
    }
  }

  return {
    profile,
    loading: profileLoading,
    error,
    updateProfile,
    refreshProfile
  }
}
