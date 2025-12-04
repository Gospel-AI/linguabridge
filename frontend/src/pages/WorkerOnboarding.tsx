import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { workersApi } from '../services'

interface OnboardingStep1Data {
  fullName: string
  location: string
  languagePairs: string[]
}

interface OnboardingStep2Data {
  selectedDomains: string[]
}

export function WorkerOnboarding() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Basic Information
  const [step1Data, setStep1Data] = useState<OnboardingStep1Data>({
    fullName: '',
    location: '',
    languagePairs: []
  })

  // Step 2: Domain Selection
  const [step2Data, setStep2Data] = useState<OnboardingStep2Data>({
    selectedDomains: []
  })

  const domains = [
    {
      id: 'translation',
      title: 'Translation/Localization Validation 🌍',
      description: 'Evaluate translation quality, cultural appropriateness, and localization accuracy',
      trainingTime: '30 minutes'
    },
    {
      id: 'ai_verification',
      title: 'AI Verification & Improvement 🤖',
      description: 'Check AI content quality, detect bias and hallucinations, verify accuracy',
      trainingTime: '30 minutes'
    },
    {
      id: 'physical_data',
      title: 'Data Collection & Verification (Physical) 📍',
      description: 'Collect location-based data, verify physical information, take photos',
      trainingTime: '25 minutes'
    }
  ]

  const languageOptions = [
    'English - Spanish',
    'English - French',
    'English - German',
    'English - Chinese',
    'English - Japanese',
    'English - Korean',
    'Spanish - English',
    'French - English',
    'Other'
  ]

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!step1Data.fullName || !step1Data.location || step1Data.languagePairs.length === 0) {
      setError('Please fill in all required fields')
      return
    }
    setError(null)
    setCurrentStep(2)
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step2Data.selectedDomains.length === 0) {
      setError('Please select at least one domain')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Convert language pairs to proper format
      // For simplicity, assuming each language can be both source and target
      const languagePairs = step1Data.languagePairs.flatMap(lang => {
        // Extract language code from format like "English - Japanese (EN-JA)"
        const match = lang.match(/\(([A-Z]+)-([A-Z]+)\)/)
        if (match) {
          return [
            { source: match[1].toLowerCase(), target: match[2].toLowerCase() },
            { source: match[2].toLowerCase(), target: match[1].toLowerCase() }
          ]
        }
        // Fallback: if no match, create a simple pair
        return [{ source: 'en', target: 'ja' }]
      })

      // Update worker profile via API
      await workersApi.updateMyProfile({
        full_name: step1Data.fullName,
        language_pairs: languagePairs,
        specialized_domains: step2Data.selectedDomains
      })

      // Navigate to training modules
      navigate('/worker/training')
    } catch (err: any) {
      console.error('Error creating worker profile:', err)
      setError(err.message || 'Failed to create worker profile')
    } finally {
      setLoading(false)
    }
  }

  const toggleDomain = (domainId: string) => {
    setStep2Data(prev => ({
      selectedDomains: prev.selectedDomains.includes(domainId)
        ? prev.selectedDomains.filter(d => d !== domainId)
        : [...prev.selectedDomains, domainId]
    }))
  }

  const toggleLanguagePair = (lang: string) => {
    setStep1Data(prev => ({
      ...prev,
      languagePairs: prev.languagePairs.includes(lang)
        ? prev.languagePairs.filter(l => l !== lang)
        : [...prev.languagePairs, lang]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Worker Onboarding
          </h1>
          <p className="text-gray-600">
            Complete your profile to start earning with TaskBridge
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of 2
            </span>
            <span className="text-sm text-gray-600">
              {currentStep === 1 ? 'Basic Information' : 'Domain Selection'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={step1Data.fullName}
                  onChange={(e) => setStep1Data(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={step1Data.location}
                  onChange={(e) => setStep1Data(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  placeholder="Accra, Ghana"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language Proficiency * (select all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {languageOptions.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguagePair(lang)}
                      className={`px-4 py-3 border-2 rounded-md text-left transition-colors ${
                        step1Data.languagePairs.includes(lang)
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
              >
                Continue to Domain Selection →
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Domain Selection */}
        {currentStep === 2 && (
          <form onSubmit={handleStep2Submit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Select Your Specialization</h2>
            <p className="text-gray-600 mb-6">
              Choose the domains you want to work in. You'll complete a short training for each domain.
            </p>

            <div className="space-y-4 mb-8">
              {domains.map(domain => (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() => toggleDomain(domain.id)}
                  className={`w-full p-6 border-2 rounded-lg text-left transition-all ${
                    step2Data.selectedDomains.includes(domain.id)
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{domain.title}</h3>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      step2Data.selectedDomains.includes(domain.id)
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-gray-300'
                    }`}>
                      {step2Data.selectedDomains.includes(domain.id) && (
                        <span className="text-white text-sm">✓</span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">{domain.description}</p>
                  <p className="text-sm text-gray-500">
                    📚 Training time: {domain.trainingTime}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Creating Profile...' : 'Start Training →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
